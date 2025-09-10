import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUsers, setEditUsers] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const [modules, setModules] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userModules, setUserModules] = useState<string[]>([]);

  useEffect(() => {
    apiClient.get('/api/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (saveMsg && saveMsg.includes('guardados correctamente')) {
      const timer = setTimeout(() => setSaveMsg(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [saveMsg]);

  // Obtener todos los módulos al montar
  useEffect(() => {
    apiClient.get('/api/modules').then(res => setModules(res.data));
  }, []);

  const openAssignModal = async (user: any) => {
    setSelectedUser(user);
    setAssignModalOpen(true);
    // Obtener módulos asignados al usuario
    const res = await apiClient.get(`/api/users/${user.id}/modules`);
    setUserModules(res.data.map((m: any) => m.id));
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedUser(null);
    setUserModules([]);
  };

  const handleToggleModule = (moduleId: string) => {
    setUserModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSaveModules = async () => {
    if (!selectedUser) return;
    await apiClient.put(`/api/users/${selectedUser.id}/modules`, { moduleIds: userModules });
    closeAssignModal();
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiClient.delete(`/api/users/${userId}`);
      setUsers(users => users.filter(u => u.id !== userId));
      setSaveMsg('Usuario eliminado correctamente');
    } catch (err: any) {
      setSaveMsg('Error al eliminar usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.allUsers', 'Todos los Usuarios')}</h1>
      <div className="mb-4 flex items-center gap-4">
        <Button size="lg" variant="primary" disabled={saving || Object.keys(editUsers).length === 0} onClick={async () => {
          setSaving(true);
          setSaveMsg(null);
          try {
            const updates = Object.entries(editUsers);
            for (const [userId, changes] of updates) {
              const c = changes as Record<string, any>;
              // Solo permitir status y notes
              const allowed: any = {};
              if ('status' in c) allowed.status = c.status;
              if ('notes' in c) allowed.notes = c.notes;
              if ('hours' in c) allowed.hours = c.hours;
              const res = await apiClient.put(`/api/users/${userId}`, allowed);
              const updatedUser = res.data;
              setUsers(users => users.map(u => u.id === userId ? { ...u, ...allowed } : u));
            }
            setEditUsers({});
            setSaveMsg('Cambios guardados correctamente');
          } catch (err: any) {
            setSaveMsg(err.message || 'Error al guardar cambios');
          } finally {
            setSaving(false);
          }
        }}>Guardar cambios</Button>
        {saveMsg && <span className={saveMsg.includes('Error') ? 'text-error' : 'text-success'}>{saveMsg}</span>}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {/* <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th> */}
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Email</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Notas</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Horas</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Fecha de Registro</th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Eliminar</th>
                {/* <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-text-secondary">{t('loading', 'Cargando...')}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-text-secondary">{t('adminDashboard.noUsers', 'No hay usuarios')}</td></tr>
              ) : (
                users.map(user => {
                  const local = editUsers[user.id] || {};
                  return (
                    <tr key={user.id} className="border-b border-border hover:bg-panel">
                      {/* <td className="py-3 px-4">{user.id}</td> */}
                      <td className="py-3 px-4 cursor-pointer text-primary underline" onClick={() => openAssignModal(user)}>{user.firstName} {user.lastName}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 capitalize">{t('role.' + user.role, { defaultValue: user.role })}</td>
                      <td className="py-3 px-4">
                        <select
                          className={`px-2 py-1 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-primary ${
                            (local.status ?? user.status) === 'active' ? 'bg-success/10 text-success' :
                            (local.status ?? user.status) === 'pending' ? 'bg-warning/10 text-warning' :
                            (local.status ?? user.status) === 'suspended' ? 'bg-error/10 text-error' :
                            'bg-border text-text-secondary'
                          }`}
                          value={local.status ?? user.status}
                          onChange={e => {
                            const newStatus = e.target.value;
                            setEditUsers((edit: any) => ({ ...edit, [user.id]: { ...edit[user.id], status: newStatus } }));
                          }}
                        >
                          <option value="active">{t('adminDashboard.active', { defaultValue: 'Activo' })}</option>
                          <option value="pending">{t('adminDashboard.pending', { defaultValue: 'Pendiente' })}</option>
                          <option value="suspended">{t('adminDashboard.suspended', { defaultValue: 'Suspendido' })}</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-xs border border-border bg-panel text-text rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Notas internas"
                          value={local.notes ?? user.notes ?? ''}
                          onChange={e => {
                            const notes = e.target.value;
                            setEditUsers((edit: any) => ({ ...edit, [user.id]: { ...edit[user.id], notes } }));
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        {currentUser?.role === 'admin' ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 text-xs border border-border bg-panel text-text rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={local.hours ?? user.hours ?? 0}
                            min={0}
                            onChange={e => {
                              const hours = parseInt(e.target.value, 10) || 0;
                              setEditUsers((edit: any) => ({ ...edit, [user.id]: { ...edit[user.id], hours } }));
                            }}
                          />
                        ) : (
                          user.hours ?? 0
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{user.createdAt ? user.createdAt.split('T')[0] : ''}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)} disabled={!!saving || !!(currentUser && currentUser.id === user.id)}>
                          Eliminar
                        </Button>
                      </td>
                      {/* <td className="py-3 px-4 space-x-2">
                        <Button size="sm" variant="outline">{t('adminDashboard.manage', 'Gestionar')}</Button>
                        <Button size="sm" variant="outline">Resetear Contraseña</Button>
                        <Button size="sm" variant="outline">Cambiar Rol</Button>
                      </td> */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {assignModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={closeAssignModal}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">Asignar módulos a {selectedUser.firstName} {selectedUser.lastName}</h2>
            <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
              {modules.map((mod) => (
                <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userModules.includes(mod.id)}
                    onChange={() => handleToggleModule(mod.id)}
                  />
                  <span className="text-text">{mod.title}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="primary" onClick={handleSaveModules}>Guardar</Button>
              <Button size="sm" variant="outline" onClick={closeAssignModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 