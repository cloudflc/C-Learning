import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data)
};

export const levelsAPI = {
  getAll: () => api.get('/levels'),
  getAllForAdmin: () => api.get('/levels/admin/all'),
  getById: (id) => api.get(`/levels/${id}`),
  create: (data) => api.post('/levels', data),
  update: (id, data) => api.put(`/levels/${id}`, data),
  delete: (id) => api.delete(`/levels/${id}`),
  start: (id) => api.post(`/levels/${id}/start`),
  getProgress: (id) => api.get(`/levels/${id}/progress`)
};

export const typingAPI = {
  getAll: (params) => api.get('/typing', { params }),
  getById: (id) => api.get(`/typing/${id}`),
  getForEdit: (id) => api.get(`/typing/${id}`),
  create: (data) => api.post('/typing', data),
  update: (id, data) => api.put(`/typing/${id}`, data),
  delete: (id) => api.delete(`/typing/${id}`),
  submit: (id, data) => api.post(`/typing/${id}/submit`, data),
  getResults: (id) => api.get(`/typing/${id}/results`)
};

export const ojAPI = {
  getAll: (params) => api.get('/oj', { params }),
  getById: (id) => api.get(`/oj/${id}`),
  getDetail: (id) => api.get(`/oj/${id}/detail`),
  create: (data) => api.post('/oj', data),
  update: (id, data) => api.put(`/oj/${id}`, data),
  delete: (id) => api.delete(`/oj/${id}`),
  submit: (id, data) => api.post(`/oj/${id}/submit`, data),
  runCode: (id, data) => api.post(`/oj/${id}/run`, data),
  getSubmissions: (id) => api.get(`/oj/${id}/submissions`),
  getSubmission: (id) => api.get(`/oj/submission/${id}`)
};

export const rankingAPI = {
  get: (params) => api.get('/ranking', { params }),
  getMyRank: () => api.get('/ranking/me/rank')
};

export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  check: (id) => api.post(`/achievements/check/${id}`),
  getByUser: (userId) => api.get(`/achievements/user/${userId}`)
};

export const usersAPI = {
  getStudents: () => api.get('/users/students'),
  createStudent: (data) => api.post('/users', data),
  updateStudentLevels: (id, data) => api.put(`/users/${id}/levels`, data),
  updateStudentLevelStatus: (id, data) => api.put(`/users/${id}/level-status`, data)
};

export default api;
