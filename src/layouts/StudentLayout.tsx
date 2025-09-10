import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Calendar, ClipboardList, User, LogOut, Home } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = [
    { to: '/dashboard', icon: Home, label: 'Panel de Control' },
    { to: '/dashboard/modules', icon: BookOpen, label: 'Módulos' },
    //{ to: '/dashboard/classes', icon: Calendar, label: 'Clases' }
    // { to: '/dashboard/assignments', icon: ClipboardList, label: 'Tareas' } // Eliminado para estudiantes
    // { to: '/dashboard/profile', icon: User, label: 'Perfil' } // Oculto para estudiantes
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar shadow-lg border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-border justify-between bg-sidebar">
            <span className="ml-2 text-xl font-bold text-text">ColorLand</span>
            <div className="flex items-center gap-2 ml-auto">
              {/* Botón de dark mode oculto para estudiantes */}
              {/* <button
                onClick={() => setDark(d => !d)}
                className="p-2 rounded-full bg-panel border border-border shadow hover:scale-110 transition flex items-center justify-center"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-text-secondary" />}
              </button> */}
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-text">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {user?.role === 'user' ? 'Usuario' : 
                   user?.role === 'coordinator' ? 'Coordinador' : 
                   user?.role === 'admin' ? 'Administrador' : user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-hover hover:text-text'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border hover:text-text rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 bg-bg min-h-screen">
        <main className="p-6">
          {/* Fondo y textos actualizados a la nueva paleta */}
          <Outlet key={i18n.language} />
        </main>
      </div>
    </div>
  );
};