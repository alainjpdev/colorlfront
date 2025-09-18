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

  // Obtener iconos disponibles
  async getAvailableIcons(): Promise<string[]> {
    // Lista de iconos disponibles de Lucide React
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
      'Speaker', 'Mic', 'MicOff', 'Volume1', 'Volume2', 'VolumeX'
    ];
  }
}

export const menuAPI = new MenuAPI();
