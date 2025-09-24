import { DynamicMenuItem, CreateMenuItemData, UpdateMenuItemData } from '../types/menu';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://colorland-app-ff3fdd79ac35.herokuapp.com';

class MenuAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Obtener todos los elementos de menú para un rol específico
  async getMenuItems(role: 'admin' | 'teacher' | 'student'): Promise<DynamicMenuItem[]> {
    return this.request<DynamicMenuItem[]>(`/api/menu?role=${role}`);
  }

  // Obtener todos los elementos de menú (solo admin)
  async getAllMenuItems(): Promise<DynamicMenuItem[]> {
    return this.request<DynamicMenuItem[]>('/api/menu/all');
  }

  // Crear un nuevo elemento de menú
  async createMenuItem(data: CreateMenuItemData): Promise<DynamicMenuItem> {
    return this.request<DynamicMenuItem>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar un elemento de menú existente
  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<DynamicMenuItem> {
    return this.request<DynamicMenuItem>(`/api/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar un elemento de menú
  async deleteMenuItem(id: string): Promise<void> {
    return this.request<void>(`/api/menu/${id}`, {
      method: 'DELETE',
    });
  }

  // Reordenar elementos de menú
  async reorderMenuItems(reorderData: Array<{ id: string; order: number }>): Promise<void> {
    console.log('🔄 ReorderMenuItems - reorderData:', reorderData);
    console.log('🔄 ReorderMenuItems - reorderData details:', reorderData.map(item => ({ id: item.id, order: item.order })));
    console.log('🔄 ReorderMenuItems - reorderData IDs:', reorderData.map(item => item.id));
    console.log('🔄 ReorderMenuItems - full reorderData JSON:', JSON.stringify(reorderData, null, 2));
    console.log('🔄 ReorderMenuItems - token:', localStorage.getItem('token'));
    return this.request<void>('/api/menu/reorder', {
      method: 'PUT',
      body: JSON.stringify({ reorderData }),
    });
  }

  // Toggle activar/desactivar elemento de menú
  async toggleMenuItem(id: string): Promise<DynamicMenuItem> {
    return this.request<DynamicMenuItem>(`/api/menu/${id}/toggle`, {
      method: 'PUT',
    });
  }

  // Restaurar elemento de menú oculto
  async restoreMenuItem(id: string): Promise<{ success: boolean; message: string; item: DynamicMenuItem }> {
    return this.request<{ success: boolean; message: string; item: DynamicMenuItem }>(`/api/menu/${id}/restore`, {
      method: 'PUT',
    });
  }

  // Obtener todos los menús incluyendo los ocultos
  async getAllMenuItemsWithHidden(): Promise<DynamicMenuItem[]> {
    return this.request<DynamicMenuItem[]>('/api/menu/all?includeHidden=true');
  }

  // Obtener iconos disponibles
  async getAvailableIcons(): Promise<string[]> {
    // Lista de iconos disponibles de Lucide React - v3 (sin duplicaciones)
    return [
      'Home', 'Users', 'FileText', 'ShoppingCart', 'Building2', 'CheckSquare',
      'Settings', 'User', 'Plus', 'List', 'BookOpen', 'Calendar', 'ClipboardList',
      'BarChart3', 'Database', 'MessageCircle', 'Layers', 'ExternalLink',
      'UserPlus', 'Mail', 'Phone', 'MapPin', 'Clock', 'Star', 'Heart',
      'Download', 'Upload', 'Edit', 'Trash2', 'Save', 'Search', 'Filter',
      'RefreshCw', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Shield', 'Key',
      'Bell', 'BellOff', 'Volume2', 'VolumeX', 'Play', 'Pause', 'Stop',
      'SkipBack', 'SkipForward', 'Repeat', 'Shuffle', 'Music', 'Video',
      'Camera', 'Image', 'File', 'Folder', 'FolderOpen', 'Archive',
      'Tag', 'Tags', 'Flag', 'Bookmark', 'BookmarkCheck', 'ThumbsUp',
      'ThumbsDown', 'Smile', 'Frown', 'Meh', 'Laugh', 'Angry', 'Sad',
      'Wink', 'Tongue', 'Kiss', 'HeartHandshake', 'Hand', 'Handshake',
      'Fingerprint', 'Scan', 'QrCode', 'Barcode', 'CreditCard', 'Wallet',
      'Coins', 'Banknote', 'Receipt', 'Calculator', 'Percent', 'TrendingUp',
      'TrendingDown', 'Activity', 'Pulse', 'Zap', 'Battery', 'BatteryLow',
      'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Radio', 'Tv',
      'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Headphones',
      'Speaker', 'Mic', 'MicOff', 'Volume1'
    ];
  }
}

export const menuAPI = new MenuAPI();
