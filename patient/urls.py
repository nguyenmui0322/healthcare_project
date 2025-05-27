from django.urls import path
from .views import patient_list

urlpatterns = [
    path('patients/', patient_list, name='patient_list'),
]
