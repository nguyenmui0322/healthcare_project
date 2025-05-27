from django.shortcuts import render
from django.contrib.auth.models import User
from .models import Patient
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def patient_list(request):
    patients = Patient.objects.select_related('user').all()
    return render(request, 'patients_list.html', {'patients': patients})
