// src/api/services/patientService.js
import api from '../api';

export const patientService = {
  getPatients: () => api.get('/api/v1/patients/'),
  getPatientById: (id) => api.get(`/api/v1/patients/${id}/`),
  createPatient: (data) => api.post('/api/v1/patients/', data),
  updatePatient: (id, data) => api.put(`/api/v1/patients/${id}/`, data),
  deletePatient: (id) => api.delete(`/api/v1/patients/${id}/`),
};
