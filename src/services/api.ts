import axios from 'axios';

// Configuración base de Axios
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://colorland-app-ff3fdd79ac35.herokuapp.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/login', { email, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await apiClient.post('/api/register', userData);
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await apiClient.post('/api/refresh');
    return response.data;
  }
};

export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  },
  
  updateProfile: async (userData: any) => {
    const response = await apiClient.put('/api/users/profile', userData);
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await apiClient.get('/api/users');
    return response.data;
  }
};

export const classAPI = {
  getClasses: async () => {
    const response = await apiClient.get('/api/classes');
    return response.data;
  },
  
  createClass: async (classData: any) => {
    const response = await apiClient.post('/api/classes', classData);
    return response.data;
  },
  
  updateClass: async (id: string, classData: any) => {
    const response = await apiClient.put(`/api/classes/${id}`, classData);
    return response.data;
  },
  
  deleteClass: async (id: string) => {
    const response = await apiClient.delete(`/api/classes/${id}`);
    return response.data;
  }
};

export const dashboardAPI = {
  getStudentData: async () => {
    const response = await apiClient.get('/api/dashboard/student');
    return response.data;
  },
  
  getTeacherData: async () => {
    const response = await apiClient.get('/api/dashboard/teacher');
    return response.data;
  },
  
  getAdminData: async () => {
    const response = await apiClient.get('/api/dashboard/admin');
    return response.data;
  }
};

// Servicios de salud y información del sistema
export const systemAPI = {
  health: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
  
  info: async () => {
    const response = await apiClient.get('/api/info');
    return response.data;
  }
};