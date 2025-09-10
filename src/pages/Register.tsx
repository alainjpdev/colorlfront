import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import logo from '../assets/logo.webp';
export const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register: registerUser } = useAuthStore();

    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const password = watch('password');
    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const { confirmPassword, ...userData } = data;
            await registerUser({ ...userData, role: 'user' }); // Forzar rol user
            navigate('/dashboard');
        }
        catch (err: any) {
            setError(err.message || 'Error al registrar usuario');
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
          <p className="text-text-secondary mt-2">Crea tu cuenta</p>
        </div>

        {/* Form */}
        <div className="bg-panel rounded-lg shadow-lg p-8 border border-border">
          {error && (            <div className="mb-4 p-3 bg-error/10 border border-error text-error rounded-lg">
              Error al registrar usuario
            </div>)}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                  <input type="text" {...register('firstName', {
        required: 'Nombre es requerido',
        minLength: {
            value: 2,
            message: 'El nombre debe tener al menos 2 caracteres'
        }
    })} className="w-full pl-10 pr-3 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Nombre"/>
                </div>
                {typeof errors.firstName?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.firstName.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Apellido
                </label>
                <input type="text" {...register('lastName', {
        required: 'Apellido es requerido',
        minLength: {
            value: 2,
            message: 'El apellido debe tener al menos 2 caracteres'
        }
    })} className="w-full px-3 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Apellido"/>
                {typeof errors.lastName?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.lastName.message}</p>)}
              </div>
            </div>

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
            message: 'Correo inválido'
        }
    })} className="w-full pl-10 pr-3 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Correo Electrónico"/>
              </div>
              {typeof errors.email?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.email.message}</p>)}
            </div>

            {/* Campo de selección de rol eliminado */}

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                <input type={showPassword ? 'text' : 'password'} {...register('password', {
        required: 'Contraseña es requerida',
        minLength: {
            value: 6,
            message: 'La contraseña debe tener al menos 6 caracteres'
        }
    })} className="w-full pl-10 pr-10 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Contraseña"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              {typeof errors.password?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.password.message}</p>)}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary"/>
                <input type={showPassword ? 'text' : 'password'} {...register('confirmPassword', {
        required: 'Confirmar Contraseña es requerido',
        validate: (value) => value === password || 'Las contraseñas no coinciden'
    })} className="w-full pl-10 pr-3 py-2 border border-border bg-panel text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Confirmar Contraseña"/>
              </div>
              {typeof errors.confirmPassword?.message === 'string' && (<p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>)}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:text-primary font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-text-secondary hover:text-text">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>);
};
