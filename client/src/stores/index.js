import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
      },
      
      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', { username, email, password });
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
      
      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

export const useLevelStore = create((set, get) => ({
  levels: [],
  currentLevel: null,
  isLoading: false,
  
  fetchLevels: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/levels');
      set({ levels: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch levels:', error);
    }
  },
  
  fetchLevel: async (levelId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/levels/${levelId}`);
      set({ currentLevel: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch level:', error);
    }
  },
  
  startLevel: async (levelId) => {
    try {
      const response = await api.post(`/levels/${levelId}/start`);
      return response.data;
    } catch (error) {
      console.error('Failed to start level:', error);
      throw error;
    }
  }
}));

export const useTypingStore = create((set, get) => ({
  exercises: [],
  currentExercise: null,
  exerciseProgress: null,
  results: [],
  isLoading: false,
  isStarted: false,
  
  resetProgress: () => {
    set({ exerciseProgress: null, isStarted: false });
  },
  
  fetchExercises: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/typing', { params });
      set({ exercises: response.data.exercises, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch typing exercises:', error);
    }
  },
  
  fetchExercise: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/typing/${id}`);
      set({ currentExercise: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch exercise:', error);
    }
  },
  
  startExercise: async (id) => {
    try {
      const response = await api.post(`/typing/${id}/start`);
      set({ 
        currentExercise: response.data.exercise, 
        exerciseProgress: response.data.result 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start exercise:', error);
      throw error;
    }
  },
  
  submitLine: async (id, data) => {
    try {
      const response = await api.post(`/typing/${id}/submit-line`, data);
      set({ 
        exerciseProgress: {
          completedLines: response.data.completedLines,
          totalLines: response.data.totalLines,
          isCompleted: response.data.isCompleted,
          expEarned: response.data.expEarned
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit line:', error);
      throw error;
    }
  },
  
  submitAnswer: async (id, data) => {
    try {
      const response = await api.post(`/typing/${id}/submit`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }
}));

export const useOJStore = create((set, get) => ({
  problems: [],
  currentProblem: null,
  submissions: [],
  isLoading: false,
  
  fetchProblems: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/oj', { params });
      set({ problems: response.data.problems, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch problems:', error);
    }
  },
  
  fetchProblem: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/oj/${id}`);
      set({ currentProblem: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch problem:', error);
    }
  },
  
  submitCode: async (id, data) => {
    try {
      const response = await api.post(`/oj/${id}/submit`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to submit code:', error);
      throw error;
    }
  },
  
  runCode: async (id, data) => {
    try {
      const response = await api.post(`/oj/${id}/run`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to run code:', error);
      throw error;
    }
  },
  
  fetchSubmissions: async (id) => {
    try {
      const response = await api.get(`/oj/${id}/submissions`);
      set({ submissions: response.data });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  }
}));

export const useRankingStore = create((set, get) => ({
  ranking: [],
  userRank: null,
  isLoading: false,
  
  fetchRanking: async (type = 'exp', scope = 'global', period = 'all') => {
    set({ isLoading: true });
    try {
      const response = await api.get('/ranking', { params: { type, scope, period } });
      set({ 
        ranking: response.data.ranking, 
        userRank: response.data.userRank,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch ranking:', error);
    }
  }
}));
