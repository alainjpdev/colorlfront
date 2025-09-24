import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NavigationItem as NavigationItemType } from './navigationConfig';

interface NavigationItemProps {
  item: NavigationItemType;
  collapsed: boolean;
  expandedMenus: string[];
  onToggleSubmenu: (menuKey: string) => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  collapsed,
  expandedMenus,
  onToggleSubmenu
}) => {
  // Si tiene submenú
  if (item.submenu) {
    const menuKey = item.key || item.to || item.id || '';
    const isExpanded = expandedMenus.includes(menuKey);
    return (
      <div key={item.key || item.to || item.id || 'submenu'}>
        <button
          onClick={() => !collapsed && onToggleSubmenu(menuKey)}
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
  
  // Si tiene Google Sheets URL, abrir en nueva pestaña
  if (item.googleSheetUrl) {
    return (
      <a
        key={item.key || item.to || item.id || 'google-sheets'}
        href={item.googleSheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
          'text-text-secondary hover:bg-hover hover:text-text'
        }
        title={collapsed ? `${item.label} (Google Sheets)` : ''}
      >
        <item.icon className={`w-5 h-5 transition-all duration-200 ${
          collapsed ? 'mr-0' : 'mr-0'
        }`} />
        {!collapsed && (
          <>
            <span className="ml-3">{item.label}</span>
            <span className="ml-auto text-xs text-blue-500">📊</span>
          </>
        )}
        
        {/* Tooltip cuando está colapsado */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label} (Google Sheets)
          </div>
        )}
      </a>
    );
  }

  // Si es un enlace externo
  if (item.external) {
    return (
      <a
        key={item.to || item.key || item.id || 'external-link'}
        href={item.to!}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
          'text-text-secondary hover:bg-hover hover:text-text'
        }
        title={collapsed ? `${item.label} (Nueva Ventana)` : ''}
      >
        <item.icon className={`w-5 h-5 transition-all duration-200 ${
          collapsed ? 'mr-0' : 'mr-0'
        }`} />
        {!collapsed && (
          <>
            <span className="ml-3">{item.label}</span>
            <span className="ml-auto text-xs text-blue-500">🔗</span>
          </>
        )}
        
        {/* Tooltip cuando está colapsado */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label} (Nueva Ventana)
          </div>
        )}
      </a>
    );
  }

  // Si es un enlace normal
  return (
    <NavLink
      key={item.to || item.key || item.id || 'nav-link'}
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
};
