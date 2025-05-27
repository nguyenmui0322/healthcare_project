from django.db import models
from django.conf import settings
from department.models import Department

User = settings.AUTH_USER_MODEL

# Create your models here.

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Nam'), ('female', 'Nữ'), ('other', 'Khác')], blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    # Có thể bổ sung các trường khác nếu cần

    def __str__(self):
        return f"Patient: {self.user.get_full_name() or self.user.username}"
