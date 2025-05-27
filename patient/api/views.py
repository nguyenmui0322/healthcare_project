from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(groups__name='Patients')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
