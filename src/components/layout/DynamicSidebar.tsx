import React from 'react';
import { LogOut, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from './UserProfile';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavigationItemType } from './navigationConfig';
import { useDynamicMenu } from '../../hooks/useDynamicMenu';
import { convertDynamicToNavigation } from './navigationConfig';
import logo from '../../assets/logo.webp';

interface DynamicSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  role: 'admin' | 'teacher' | 'student';
  expandedMenus: string[];
  onToggleSubmenu: (menuKey: string) => void;
  onLogout: () => void;
}

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  role,
  expandedMenus,
  onToggleSubmenu,
  onLogout
}) => {
  const { user } = useAuthStore();
  const { menuItems, loading, error } = useDynamicMenu(role);

  // Convertir menús dinámicos a NavigationItems
  const navigationItems: NavigationItemType[] = React.useMemo(() => {
    return menuItems.map(convertDynamicToNavigation);
  }, [menuItems]);

  if (loading) {
    return (
      <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-border transition-all duration-200`}>
        <div className="flex flex-col h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-border transition-all duration-200`}>
        <div className="flex flex-col h-full items-center justify-center p-4">
          <div className="text-red-500 text-sm text-center">
            Error al cargar menú: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-border transition-all duration-200`}>
      <div className="flex flex-col h-full relative">
        {/* Collapse Button (centered vertically) */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 -right-4 z-20 transform -translate-y-1/2 bg-panel shadow-lg border border-border p-2 rounded-full hover:bg-border transition"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-text" /> : <ChevronLeft className="w-5 h-5 text-text" />}
        </button>

        {/* Logo */}
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
        <UserProfile user={user} collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.to || item.key}
              item={item}
              collapsed={collapsed}
              expandedMenus={expandedMenus}
              onToggleSubmenu={onToggleSubmenu}
            />
          ))}
        </nav>

        {/* Settings and Logout */}
        <div className={`border-t border-border transition-all duration-200 ${
          collapsed ? 'px-2 py-4' : 'px-2 py-4'
        }`}>
          {/* Settings button for admins */}
          {role === 'admin' && (
            <button
              onClick={() => window.location.href = '/dashboard/settings'}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border hover:text-text rounded-lg transition-colors group relative mb-2 ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Configuración' : ''}
            >
              <Settings className="w-5 h-5 mr-0" />
              {!collapsed && <span className="ml-3">Configuración</span>}
              
              {/* Tooltip cuando está colapsado */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Configuración
                </div>
              )}
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
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
  );
};
