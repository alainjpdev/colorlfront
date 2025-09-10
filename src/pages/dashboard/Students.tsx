import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

const TeacherStudents: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Obtener clases del profesor
    fetch(`${import.meta.env.VITE_API_URL}/api/classes`)
      .then(res => res.json())
      .then(classesData => {
        const myClassIds = classesData
          .filter((cls: any) => cls.teacherId === user.id)
          .map((cls: any) => cls.id);

        // 2. Obtener inscripciones de estudiantes en mis clases
        fetch(`${import.meta.env.VITE_API_URL}/api/studentclasses`)
          .then(res => res.json())
          .then(studentClassesData => {
            // 3. Filtrar solo inscripciones de mis clases
            const myStudentClasses = studentClassesData.filter((sc: any) =>
              myClassIds.includes(sc.classId)
            );
            setStudentClasses(myStudentClasses);
            setLoading(false);
          });
      });
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">
        {t('teacherDashboard.manageStudents', 'Gestión de Estudiantes')}
      </h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-text">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-text">Email</th>
                <th className="text-left py-3 px-4 font-medium text-text">Clase</th>
                <th className="text-left py-3 px-4 font-medium text-text">Fecha de Inscripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : studentClasses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No hay estudiantes inscritos</td>
                </tr>
              ) : (
                studentClasses.map(sc => (
                  <tr key={sc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{sc.student.firstName} {sc.student.lastName}</td>
                    <td className="py-3 px-4">{sc.student.email}</td>
                    <td className="py-3 px-4">{sc.class.title}</td>
                    <td className="py-3 px-4">{new Date(sc.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeacherStudents; 