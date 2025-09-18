import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useDarkMode } from './hooks/useDarkMode';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { TeacherDashboard } from './pages/dashboard/TeacherDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import Users from './pages/dashboard/Users';
import Classes from './pages/Classes';
import Modules from './pages/Modules';
import Materials from './pages/Materials';
import Assignments from './pages/dashboard/Assignments';
import Reports from './pages/dashboard/Reports';
import StudentClasses from './pages/dashboard/StudentClasses';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';
import NotFound from './pages/NotFound';
import Notion from './pages/dashboard/Notion';
import { Quotations } from './pages/dashboard/Quotations';
import Orders from './pages/dashboard/Orders';
import CreateOrder from './pages/dashboard/CreateOrder';
import { CRM } from './pages/dashboard/CRM';
import { WhatsApp } from './pages/dashboard/WhatsApp';
import { Todo } from './pages/dashboard/Todo';
// import { TodoServiceAccount } from './pages/dashboard/TodoServiceAccount';
// import { TodoReadOnly } from './pages/dashboard/TodoReadOnly';
import { MenuManagement } from './pages/dashboard/MenuManagement';
import { TestNavigation } from './pages/dashboard/TestNavigation';

// Layout wrapper component
const DashboardLayoutWrapper: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  const LayoutComponent = {
    student: StudentLayout,
    teacher: TeacherLayout,
    admin: AdminLayout
  }[user.role];

  return <LayoutComponent />;
};

// Dashboard router component
const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  const DashboardComponent = {
    student: StudentDashboard,
    teacher: TeacherDashboard,
    admin: AdminDashboard
  }[user.role];

  return <DashboardComponent />;
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const [dark, setDark] = useDarkMode();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="App">
        {/* El toggle flotante de dark mode ha sido eliminado */}
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayoutWrapper />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            {/* Aquí se pueden agregar más subrutas específicas */}
            <Route 
              path="profile" 
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="settings" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas específicas por rol */}
            <Route 
              path="modules" 
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <Modules />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="classes" 
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <Classes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="assignments" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Assignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="students" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <div className="p-6">Gestión de Estudiantes (Próximamente)</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="materials" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <Materials />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="create-class" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <div className="p-6">Crear Nueva Clase (Próximamente)</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="quotations" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Quotations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="orders" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Orders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="orders/create" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateOrder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="crm" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CRM />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="whatsapp" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <WhatsApp />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="todo" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Todo />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="todo-service" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TodoServiceAccount />
                </ProtectedRoute>
              } 
            /> */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="studentclasses" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StudentClasses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="notion" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Notion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="menu-management" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MenuManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="test-navigation" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TestNavigation />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Página de no autorizado */}
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
                  <p className="text-gray-600 mb-8">No tienes permisos para acceder a esta página</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            } 
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;