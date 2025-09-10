import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, RegisterData } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        console.log('Intentando login en el store', email, password);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          console.log('Respuesta recibida', res);
          if (!res.ok) throw new Error('Credenciales inválidas');
          const { user, token } = await res.json();
          set({ user, token, isAuthenticated: true });
          localStorage.setItem('token', token); // <-- Guardar token en localStorage
        } catch (error) {
          throw new Error('Error al iniciar sesión');
        }
      },

      register: async (userData: RegisterData) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          if (!res.ok) throw new Error('Error al registrar usuario');
          const { user, token } = await res.json();
          set({ user, token, isAuthenticated: true });
          localStorage.setItem('token', token); // <-- Guardar token en localStorage
        } catch (error) {
          throw new Error('Error al registrar usuario');
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        localStorage.removeItem('token');
      },

      checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token && get().user) {
          set({ isAuthenticated: true });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);