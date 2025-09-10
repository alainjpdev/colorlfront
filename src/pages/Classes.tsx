import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

const Classes: React.FC = () => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; title: string; description: string; moduleId?: string }>({ title: '', description: '', moduleId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/api/classes')
      .then(res => {
        setClasses(res.data);
        setLoading(false);
      });
    apiClient.get('/api/users')
      .then(res => setUsers(res.data))
      .catch(() => setUserError('No autorizado. Inicia sesión de nuevo.'));
  }, []);

  const handleTeacherChange = async (classId: string, teacherId: string) => {
    const updatedClasses = classes.map(cls => {
      if (cls.id === classId) {
        return { ...cls, teacherId };
      }
      return cls;
    });
    setClasses(updatedClasses);
    setSaveMsg(null);
    try {
      await apiClient.put(`/api/classes/${classId}`, { teacherId });
      setSaveMsg('Profesor asignado correctamente');
    } catch (err) {
      setSaveMsg('Error al asignar profesor');
    }
  };

  const openCreateModal = () => {
    setEdit({ title: '', description: '', moduleId: '' });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const openEditModal = (cls: any) => {
    setEdit({ id: cls.id, title: cls.title, description: cls.description, moduleId: cls.module?.id || '' });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEdit({ title: '', description: '', moduleId: '' });
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveClass = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (edit.id) {
        // Editar clase
        const res = await apiClient.put(`/api/classes/${edit.id}`, {
          title: edit.title,
          description: edit.description,
          moduleId: edit.moduleId
        });
        const updated = res.data;
        setClasses(classes => classes.map(c => c.id === edit.id ? updated : c));
        setSuccessMsg('¡Clase actualizada correctamente!');
      } else {
        // Crear clase
        const res = await apiClient.post('/api/classes', {
          title: edit.title,
          description: edit.description,
          moduleId: edit.moduleId
        });
        const created = res.data;
        setClasses(classes => [...classes, created]);
        setSuccessMsg('¡Clase creada correctamente!');
      }
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setError('Error al guardar la clase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6 flex items-center justify-between">
        {t('adminDashboard.allClasses', 'Todas las Clases')}
        {user?.role === 'admin' && (
          <Button size="sm" variant="primary" onClick={openCreateModal}>Agregar Clase</Button>
        )}
      </h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {/* <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th> */}
                <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                <th className="text-left py-3 px-4 font-medium text-text">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-text">Módulo</th>
                <th className="text-left py-3 px-4 font-medium text-text">Profesor</th>
                {/* <th className="text-left py-3 px-4 font-medium text-gray-700">Horario</th> */}
                <th className="text-left py-3 px-4 font-medium text-text">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {userError ? (
                <tr><td colSpan={5} className="py-6 text-center text-red-600">{userError}</td></tr>
              ) : loading ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">{t('loading', 'Cargando...')}</td></tr>
              ) : classes.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">{t('adminDashboard.noClasses', 'No hay clases')}</td></tr>
              ) : (
                classes.map(cls => (
                  <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* <td className="py-3 px-4">{cls.id}</td> */}
                    <td className="py-3 px-4">{cls.title}</td>
                    <td className="py-3 px-4">{cls.description}</td>
                    <td className="py-3 px-4">{cls.module?.title || '-'}</td>
                    <td className="py-3 px-4">
                      {Array.isArray(users) && users.length > 0 ? (
                        <select
                          value={cls.teacherId || ''}
                          onChange={e => handleTeacherChange(cls.id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Sin asignar</option>
                          {users.filter(u => u.role === 'teacher').map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-400">No hay profesores</span>
                      )}
                    </td>
                    {/* <td className="py-3 px-4">{cls.schedule}</td> */}
                    <td className="py-3 px-4">
                      {user?.role === 'admin' && (
                        <Button size="sm" variant="outline" onClick={() => openEditModal(cls)}>Editar</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {saveMsg && <div className={saveMsg.includes('Error') ? 'text-red-600 mt-2' : 'text-green-600 mt-2'}>{saveMsg}</div>}
      {/* Modal de gestión de clase */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={closeModal}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">{edit.id ? 'Editar Clase' : 'Agregar Clase'}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
              <input type="text" className="w-full border border-border rounded px-3 py-2 bg-panel text-text focus:outline-none focus:ring-2 focus:ring-primary" value={edit.title} onChange={e => setEdit(edit => ({ ...edit, title: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
              <textarea className="w-full border border-border rounded px-3 py-2 bg-panel text-text focus:outline-none focus:ring-2 focus:ring-primary" value={edit.description} onChange={e => setEdit(edit => ({ ...edit, description: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Módulo</label>
              <select className="w-full border border-border rounded px-3 py-2 bg-panel text-text" value={edit.moduleId} onChange={e => setEdit(edit => ({ ...edit, moduleId: e.target.value }))}>
                <option value="">Sin módulo</option>
                {/* Assuming 'modules' state is managed elsewhere or passed as a prop */}
                {/* For now, we'll just show a placeholder or assume it's available */}
                {/* {Array.isArray(modules) && modules.map(m => ( */}
                {/*   <option key={m.id} value={m.id}>{m.title}</option> */}
                {/* ))} */}
              </select>
            </div>
            {error && <div className="text-error mb-2">{error}</div>}
            {successMsg && <div className="text-success mb-2">{successMsg}</div>}
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveClass} disabled={saving}>{saving ? 'Guardando...' : (edit.id ? 'Guardar Cambios' : 'Crear')}</Button>
              <Button size="sm" variant="outline" onClick={closeModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes; 