// Servicio de Google Sheets compatible con navegador
// Usa la API REST de Google Sheets directamente

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

class GoogleSheetsServiceBrowser {
  private sheetId: string;
  private apiKey: string;
  private isInitialized = false;

  constructor() {
    this.sheetId = import.meta.env.VITE_TODO_SHEET_ID || '';
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.initializeService();
  }

  private async initializeService() {
    try {
      if (!this.sheetId || !this.apiKey) {
        throw new Error('Google Sheets configuration not found');
      }

      this.isInitialized = true;
      console.log('✅ Google Sheets Browser Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets Browser Service:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeService();
    }
  }

  // Leer todas las tareas del Google Sheet
  async getTodos(): Promise<TodoItem[]> {
    await this.ensureInitialized();
    
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/A:K?key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values;
      
      if (!rows || rows.length <= 1) {
        return [];
      }

      // Saltar la primera fila (headers) y convertir a objetos TodoItem
      const todos: TodoItem[] = rows.slice(1).map((row: any[], index: number) => ({
        id: row[0] || `todo_${index}`,
        title: row[1] || '',
        description: row[2] || '',
        completed: row[3] === 'TRUE' || row[3] === 'true',
        priority: (row[4] as 'low' | 'medium' | 'high') || 'medium',
        dueDate: row[5] || '',
        assignedTo: row[6] || '',
        notes: row[7] || '',
        createdAt: row[8] || new Date().toISOString(),
        updatedAt: row[9] || new Date().toISOString(),
      }));

      return todos;
    } catch (error) {
      console.error('Error reading todos from Google Sheets:', error);
      throw error;
    }
  }

  // Crear una nueva tarea (solo lectura con API Key)
  async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    throw new Error('Create operation not supported with API Key only. Please use Service Account or OAuth2.');
  }

  // Actualizar una tarea (solo lectura con API Key)
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    throw new Error('Update operation not supported with API Key only. Please use Service Account or OAuth2.');
  }

  // Eliminar una tarea (solo lectura con API Key)
  async deleteTodo(id: string): Promise<void> {
    throw new Error('Delete operation not supported with API Key only. Please use Service Account or OAuth2.');
  }

  // Obtener encargados únicos
  async getAssignees(): Promise<string[]> {
    const todos = await this.getTodos();
    const assignees = todos
      .map(todo => todo.assignedTo)
      .filter(assignee => assignee && assignee.trim() !== '')
      .filter((assignee, index, self) => self.indexOf(assignee) === index);
    
    return assignees.sort();
  }

  // Verificar conexión
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}?key=${this.apiKey}`
      );
      return response.ok;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const googleSheetsServiceBrowser = new GoogleSheetsServiceBrowser();
export type { TodoItem };
