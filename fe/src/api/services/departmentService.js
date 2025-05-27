// src/api/services/departmentService.js
import api from '../api';

export const departmentService = {
  getDepartments: () => api.get('/api/v1/departments/'),
  getDepartmentById: (id) => api.get(`/api/v1/departments/${id}/`),
};
