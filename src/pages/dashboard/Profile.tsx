import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ firstName, lastName, email, avatar })
      });
      if (!res.ok) throw new Error('Error al actualizar el perfil');
      const updated = await res.json();
      setUser(updated); // Actualiza el usuario en el store global
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.profile', 'Perfil de Usuario')}</h1>
      <Card className="p-6 flex flex-col items-center">
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-500">
                <User className="w-12 h-12 text-purple-500" />
              </div>
            )}
            <input
              type="text"
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-center"
              placeholder="URL del avatar"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Apellido</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-text font-medium mb-1">Rol</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 bg-panel text-text-secondary"
              value={t('role.' + user.role, user.role)}
              disabled
            />
          </div>
          {user.createdAt && (
            <p className="text-text-secondary mt-2 text-sm">{t('adminDashboard.registeredOn', 'Registrado el')}: {new Date(user.createdAt).toLocaleDateString()}</p>
          )}
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          {success && <p className="text-green-600 mt-2 text-sm">¡Perfil actualizado!</p>}
          <Button type="submit" className="w-full mt-4" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile; 