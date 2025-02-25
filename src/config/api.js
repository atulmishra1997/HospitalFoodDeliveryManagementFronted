const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const endpoints = {
  auth: {
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`
  },
  tasks: {
    pantry: `${API_URL}/api/tasks/pantry`,
    delivery: `${API_URL}/api/tasks/delivery`,
    pantryCompleted: `${API_URL}/api/tasks/pantry/completed`,
    deliveryCompleted: `${API_URL}/api/tasks/delivery/completed`,
    stats: `${API_URL}/api/tasks/stats`
  },
  patients: {
    base: `${API_URL}/api/patients`,
    active: `${API_URL}/api/patients/active`
  },
  dietCharts: {
    base: `${API_URL}/api/diet-charts`,
    active: `${API_URL}/api/diet-charts/active`
  }
};
