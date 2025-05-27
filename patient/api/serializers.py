from rest_framework import serializers
from patient.models import Patient
from django.contrib.auth.models import User
from department.models import Department

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = serializers.SerializerMethodField()
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False)

    class Meta:
        model = Patient
        fields = ['id', 'user', 'date_of_birth', 'gender', 'address', 'phone', 'department', 'department_id']

    def get_department(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name,
                'description': obj.department.description
            }
        return None

class PatientCreateSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False)
    class Meta:
        model = Patient
        fields = ['id', 'user', 'date_of_birth', 'gender', 'address', 'phone', 'department_id']

    def create(self, validated_data):
        department = validated_data.pop('department', None)
        instance = Patient.objects.create(**validated_data)
        if department is not None:
            instance.department = department
            instance.save()
        return instance

    def update(self, instance, validated_data):
        department = validated_data.pop('department', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if department is not None:
            instance.department = department
        instance.save()
        return instance
