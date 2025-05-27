from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import ChatRoom, Message, AIResponse
from .serializers import (
    ChatRoomSerializer,
    ChatRoomCreateSerializer,
    MessageSerializer,
    AIResponseSerializer,
)
from django.db.models import Q, F, Max, Count
from django.utils import timezone
from ai_model.ml.prediction import get_diagnosis
import logging

logger = logging.getLogger("chat")


class IsChatParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Check if user is a participant in the chat room
        if isinstance(obj, ChatRoom):
            return request.user in obj.participants.all()

        # Check for messages within chat rooms
        if isinstance(obj, Message):
            return request.user in obj.chat_room.participants.all()

        return False


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]

    def get_serializer_class(self):
        if self.action == "create":
            return ChatRoomCreateSerializer
        return ChatRoomSerializer

    def get_queryset(self):
        return (
            ChatRoom.objects.filter(participants=self.request.user)
            .annotate(last_message_time=Max("messages__sent_at"))
            .order_by(F("last_message_time").desc(nulls_last=True))
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chat_room = serializer.save()

        # Sử dụng ChatRoomSerializer để serialize kết quả trả về
        response_serializer = ChatRoomSerializer(
            chat_room, context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        chat_room = self.get_object()
        messages = chat_room.messages.all()

        # Mark messages as read
        unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
        unread_messages.update(is_read=True)

        # Ensure we have a valid queryset
        if not isinstance(messages, list) and not hasattr(messages, "__iter__"):
            messages = []

        # Paginate results
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        chat_room = self.get_object()
        content = request.data.get("content")

        logger.info(f"Received message content: {content}")
        logger.info(f"Chat room is_ai_chat: {chat_room.is_ai_chat}")

        if not content:
            return Response(
                {"detail": "Message content cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the user message
        user_message = Message.objects.create(
            chat_room=chat_room, sender=request.user, content=content
        )

        messages = [MessageSerializer(user_message).data]

        # If this is an AI chat, generate AI response
        if chat_room.is_ai_chat:
            logger.info(f"Generating AI response for content: {content}")
            ai_response = self._generate_ai_response(content, request.user)
            logger.info(f"Generated AI response: {ai_response}")

            # Create AI message
            ai_message = Message.objects.create(
                chat_room=chat_room, content=ai_response, is_ai_message=True
            )

            messages.append(MessageSerializer(ai_message).data)

        return Response({"messages": messages})

    def _generate_ai_response(self, query, user):
        """
        Generate AI response to user query
        This is a simplified version - in production, you'd use a more sophisticated AI model
        """
        logger.info(f"Inside _generate_ai_response ~ query: {query}")
        query_lower = query.lower()
        logger.info(f"Query after lower(): {query_lower}")

        # For medical symptom queries, use the existing AI model
        health_keywords = [
            "symptom",
            "sick",
            "pain",
            "feeling",
            "health",
            "have",
            "got",
            "experiencing",
            "suffering",
            "fever",
            "cough",
            "tired",
            "fatigue",
            "throat",
            "headache",
            "body",
            "ache",
            "ill",
            "unwell",
            "not feeling",
        ]

        if any(keyword in query_lower for keyword in health_keywords):
            # Extract symptoms from query (simplified)
            # In a real app, you'd use NLP to extract symptoms
            symptom_values = [0] * 9  # Assuming 9 symptoms in the model

            # Simple keyword matching (just for demonstration)
            if "fever" in query_lower:
                symptom_values[0] = 1
            if "cough" in query_lower:
                symptom_values[1] = 1
            if "sneez" in query_lower:
                symptom_values[2] = 1
            if "fatigue" in query_lower or "tired" in query_lower:
                symptom_values[3] = 1
            if "taste" in query_lower:
                symptom_values[4] = 1
            if "eye" in query_lower and "itch" in query_lower:
                symptom_values[5] = 1
            if "throat" in query_lower and (
                "sore" in query_lower or "pain" in query_lower
            ):
                symptom_values[6] = 1
            if "body" in query_lower and (
                "ache" in query_lower or "pain" in query_lower
            ):
                symptom_values[7] = 1
            if "chill" in query_lower:
                symptom_values[8] = 1

            # Get diagnosis if at least one symptom is present
            if sum(symptom_values) > 0:
                result = get_diagnosis(symptom_values)
                logger.info(f"Diagnosis result: {result}")

                response = f"Based on your symptoms, you may have {result['diagnosis']} with a confidence of {int(result['confidence'] * 100)}%. "
                response += f"I recommend {result['test_recommendation']} and consider {result['medicine_recommendation']}."

                # Save the AI response
                AIResponse.objects.create(query=query, response=response, user=user)

                return response

            # If no specific symptoms detected but health-related query
            return "I notice you're asking about health concerns. Could you please describe your specific symptoms? For example: fever, cough, fatigue, etc. This will help me provide a more accurate assessment."

        # Greeting responses
        if any(word in query_lower for word in ["hello", "hi", "hey", "greetings"]):
            return "Hello! I'm your AI health assistant. I can help assess your symptoms and provide general health information. What health concerns would you like to discuss?"

        # Gratitude responses
        if any(word in query_lower for word in ["thank", "thanks", "appreciate"]):
            return "You're welcome! Remember, I'm here 24/7 to help with your health-related questions. Is there anything else you'd like to know?"

        # Generic response
        return "I'm here to help with health-related questions. Could you please:\n1. Describe your symptoms in detail\n2. Mention when they started\n3. Rate their severity (mild/moderate/severe)\n\nThis will help me provide a more accurate assessment."


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]

    def get_queryset(self):
        return Message.objects.filter(chat_room__participants=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = self.get_object()

        if not message.is_read and message.sender != request.user:
            message.is_read = True
            message.save()

        return Response({"status": "Message marked as read"})
