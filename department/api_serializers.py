from rest_framework import serializers
from department.models import Department
from patient.models import Patient

class DepartmentSerializer(serializers.ModelSerializer):
    patients = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'patients']
