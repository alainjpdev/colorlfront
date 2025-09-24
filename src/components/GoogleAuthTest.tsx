import React from 'react';
import { useGoogleAuth } from '../services/googleAuthService';
import { Button } from './ui/Button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const GoogleAuthTest: React.FC = () => {
  const { 
    isAuthenticated, 
    accessToken, 
    authenticate, 
    getValidToken, 
    isLoading, 
    error,
    logout 
  } = useGoogleAuth();

  const handleTestToken = async () => {
    try {
      const token = await getValidToken();
      if (token) {
        console.log('✅ Token válido obtenido:', token.substring(0, 20) + '...');
        alert('✅ Token válido obtenido correctamente');
      } else {
        console.log('❌ No se pudo obtener token válido');
        alert('❌ No se pudo obtener token válido');
      }
    } catch (error) {
      console.error('Error al obtener token:', error);
      alert('❌ Error al obtener token: ' + error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Estado de Autenticación con Google</h3>
      
      <div className="space-y-4">
        {/* Estado de autenticación */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">Autenticado</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-600 font-medium">No autenticado</span>
            </>
          )}
        </div>

        {/* Token info */}
        {accessToken && (
          <div className="text-sm text-gray-600">
            <strong>Token:</strong> {accessToken.substring(0, 30)}...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          {!isAuthenticated ? (
            <Button 
              onClick={authenticate}
              disabled={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Conectar con Google
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleTestToken}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Probar Token
              </Button>
              <Button 
                onClick={logout}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Cerrar Sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
