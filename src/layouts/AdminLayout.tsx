import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Users, BarChart3, Settings, User, LogOut, Home, UserPlus, Layers, FileText, ClipboardList, ExternalLink, Database, ChevronLeft, ChevronRight, FileText as FileTextIcon, Building2, CheckSquare, ShoppingCart, Plus, List } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';
import logo from '../assets/logo.webp';

interface NavigationItem {
  to?: string;
  key?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  submenu?: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [collapsed, setCollapsed] = React.useState(false);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  const navigationItems: NavigationItem[] = [
    { to: '/dashboard', icon: Home, label: 'Panel de Control' },
    { to: '/dashboard/users', icon: Users, label: 'Usuarios' },
    { to: '/dashboard/quotations', icon: FileTextIcon, label: 'Cotizaciones' },
    { 
      key: 'orders', 
      icon: ShoppingCart, 
      label: 'Órdenes',
      submenu: [
        { to: '/dashboard/orders', icon: List, label: 'Listado' },
        { to: '/dashboard/orders/create', icon: Plus, label: 'Crear Orden' }
      ]
    },
    { to: '/dashboard/crm', icon: Building2, label: 'CRM' },
    { to: '/dashboard/todo', icon: CheckSquare, label: 'To Do' },
    // { to: '/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp' }, // Oculto temporalmente
    // { to: '/dashboard/classes', icon: BookOpen, label: 'Clases' },
    // { to: '/dashboard/modules', icon: Layers, label: 'Módulos' },
    // { to: '/dashboard/materials', icon: FileText, label: 'Materiales' },
    // { to: '/dashboard/assignments', icon: ClipboardList, label: 'Tareas' },
    // { to: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
    // { to: '/dashboard/studentclasses', icon: UserPlus, label: 'Inscripciones' },
    { to: '/dashboard/settings', icon: Settings, label: 'Configuración' },
    { to: '/dashboard/profile', icon: User, label: 'Perfil' },
    // { to: '/dashboard/notion', icon: Database, label: 'Notion' }
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-border transition-all duration-200`}>
        <div className="flex flex-col h-full relative">
          {/* Collapse Button (centered vertically) */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="absolute top-1/2 -right-4 z-20 transform -translate-y-1/2 bg-panel shadow-lg border border-border p-2 rounded-full hover:bg-border transition"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            {collapsed ? <ChevronRight className="w-5 h-5 text-text" /> : <ChevronLeft className="w-5 h-5 text-text" />}
          </button>
          {/* Logo + LanguageSelector */}
          <div className="flex items-center border-b border-border bg-sidebar transition-all duration-200">
            <div className={`flex items-center transition-all duration-200 ${
              collapsed ? 'justify-center w-16 py-4' : 'justify-center w-full py-6'
            }`}>
              <img 
                src={logo} 
                alt="ColorLand Logo" 
                className={`transition-all duration-200 ${
                  collapsed 
                    ? 'h-10 w-10' 
                    : 'h-20 w-auto'
                }`} 
              />
            </div>
          </div>
          {/* User Info */}
          {!collapsed && (
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-text-secondary capitalize">
                    {user?.role === 'student' ? 'Estudiante' : 
                     user?.role === 'teacher' ? 'Profesor' : 
                     user?.role === 'admin' ? 'Administrador' : user?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2">
            {navigationItems.map((item) => {
              // Si tiene submenú
              if (item.submenu) {
                const isExpanded = expandedMenus.includes(item.key!);
                return (
                  <div key={item.key}>
                    <button
                      onClick={() => !collapsed && toggleSubmenu(item.key!)}
                      className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative text-text-secondary hover:bg-hover hover:text-text`}
                      title={collapsed ? item.label : ''}
                    >
                      <item.icon className={`w-5 h-5 transition-all duration-200 ${
                        collapsed ? 'mr-0' : 'mr-0'
                      }`} />
                      {!collapsed && (
                        <>
                          <span className="ml-3">{item.label}</span>
                          <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                        </>
                      )}
                      
                      {/* Tooltip cuando está colapsado */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                    
                    {/* Submenú */}
                    {!collapsed && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
                              (isActive
                                ? 'bg-accent/10 text-accent'
                                : 'text-text-secondary hover:bg-hover hover:text-text')
                            }
                          >
                            <subItem.icon className="w-4 h-4 mr-3" />
                            <span>{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Si es un enlace normal
              return (
                <NavLink
                  key={item.to!}
                  to={item.to!}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
                    (isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-hover hover:text-text')
                  }
                  title={collapsed ? item.label : ''}
                >
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${
                    collapsed ? 'mr-0' : 'mr-0'
                  }`} />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                  
                  {/* Tooltip cuando está colapsado */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
          {/* Logout */}
          <div className={`border-t border-border transition-all duration-200 ${
            collapsed ? 'px-2 py-4' : 'px-2 py-4'
          }`}>
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border hover:text-text rounded-lg transition-colors group relative ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Cerrar Sesión' : ''}
            >
              <LogOut className="w-5 h-5 mr-0" />
              {!collapsed && <span className="ml-3">Cerrar Sesión</span>}
              
              {/* Tooltip cuando está colapsado */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Cerrar Sesión
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className={`${collapsed ? 'ml-16' : 'ml-64'} bg-bg min-h-screen transition-all duration-200`}>
        <main className="p-6">
          {/* Fondo y textos actualizados a la nueva paleta */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};