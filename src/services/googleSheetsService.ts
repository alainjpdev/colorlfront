/*
// Google Sheets Service - Comentado temporalmente para evitar problemas de build

// import { google } from 'googleapis';

// Configuración del Service Account
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_ID = import.meta.env.VITE_TODO_SHEET_ID;

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

class GoogleSheetsService {
  private sheets: any;
  private isInitialized = false;

  constructor() {
    // this.initializeService();
  }

  private async initializeService() {
    // Comentado temporalmente
    try {
      if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
        throw new Error('Service Account credentials not configured');
      }

      // Crear cliente de autenticación con Service Account
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: SERVICE_ACCOUNT_EMAIL,
          private_key: SERVICE_ACCOUNT_PRIVATE_KEY,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Inicializar Google Sheets API
      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;
      
      console.log('✅ Google Sheets Service Account initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets Service Account:', error);
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
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'A:K', // Ajustar según las columnas de tu sheet
      });

      const rows = response.data.values;
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

  // Crear una nueva tarea
  async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    await this.ensureInitialized();
    
    try {
      const newTodo: TodoItem = {
        ...todo,
        id: `todo_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const values = [
        newTodo.id,
        newTodo.title,
        newTodo.description,
        newTodo.completed.toString(),
        newTodo.priority,
        newTodo.dueDate,
        newTodo.assignedTo,
        newTodo.notes,
        newTodo.createdAt,
        newTodo.updatedAt,
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'A:K',
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      return newTodo;
    } catch (error) {
      console.error('Error creating todo in Google Sheets:', error);
      throw error;
    }
  }

  // Actualizar una tarea existente
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    await this.ensureInitialized();
    
    try {
      // Primero obtener todas las tareas para encontrar la fila
      const todos = await this.getTodos();
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }

      const updatedTodo = {
        ...todos[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const values = [
        updatedTodo.id,
        updatedTodo.title,
        updatedTodo.description,
        updatedTodo.completed.toString(),
        updatedTodo.priority,
        updatedTodo.dueDate,
        updatedTodo.assignedTo,
        updatedTodo.notes,
        updatedTodo.createdAt,
        updatedTodo.updatedAt,
      ];

      // Actualizar la fila específica (fila = índice + 2 porque empezamos desde la fila 2)
      const rowNumber = todoIndex + 2;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `A${rowNumber}:K${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      return updatedTodo;
    } catch (error) {
      console.error('Error updating todo in Google Sheets:', error);
      throw error;
    }
  }

  // Eliminar una tarea
  async deleteTodo(id: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Primero obtener todas las tareas para encontrar la fila
      const todos = await this.getTodos();
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }

      // Eliminar la fila (fila = índice + 2 porque empezamos desde la fila 2)
      const rowNumber = todoIndex + 2;
      
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // ID de la primera hoja
                  dimension: 'ROWS',
                  startIndex: rowNumber - 1,
                  endIndex: rowNumber,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error deleting todo from Google Sheets:', error);
      throw error;
    }
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
      await this.sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });
      return true;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const googleSheetsService = new GoogleSheetsService();
export type { TodoItem };
*/

// Placeholder temporal - Google Sheets Service deshabilitado
export interface TodoItem {
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

export const googleSheetsService = {
  getTodos: async (): Promise<TodoItem[]> => {
    throw new Error('Google Sheets integration temporarily disabled');
  },
  createTodo: async (): Promise<TodoItem> => {
    throw new Error('Google Sheets integration temporarily disabled');
  },
  updateTodo: async (): Promise<TodoItem> => {
    throw new Error('Google Sheets integration temporarily disabled');
  },
  deleteTodo: async (): Promise<void> => {
    throw new Error('Google Sheets integration temporarily disabled');
  },
  getAssignees: async (): Promise<string[]> => {
    throw new Error('Google Sheets integration temporarily disabled');
  },
  testConnection: async (): Promise<boolean> => {
    return false;
  },
};