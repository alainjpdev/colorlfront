import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoogleAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface GoogleAuthActions {
  authenticate: () => Promise<void>;
  refreshTokenIfNeeded: () => Promise<string | null>;
  logout: () => void;
  checkAuthStatus: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type GoogleAuthStore = GoogleAuthState & GoogleAuthActions;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

export const useGoogleAuthStore = create<GoogleAuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      authenticate: async () => {
        if (!GOOGLE_CLIENT_ID) {
          set({ error: 'Google Client ID no configurado' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Verificar si ya tenemos un token válido
          if (get().checkAuthStatus()) {
            set({ isLoading: false });
            return;
          }

          // Construir URL de autorización
          const redirectUri = `${window.location.origin}/dashboard`;
          const scope = 'https://www.googleapis.com/auth/spreadsheets';
          
          console.log('🔗 Redirect URI:', redirectUri);
          
          const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
          authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
          authUrl.searchParams.set('redirect_uri', redirectUri);
          authUrl.searchParams.set('scope', scope);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('access_type', 'offline');
          authUrl.searchParams.set('state', 'google_auth');
          // Remover prompt=consent para evitar reautorización constante
          // authUrl.searchParams.set('prompt', 'consent');

          // Redirigir a Google OAuth
          window.location.href = authUrl.toString();
        } catch (error) {
          console.error('Error en autenticación:', error);
          set({ 
            error: 'Error en la autenticación con Google',
            isLoading: false 
          });
        }
      },

      refreshTokenIfNeeded: async () => {
        const state = get();
        
        // Si no hay refresh token, no podemos renovar
        if (!state.refreshToken) {
          return null;
        }

        // Si el token no ha expirado, devolver el token actual
        if (state.tokenExpiry && Date.now() < state.tokenExpiry) {
          return state.accessToken;
        }

        // Si el token está por expirar (menos de 5 minutos), renovarlo
        if (state.tokenExpiry && Date.now() >= (state.tokenExpiry - 5 * 60 * 1000)) {
          try {
            set({ isLoading: true });

            const response = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                refresh_token: state.refreshToken,
                grant_type: 'refresh_token'
              })
            });

            if (!response.ok) {
              throw new Error('Error al renovar token');
            }

            const data = await response.json();
            const newExpiry = Date.now() + (data.expires_in * 1000);

            set({
              accessToken: data.access_token,
              tokenExpiry: newExpiry,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return data.access_token;
          } catch (error) {
            console.error('Error al renovar token:', error);
            set({ 
              error: 'Error al renovar token de Google',
              isLoading: false 
            });
            return null;
          }
        }

        return state.accessToken;
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          isAuthenticated: false,
          error: null
        });
      },

      checkAuthStatus: () => {
        const state = get();
        
        // Verificar si tenemos un token y no ha expirado
        if (state.accessToken && state.tokenExpiry && Date.now() < state.tokenExpiry) {
          return true;
        }

        // Si el token ha expirado pero tenemos refresh token, intentar renovar
        if (state.refreshToken && state.tokenExpiry && Date.now() >= state.tokenExpiry) {
          // Programar renovación automática
          get().refreshTokenIfNeeded();
          return false; // Temporalmente false hasta que se renueve
        }

        return false;
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'google-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Función para manejar el callback de OAuth
export const handleGoogleAuthCallback = async (code: string): Promise<boolean> => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Google credentials not configured');
    return false;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${window.location.origin}/dashboard`
      })
    });

    if (!response.ok) {
      throw new Error('Error al intercambiar código por tokens');
    }

    const data = await response.json();
    
    if (data.access_token) {
      const store = useGoogleAuthStore.getState();
      const expiryTime = Date.now() + (data.expires_in * 1000);
      
      store.setLoading(false);
      store.setError(null);
      
      // Actualizar el store con los nuevos tokens
      useGoogleAuthStore.setState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || store.refreshToken,
        tokenExpiry: expiryTime,
        isAuthenticated: true
      });

      console.log('✅ Tokens de Google obtenidos exitosamente');
      return true;
    } else {
      throw new Error(data.error_description || 'Error al obtener tokens');
    }
  } catch (error) {
    console.error('❌ Error al intercambiar código por tokens:', error);
    const store = useGoogleAuthStore.getState();
    store.setError('Error al obtener tokens de Google');
    store.setLoading(false);
    return false;
  }
};

// Hook para usar la autenticación de Google
export const useGoogleAuth = () => {
  const store = useGoogleAuthStore();
  
  return {
    ...store,
    // Función helper para obtener token válido
    getValidToken: async () => {
      return await store.refreshTokenIfNeeded();
    }
  };
};
