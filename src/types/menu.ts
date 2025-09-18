export interface DynamicMenuItem {
  id: string;
  to?: string;
  key?: string;
  icon: string; // Nombre del icono de Lucide
  label: string;
  order: number;
  isActive: boolean;
  role: 'admin' | 'teacher' | 'student';
  submenu?: {
    id: string;
    to: string;
    icon: string;
    label: string;
    order: number;
    isActive: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemData {
  to?: string;
  key?: string;
  icon: string;
  label: string;
  order?: number;
  role: 'admin' | 'teacher' | 'student';
  submenu?: {
    to: string;
    icon: string;
    label: string;
    order?: number;
  }[];
}

export interface UpdateMenuItemData {
  to?: string;
  key?: string;
  icon?: string;
  label?: string;
  order?: number;
  isActive?: boolean;
  submenu?: {
    id?: string;
    to: string;
    icon: string;
    label: string;
    order?: number;
    isActive?: boolean;
  }[];
}
