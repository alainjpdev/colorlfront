import React from 'react';
import { Card } from '../../components/ui/Card';
import { MenuManager } from '../../components/layout/MenuManager';
import { useDynamicMenu } from '../../hooks/useDynamicMenu';
import { useAuthStore } from '../../store/authStore';

export const MenuManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { allMenuItems, refreshMenu } = useDynamicMenu(user?.role as 'admin' | 'teacher' | 'student');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-text-secondary">
            Solo los administradores pueden acceder a esta página.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Gestión de Menús</h1>
          <p className="text-text-secondary text-sm">
            Administra los elementos de navegación para cada rol
          </p>
        </div>
      </div>

      {/* Tabs para roles */}
      <div className="bg-panel rounded-lg p-1">
        <div className="grid grid-cols-3 gap-1">
          {['admin', 'teacher', 'student'].map((role) => (
            <button
              key={role}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                role === 'admin' 
                  ? 'bg-accent text-white' 
                  : 'text-text-secondary hover:text-text hover:bg-bg'
              }`}
            >
              {role === 'admin' ? 'Administradores' : 
               role === 'teacher' ? 'Profesores' : 'Estudiantes'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal - Solo mostrar un rol a la vez */}
      <div className="grid grid-cols-1 gap-6">
        {/* Administradores */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Menú de Administradores</h2>
            <span className="text-xs text-text-secondary bg-bg px-2 py-1 rounded">
              {allMenuItems.filter(item => item.role === 'admin').length} elementos
            </span>
          </div>
          <MenuManager
            menuItems={allMenuItems.filter(item => item.role === 'admin')}
            onMenuChange={refreshMenu}
            role="admin"
          />
        </Card>

        {/* Profesores */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Menú de Profesores</h2>
            <span className="text-xs text-text-secondary bg-bg px-2 py-1 rounded">
              {allMenuItems.filter(item => item.role === 'teacher').length} elementos
            </span>
          </div>
          <MenuManager
            menuItems={allMenuItems.filter(item => item.role === 'teacher')}
            onMenuChange={refreshMenu}
            role="teacher"
          />
        </Card>

        {/* Estudiantes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Menú de Estudiantes</h2>
            <span className="text-xs text-text-secondary bg-bg px-2 py-1 rounded">
              {allMenuItems.filter(item => item.role === 'student').length} elementos
            </span>
          </div>
          <MenuManager
            menuItems={allMenuItems.filter(item => item.role === 'student')}
            onMenuChange={refreshMenu}
            role="student"
          />
        </Card>
      </div>

      {/* Información compacta */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Información Rápida</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-text-secondary">
          <div className="text-center">
            <div className="font-medium text-text">Agregar</div>
            <div>Nuevos elementos</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-text">Editar</div>
            <div>Elementos existentes</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-text">Activar/Desactivar</div>
            <div>Visibilidad</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-text">Eliminar</div>
            <div>Elementos no usados</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
