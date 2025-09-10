import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import logo from '../assets/logo.webp';
export const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();

    const { register, handleSubmit, formState: { errors } } = useForm();
    const onSubmit = async (data: any) => {
        console.log('Submit ejecutado', data);
        setIsLoading(true);
        setError('');
        try {
            await login(data.email, data.password);
            // Redirigir a la página solicitada o al dashboard
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
        catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="ColorLand Logo" className="h-12 w-auto" />
          </div>
          <p className="text-text-secondary mt-2">Ingresa a tu cuenta</p>
        </div>

        {/* Form */}
        <div className="bg-panel rounded-lg shadow-lg p-8 border border-border">
          {error && (            <div className="mb-4 p-3 bg-error/10 border border-error text-error rounded-lg">
              Error al iniciar sesión
            </div>)}

          {/* Bloque de credenciales de prueba eliminado */}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                <input type="email" {...register('email', {
        required: 'Correo Electrónico es requerido',
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Correo Electrónico inválido'
        }
    })} className="w-full pl-10 pr-3 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="tu@email.com"/>
              </div>
              {typeof errors.email?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.email.message}</p>)}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                <input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Contraseña es requerida' })} className="w-full pl-10 pr-10 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="********"/>
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                </button>
              </div>
              {typeof errors.password?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.password.message}</p>)}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:text-primary font-medium underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-text-secondary hover:text-primary font-medium underline transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>);
};
