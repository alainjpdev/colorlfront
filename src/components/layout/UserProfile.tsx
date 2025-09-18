import React from 'react';
import { User } from 'lucide-react';

interface UserProfileProps {
  user: {
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  collapsed: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, collapsed }) => {
  if (collapsed) return null;

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'student': return 'Estudiante';
      case 'teacher': return 'Profesor';
      case 'admin': return 'Administrador';
      default: return role || '';
    }
  };

  return (
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
            {getRoleLabel(user?.role)}
          </p>
        </div>
      </div>
    </div>
  );
};
