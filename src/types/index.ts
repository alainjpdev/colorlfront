export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  createdAt: string;
  hours?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  setUser: (user: User) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
}

export interface Class {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  schedule: string;
  students: number;
  maxStudents: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  classId: string;
  className: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface QuotationItem {
  productId: string;
  code: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationName: string;
  clientName: string;
  projectName: string;
  total: number;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string;
  items: QuotationItem[];
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateQuotationData {
  quotationName: string;
  clientName: string;
  projectName: string;
  total: number;
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'amount';
  validUntil?: string;
  items: QuotationItem[];
}