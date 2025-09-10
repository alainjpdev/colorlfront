import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckSquare, Square, Plus, Edit, Trash2, Calendar, Clock, Filter, Search, RefreshCw, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { airtableMigration } from '../../utils/airtableMigration';

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

export const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: '',
    notes: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Lista de encargados disponibles (se actualiza dinámicamente)
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [showAddAssigneeFor, setShowAddAssigneeFor] = useState<string | null>(null);

  // Función para extraer encargados únicos de las tareas
  const updateAvailableAssignees = (todosList: TodoItem[]) => {
    const assignees = todosList
      .map(todo => todo.assignedTo)
      .filter(assignee => assignee && assignee.trim() !== '' && assignee !== 'Sin encargado seleccionado')
      .filter((assignee, index, array) => array.indexOf(assignee) === index) // Eliminar duplicados
      .sort(); // Ordenar alfabéticamente
    
    setAvailableAssignees(assignees);
  };

  // Función para agregar nuevo encargado
  const addNewAssignee = () => {
    if (newAssignee.trim() && showAddAssigneeFor) {
      const newAssigneeName = newAssignee.trim();
      
      // Agregar a la lista de encargados disponibles si no existe
      if (!availableAssignees.includes(newAssigneeName)) {
        const updatedAssignees = [...availableAssignees, newAssigneeName].sort();
        setAvailableAssignees(updatedAssignees);
      }
      
      // Asignar el nuevo encargado a la tarea específica
      handleAssigneeChange(showAddAssigneeFor, newAssigneeName);
      
      // Limpiar y cerrar
      setNewAssignee('');
      setShowAddAssigneeFor(null);
      setSuccessMessage(`✅ Nuevo encargado "${newAssigneeName}" agregado y asignado`);
    }
  };

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddAssigneeFor) {
        const target = event.target as HTMLElement;
        if (!target.closest('.assignee-modal')) {
          setShowAddAssigneeFor(null);
          setNewAssignee('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddAssigneeFor]);

  // Configuración de Google Sheets
  const TODO_SHEET_ID = import.meta.env.VITE_TODO_SHEET_ID || '1D4XNNt_GJ0WFXB64FFphwYP4jPlhtw_D1cbqKa1obus';
  const TODO_SHEET_NAME = 'Sheet1';
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

  // Función para autenticación OAuth2
  const authenticateWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID no configurado');
      return;
    }

    try {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/todo')}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${encodeURIComponent('todo_auth')}&` +
        `prompt=consent`;

      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Error en autenticación:', err);
      setError('Error en la autenticación con Google');
    }
  };

  // Función para intercambiar código por tokens
  const exchangeCodeForTokens = async (code: string) => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin + '/dashboard/todo'
        })
      });

      if (!response.ok) {
        throw new Error('Error al intercambiar código por tokens');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error al intercambiar código:', err);
      throw err;
    }
  };

  // Función para guardar tokens en localStorage
  const saveTokensToStorage = (accessToken: string, refreshToken?: string, expiresIn?: number) => {
    try {
      const expiryTime = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (3600 * 1000);
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken);
      }
    } catch (err) {
      console.error('Error al guardar tokens:', err);
    }
  };

  // Función para renovar token usando refresh token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('google_refresh_token');
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Error al renovar token');
      }

      const data = await response.json();
      saveTokensToStorage(data.access_token, refreshToken, data.expires_in);
      setAccessToken(data.access_token);
      
      return data.access_token;
    } catch (err) {
      console.error('Error al renovar token:', err);
      // Si falla la renovación, limpiar tokens y requerir nueva autorización
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
      localStorage.removeItem('google_token_expiry');
      setAccessToken(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  // Función para verificar si el token es válido
  const isTokenValid = () => {
    try {
      const token = localStorage.getItem('google_access_token');
      const expiry = localStorage.getItem('google_token_expiry');
      
      if (!token || !expiry) return false;
      
      const now = Date.now();
      const expiryTime = parseInt(expiry);
      
      return now < expiryTime;
    } catch (err) {
      console.error('Error al verificar token:', err);
      return false;
    }
  };

  // Función para obtener todos desde Google Sheets
  const fetchTodosFromSheets = async () => {
    if (!GOOGLE_API_KEY) {
      setError('API Key de Google no configurada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Usar solo API Key
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${TODO_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del Google Sheet');
      }

      const data = await response.json();
      
      if (!data.values || data.values.length < 2) {
        setTodos([]);
        setIsConnected(true);
        setIsLoading(false);
        return;
      }

      const sheetHeaders = data.values[0];
      const rows = data.values.slice(1);
      
      // Debug: Mostrar las columnas del Google Sheet
      console.log('📋 Headers del Google Sheet:', sheetHeaders);
      console.log('📊 Número de columnas:', sheetHeaders?.length);
      console.log('📝 Primera fila de datos:', rows[0]);
      
      // Mostrar cada columna con su índice
      if (sheetHeaders) {
        console.log('🔍 Mapeo de columnas:');
        sheetHeaders.forEach((header: string, index: number) => {
          console.log(`  ${index}: "${header}"`);
        });
      }
      
      // Función para encontrar el índice de una columna por nombre
      const findColumnIndex = (searchTerms: string[]) => {
        for (const term of searchTerms) {
          const index = sheetHeaders.findIndex((header: string) => 
            header.toLowerCase().includes(term.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };

      // Encontrar índices de columnas dinámicamente
      const nameIndex = findColumnIndex(['name', 'nombre', 'título', 'title']);
      const completedIndex = findColumnIndex(['completed', 'completado', 'estado']);
      const priorityIndex = findColumnIndex(['prioridad', 'priority']);
      const dueDateIndex = findColumnIndex(['fecha de entrega', 'fecha entrega', 'fecha', 'due date']);
      const assignedToIndex = findColumnIndex(['encargado', 'asignado', 'responsable', 'assigned']);
      const descriptionIndex = findColumnIndex(['descripción', 'descripcion', 'description', 'detalle']);
      const notesIndex = findColumnIndex(['notas', 'notes', 'comentarios', 'observaciones']);

      // Si no se encuentran las columnas, usar índices por defecto basados en la estructura típica
      const finalNameIndex = nameIndex !== -1 ? nameIndex : 0;
      const finalCompletedIndex = completedIndex !== -1 ? completedIndex : 1;
      const finalPriorityIndex = priorityIndex !== -1 ? priorityIndex : 2;
      const finalDueDateIndex = dueDateIndex !== -1 ? dueDateIndex : 3;
      const finalAssignedToIndex = assignedToIndex !== -1 ? assignedToIndex : 4;
      const finalDescriptionIndex = descriptionIndex !== -1 ? descriptionIndex : 5;
      const finalNotesIndex = notesIndex !== -1 ? notesIndex : 6;

      console.log('🎯 Índices de columnas encontrados:', {
        name: nameIndex,
        completed: completedIndex,
        priority: priorityIndex,
        dueDate: dueDateIndex,
        assignedTo: assignedToIndex,
        description: descriptionIndex,
        notes: notesIndex
      });

      console.log('🎯 Índices finales que se usarán:', {
        name: finalNameIndex,
        completed: finalCompletedIndex,
        priority: finalPriorityIndex,
        dueDate: finalDueDateIndex,
        assignedTo: finalAssignedToIndex,
        description: finalDescriptionIndex,
        notes: finalNotesIndex
      });

      // Debug: Mostrar la estructura real del sheet
      console.log('📊 Estructura real del Google Sheet:');
      console.log('  A (0):', sheetHeaders[0] || 'VACÍO');
      console.log('  B (1):', sheetHeaders[1] || 'VACÍO');
      console.log('  C (2):', sheetHeaders[2] || 'VACÍO');
      console.log('  D (3):', sheetHeaders[3] || 'VACÍO');
      console.log('  E (4):', sheetHeaders[4] || 'VACÍO');
      console.log('  F (5):', sheetHeaders[5] || 'VACÍO');
      console.log('  G (6):', sheetHeaders[6] || 'VACÍO');
      console.log('  H (7):', sheetHeaders[7] || 'VACÍO');

      const mappedTodos: TodoItem[] = rows.map((row: any[], index: number) => {
        // Mapear fecha de entrega desde la columna correcta
        let dueDate = '';
        if (row[finalDueDateIndex]) {
          try {
            // Intentar parsear la fecha en diferentes formatos
            const dateValue = row[finalDueDateIndex].toString().trim();
            if (dateValue) {
              // Si es una fecha válida, convertirla a formato ISO
              const parsedDate = new Date(dateValue);
              if (!isNaN(parsedDate.getTime())) {
                dueDate = parsedDate.toISOString();
              } else {
                // Si no se puede parsear, usar el valor tal como está
                dueDate = dateValue;
              }
            }
          } catch (error) {
            console.warn('Error al parsear fecha:', row[dueDateIndex], error);
            dueDate = row[dueDateIndex] || '';
          }
        }

        return {
          id: `todo-${index + 1}`,
          title: row[nameIndex] || '', // Name
          description: row[descriptionIndex] || '', // Descripcion
          completed: (() => {
            const completedValue = (row[completedIndex] || '').toLowerCase().trim();
            return completedValue === 'true' || 
                   completedValue === 'completed' || 
                   completedValue === 'completado' || 
                   completedValue === 'finalizado' ||
                   completedValue === 'true';
          })(), // Completed - maneja múltiples valores en español
          priority: (() => {
            const priority = (row[priorityIndex] || '').toLowerCase();
            if (priority === 'alta' || priority === 'high') return 'high';
            if (priority === 'baja' || priority === 'low') return 'low';
            if (priority === 'media' || priority === 'medium') return 'medium';
            return 'medium'; // valor por defecto
          })() as 'low' | 'medium' | 'high', // Prioridad
          dueDate: dueDate, // Fecha de entrega
          assignedTo: row[assignedToIndex] || '', // Encargado de la tarea
          notes: row[notesIndex] || '', // Notas
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      setTodos(mappedTodos);
      updateAvailableAssignees(mappedTodos);
      setIsConnected(true);
    } catch (err) {
      console.error('Error al obtener todos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Agregar nuevo todo a Google Sheets
  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;

    if (!accessToken && !GOOGLE_API_KEY) {
      setError('No se puede agregar tarea - Sin autenticación');
      return;
    }

    try {
      // Obtener el mapeo correcto de columnas
      const columnMapping = await getColumnMapping();
      
      // Convertir prioridad de inglés a español
      const priorityMap = {
        'low': 'baja',
        'medium': 'media', 
        'high': 'alta'
      };
      
      // Crear array de valores con el mapeo correcto de columnas
      const values = new Array(Math.max(...Object.values(columnMapping)) + 1).fill('');
      
      // Mapear valores a las columnas correctas
      values[columnMapping.name] = newTodo.title.trim();
      values[columnMapping.completed] = 'pendiente';
      values[columnMapping.priority] = priorityMap[newTodo.priority] || 'media';
      values[columnMapping.dueDate] = newTodo.dueDate || '';
      values[columnMapping.assignedTo] = newTodo.assignedTo.trim() || '';
      values[columnMapping.description] = newTodo.description.trim() || '';
      values[columnMapping.notes] = newTodo.notes.trim() || '';
      
      // Agregar fecha de creación (hoy) si existe la columna
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      if (columnMapping.createdAt !== undefined) {
        values[columnMapping.createdAt] = today;
      }

      console.log('🔄 Agregando nueva tarea con mapeo de columnas:', {
        columnMapping,
        values,
        newTodo
      });

      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        try {
          const validToken = await getValidToken();
          url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${TODO_SHEET_NAME}:append?valueInputOption=USER_ENTERED`;
          headers['Authorization'] = `Bearer ${validToken}`;
        } catch (err) {
          console.error('Error al obtener token válido:', err);
          throw new Error('No se pudo obtener un token válido para agregar la tarea');
        }
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${TODO_SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [values] })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error al agregar tarea: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Tarea agregada exitosamente a Google Sheets');

      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', notes: '' });
      setShowAddForm(false);
      await fetchTodosFromSheets();
      setSuccessMessage('✅ Tarea agregada exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al agregar tarea:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Toggle completado en Google Sheets
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() };
      
      // Actualizar en Google Sheets
      await updateTodoInSheets(updatedTodo, 'completed');
      
      // Actualizar estado local
      const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t);
      setTodos(updatedTodos);
      updateAvailableAssignees(updatedTodos);
      setSuccessMessage('✅ Estado actualizado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError('Error al actualizar el estado');
    }
  };

  // Cambiar prioridad de una tarea
  const handlePriorityChange = async (id: string, newPriority: 'low' | 'medium' | 'high') => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { ...todo, priority: newPriority, updatedAt: new Date().toISOString() };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'priority');
        setSuccessMessage('✅ Prioridad actualizada exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Prioridad actualizada localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar prioridad:', err);
      setError('Error al actualizar la prioridad');
    }
  };

  // Cambiar encargado de una tarea
  const handleAssigneeChange = async (id: string, newAssignee: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { ...todo, assignedTo: newAssignee, updatedAt: new Date().toISOString() };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'assignedTo');
        setSuccessMessage('✅ Encargado actualizado exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Encargado actualizado localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar encargado:', err);
      setError('Error al actualizar el encargado');
    }
  };

  // Cambiar estado de una tarea
  const handleStatusChange = async (id: string, newStatus: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const completed = newStatus === 'completado';
      const updatedTodo = { ...todo, completed, updatedAt: new Date().toISOString() };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'completed');
        setSuccessMessage('✅ Estado actualizado exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Estado actualizado localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado');
    }
  };

  // Cambiar fecha de entrega de una tarea
  const handleDueDateChange = async (id: string, newDueDate: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { 
        ...todo, 
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : '', 
        updatedAt: new Date().toISOString() 
      };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'dueDate');
        setSuccessMessage(`✅ Fecha de entrega actualizada: ${newDueDate ? formatDate(updatedTodo.dueDate) : 'Sin fecha'}`);
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Fecha actualizada localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar fecha de entrega:', err);
      setError('Error al actualizar la fecha de entrega');
    }
  };

  // Cambiar título de una tarea
  const handleTitleChange = async (id: string, newTitle: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { 
        ...todo, 
        title: newTitle, 
        updatedAt: new Date().toISOString() 
      };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'title');
        setSuccessMessage('✅ Título actualizado exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Título actualizado localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar título:', err);
      setError('Error al actualizar el título');
    }
  };

  // Cambiar descripción de una tarea
  const handleDescriptionChange = async (id: string, newDescription: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { 
        ...todo, 
        description: newDescription, 
        updatedAt: new Date().toISOString() 
      };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'description');
        setSuccessMessage('✅ Descripción actualizada exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Descripción actualizada localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar descripción:', err);
      setError('Error al actualizar la descripción');
    }
  };

  // Cambiar notas de una tarea
  const handleNotesChange = async (id: string, newNotes: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = { 
        ...todo, 
        notes: newNotes, 
        updatedAt: new Date().toISOString() 
      };
      
      // Actualizar estado local inmediatamente
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      
      // Intentar actualizar en Google Sheets (puede fallar con API Key)
      try {
        await updateTodoInSheets(updatedTodo, 'notes');
        setSuccessMessage('✅ Notas actualizadas exitosamente');
      } catch (sheetsError) {
        console.warn('⚠️ No se pudo actualizar en Google Sheets (solo lectura con API Key):', sheetsError);
        setSuccessMessage('✅ Notas actualizadas localmente (requiere OAuth2 para guardar en Google Sheets)');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar notas:', err);
      setError('Error al actualizar las notas');
    }
  };

  // Eliminar todo de Google Sheets
  const deleteTodo = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
      await deleteTodoFromSheets(id);
      setTodos(todos.filter(todo => todo.id !== id));
      setSuccessMessage('✅ Tarea eliminada exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError('Error al eliminar la tarea');
    }
  };

  // Función para obtener token válido (renovando si es necesario)
  const getValidToken = async () => {
    if (accessToken && isTokenValid()) {
      return accessToken;
    }
    
    if (accessToken && !isTokenValid()) {
      try {
        console.log('🔄 Token expirado, renovando...');
        return await refreshAccessToken();
      } catch (err) {
        console.error('Error al renovar token:', err);
        throw new Error('No se pudo renovar el token de acceso');
      }
    }
    
    throw new Error('No hay token de acceso disponible');
  };

  // Función para obtener la estructura del sheet y mapear columnas correctamente
  const getColumnMapping = async () => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${TODO_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener estructura del sheet');
      }
      
      const data = await response.json();
      const sheetHeaders = data.values[0] || [];
      
      // Función para encontrar el índice de una columna por nombre
      const findColumnIndex = (searchTerms: string[]) => {
        for (const term of searchTerms) {
          const index = sheetHeaders.findIndex((header: string) => 
            header.toLowerCase().includes(term.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };

      // Mapear columnas dinámicamente
      const mapping = {
        name: findColumnIndex(['name', 'nombre', 'título', 'title']) !== -1 ? 
              findColumnIndex(['name', 'nombre', 'título', 'title']) : 0,
        completed: findColumnIndex(['completed', 'completado', 'estado']) !== -1 ? 
                  findColumnIndex(['completed', 'completado', 'estado']) : 1,
        priority: findColumnIndex(['prioridad', 'priority']) !== -1 ? 
                 findColumnIndex(['prioridad', 'priority']) : 2,
        dueDate: findColumnIndex(['fecha de entrega', 'fecha entrega', 'fecha', 'due date']) !== -1 ? 
                findColumnIndex(['fecha de entrega', 'fecha entrega', 'fecha', 'due date']) : 3,
        assignedTo: findColumnIndex(['encargado', 'asignado', 'responsable', 'assigned']) !== -1 ? 
                   findColumnIndex(['encargado', 'asignado', 'responsable', 'assigned']) : 4,
        description: findColumnIndex(['descripción', 'descripcion', 'description', 'detalle']) !== -1 ? 
                    findColumnIndex(['descripción', 'descripcion', 'description', 'detalle']) : 5,
        notes: findColumnIndex(['notas', 'notes', 'comentarios', 'observaciones']) !== -1 ? 
               findColumnIndex(['notas', 'notes', 'comentarios', 'observaciones']) : 6,
        createdAt: findColumnIndex(['fecha de inicio', 'fecha de creacion', 'fecha creacion', 'created at', 'fecha inicio']) !== -1 ? 
                  findColumnIndex(['fecha de inicio', 'fecha de creacion', 'fecha creacion', 'created at', 'fecha inicio']) : -1
      };

      console.log('🗺️ Mapeo de columnas detectado:', mapping);
      console.log('📋 Headers del sheet:', sheetHeaders);
      
      return mapping;
    } catch (error) {
      console.error('Error al obtener mapeo de columnas:', error);
      // Fallback a mapeo por defecto
      return {
        name: 0,
        completed: 1,
        priority: 2,
        dueDate: 3,
        assignedTo: 4,
        description: 5,
        notes: 6,
        createdAt: -1 // No hay columna de fecha de creación por defecto
      };
    }
  };

  // Función para actualizar todo en Google Sheets
  const updateTodoInSheets = async (todo: TodoItem, fieldToUpdate?: string) => {
    if (!accessToken && !GOOGLE_API_KEY) {
      throw new Error('No se puede actualizar tarea - Sin autenticación');
    }

    try {
      // Buscar la fila del todo en el sheet
      const todoIndex = todos.findIndex(t => t.id === todo.id);
      if (todoIndex === -1) throw new Error('Tarea no encontrada');

      const rowNumber = todoIndex + 2; // +2 porque la fila 1 es el header
      
      // Si no se especifica campo, actualizar toda la fila (comportamiento anterior)
      if (!fieldToUpdate) {
        return updateFullRowInSheets(todo, rowNumber);
      }
      
      // Obtener el mapeo correcto de columnas
      const columnMapping = await getColumnMapping();
      
      // Determinar qué columna actualizar basado en el campo
      let columnToUpdate = '';
      let valueToUpdate = '';
      
      switch (fieldToUpdate) {
        case 'title':
          columnToUpdate = String.fromCharCode(65 + columnMapping.name); // A, B, C, etc.
          valueToUpdate = todo.title || '';
          break;
        case 'description':
          columnToUpdate = String.fromCharCode(65 + columnMapping.description);
          valueToUpdate = todo.description || '';
          break;
        case 'notes':
          columnToUpdate = String.fromCharCode(65 + columnMapping.notes);
          valueToUpdate = todo.notes || '';
          break;
        case 'priority':
          columnToUpdate = String.fromCharCode(65 + columnMapping.priority);
          const priorityMap = { 'low': 'baja', 'medium': 'media', 'high': 'alta' };
          valueToUpdate = priorityMap[todo.priority] || 'media';
          break;
        case 'completed':
          columnToUpdate = String.fromCharCode(65 + columnMapping.completed);
          valueToUpdate = todo.completed ? 'completado' : 'pendiente';
          break;
        case 'dueDate':
          columnToUpdate = String.fromCharCode(65 + columnMapping.dueDate);
          if (todo.dueDate) {
            try {
              const date = new Date(todo.dueDate);
              if (!isNaN(date.getTime())) {
                valueToUpdate = date.toISOString().split('T')[0];
              } else {
                valueToUpdate = todo.dueDate;
              }
            } catch (error) {
              valueToUpdate = todo.dueDate;
            }
          } else {
            valueToUpdate = '';
          }
          break;
        case 'assignedTo':
          columnToUpdate = String.fromCharCode(65 + columnMapping.assignedTo);
          valueToUpdate = todo.assignedTo || '';
          break;
        default:
          return updateFullRowInSheets(todo, rowNumber);
      }

      const range = `${TODO_SHEET_NAME}!${columnToUpdate}${rowNumber}`;
      const values = [[valueToUpdate]];
      
      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        try {
          const validToken = await getValidToken();
          url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
          headers['Authorization'] = `Bearer ${validToken}`;
        } catch (err) {
          console.error('Error al obtener token válido:', err);
          throw new Error('No se pudo obtener un token válido para la actualización');
        }
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      }

      console.log(`🔄 Actualizando campo ${fieldToUpdate} en Google Sheets:`, {
        todoId: todo.id,
        rowNumber,
        range,
        value: valueToUpdate,
        columnToUpdate,
        url
      });
      
      // Debug: Mostrar qué columna se está actualizando
      console.log(`📍 Actualizando columna ${columnToUpdate} con valor: "${valueToUpdate}"`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error al actualizar ${fieldToUpdate}: ${response.status} ${response.statusText}`);
      }
      
      console.log(`✅ Campo ${fieldToUpdate} actualizado exitosamente`);
      
    } catch (err) {
      console.error('Error al actualizar campo en Google Sheets:', err);
      throw err;
    }
  };

  // Función para actualizar toda la fila (fallback)
  const updateFullRowInSheets = async (todo: TodoItem, rowNumber: number) => {
    const priorityMap = { 'low': 'baja', 'medium': 'media', 'high': 'alta' };
    const completedValue = todo.completed ? 'completado' : 'pendiente';
    
    let formattedDueDate = '';
    if (todo.dueDate) {
      try {
        const date = new Date(todo.dueDate);
        if (!isNaN(date.getTime())) {
          formattedDueDate = date.toISOString().split('T')[0];
        } else {
          formattedDueDate = todo.dueDate;
        }
      } catch (error) {
        formattedDueDate = todo.dueDate;
      }
    }
    
    // Solo actualizar las columnas que existen, sin incluir progreso vacío
    const values = [[
      todo.title || '', // A - Name
      completedValue, // B - Completed
      priorityMap[todo.priority] || 'media', // C - Prioridad
      formattedDueDate, // D - Fecha de entrega
      '', // E - Progreso (vacío, no lo usamos)
      todo.assignedTo || '', // F - Encargado
      todo.description || '', // G - Descripcion
      todo.notes || '' // H - Notas
    ]];

    // Actualizar solo las columnas A-H (incluyendo la columna de progreso vacía)
    const range = `${TODO_SHEET_NAME}!A${rowNumber}:H${rowNumber}`;
    
    let url: string;
    let headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    if (accessToken) {
      const validToken = await getValidToken();
      url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
      headers['Authorization'] = `Bearer ${validToken}`;
    } else {
      url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar fila completa: ${response.status}`);
    }
  };

  // Función para eliminar todo de Google Sheets
  const deleteTodoFromSheets = async (id: string) => {
    if (!accessToken && !GOOGLE_API_KEY) {
      throw new Error('No se puede eliminar tarea - Sin autenticación');
    }

    try {
      const todoIndex = todos.findIndex(t => t.id === id);
      if (todoIndex === -1) throw new Error('Tarea no encontrada');

      // Obtener el mapeo correcto de columnas para saber cuántas columnas limpiar
      const columnMapping = await getColumnMapping();
      const maxColumnIndex = Math.max(...Object.values(columnMapping).filter(v => v !== -1));
      const range = `${TODO_SHEET_NAME}!A${todoIndex + 2}:${String.fromCharCode(65 + maxColumnIndex)}${todoIndex + 2}`;
      
      // Crear array de valores vacíos para limpiar la fila
      const emptyValues = new Array(maxColumnIndex + 1).fill('');
      
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        try {
          const validToken = await getValidToken();
          url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
          headers['Authorization'] = `Bearer ${validToken}`;
        } catch (err) {
          console.error('Error al obtener token válido:', err);
          throw new Error('No se pudo obtener un token válido para eliminar la tarea');
        }
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${TODO_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      }

      console.log('🗑️ Eliminando tarea de Google Sheets:', {
        todoId: id,
        todoIndex,
        range,
        maxColumnIndex,
        emptyValues
      });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          values: [emptyValues] // Limpiar la fila
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error al eliminar tarea: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Tarea eliminada exitosamente de Google Sheets');
      
    } catch (err) {
      console.error('Error al eliminar tarea de Google Sheets:', err);
      throw err;
    }
  };


  // Migrar datos desde Airtable
  const handleMigrateFromAirtable = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      
      console.log('🔄 Iniciando migración desde Airtable público...');
      
      // Migrar datos desde Airtable público
      await airtableMigration.migrateToGoogleSheets();
      
      setSuccessMessage('✅ Migración desde Airtable completada. Se crearon 5 tareas de ejemplo. Revisa la consola para más detalles.');
      
      // Recargar datos del Google Sheet
      await fetchTodosFromSheets();
      
    } catch (err) {
      console.error('❌ Error en la migración:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido en la migración');
    } finally {
      setIsMigrating(false);
    }
  };

  // Efecto para limpiar mensajes de éxito automáticamente
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Efecto para manejar OAuth2 y cargar datos
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state === 'todo_auth') {
        console.log('🔑 Código de autorización recibido:', code);
        
        try {
          const tokens = await exchangeCodeForTokens(code);
          console.log('🔑 Tokens obtenidos:', tokens);
          
          saveTokensToStorage(tokens.access_token, tokens.refresh_token, tokens.expires_in);
          setAccessToken(tokens.access_token);
          setIsAuthenticated(true);
          
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Cargar datos después de autenticación
          fetchTodosFromSheets();
        } catch (err) {
          console.error('Error al intercambiar código por tokens:', err);
          setError('Error en la autenticación con Google');
        }
      }
    };

    const loadTodos = async () => {
      console.log('🔄 Cargando To Do...');
      
      // Verificar si hay token válido
      if (isTokenValid()) {
        const token = localStorage.getItem('google_access_token');
        setAccessToken(token);
        setIsAuthenticated(true);
        console.log('🔑 Token OAuth2 válido encontrado, cargando desde Google Sheets...');
        fetchTodosFromSheets();
      } else {
        // Token expirado o no existe, intentar renovar si hay refresh token
        const refreshToken = localStorage.getItem('google_refresh_token');
        if (refreshToken) {
          console.log('🔄 Token expirado, intentando renovar con refresh token...');
          try {
            const newToken = await refreshAccessToken();
            setAccessToken(newToken);
            setIsAuthenticated(true);
            console.log('✅ Token renovado exitosamente, cargando desde Google Sheets...');
            fetchTodosFromSheets();
            return;
          } catch (err) {
            console.error('❌ Error al renovar token:', err);
            // Si falla la renovación, limpiar tokens y continuar con API Key o datos de ejemplo
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_refresh_token');
            localStorage.removeItem('google_token_expiry');
            setAccessToken(null);
            setIsAuthenticated(false);
          }
        }
        
        // Si no hay refresh token o falló la renovación, usar API Key o datos de ejemplo
        if (GOOGLE_API_KEY) {
          console.log('🔑 API Key encontrada, cargando desde Google Sheets...');
          fetchTodosFromSheets();
        } else {
          console.log('⚠️ Sin autenticación, cargando datos de ejemplo...');
          // Cargar datos de ejemplo si no hay autenticación
          setTodos([
            {
              id: '1',
              title: 'Tarea de ejemplo 1',
              description: 'Esta es una tarea de ejemplo para demostrar la funcionalidad',
              priority: 'high',
              completed: false,
              dueDate: new Date().toISOString().split('T')[0],
              assignedTo: 'Juan Pérez',
              notes: 'Esta tarea requiere revisión urgente',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Tarea de ejemplo 2',
              description: 'Otra tarea de ejemplo con prioridad media',
              priority: 'medium',
              completed: true,
              dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              assignedTo: 'María García',
              notes: 'Tarea completada exitosamente',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]);
          setIsLoading(false);
        }
      }
    };

    // Manejar callback de OAuth2
    handleOAuthCallback();
    
    // Cargar datos
    loadTodos();
  }, []);


  // Filtrar todos
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && todo.completed) ||
                         (filterStatus === 'pending' && !todo.completed);
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Obtener color de prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener texto de prioridad
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Estadísticas
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;
  const highPriorityTodos = todos.filter(todo => todo.priority === 'high' && !todo.completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Cargando tareas desde Google Sheets...</p>
        </div>
      </div>
    );
  }

  // Si no hay OAuth2 autorizado ni API Key, mostrar pantalla de autorización
  if (!accessToken && !isAuthenticated && !GOOGLE_API_KEY) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Autorización Requerida
            </h2>
            <p className="text-gray-600 mb-6">
              Para poder gestionar tareas y modificar datos en Google Sheets, 
              necesitas autorizar la aplicación con tu cuenta de Google.
            </p>
            <Button 
              onClick={authenticateWithGoogle} 
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3"
              disabled={!GOOGLE_CLIENT_ID}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Conectar con Google
            </Button>
            {!GOOGLE_CLIENT_ID && (
              <p className="text-sm text-red-600 mt-2">
                Error: GOOGLE_CLIENT_ID no está configurado
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">To Do - Lista de Tareas</h1>
          <p className="text-text-secondary mt-1">
            Gestiona tus tareas y mantén el control de tus actividades
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(GOOGLE_API_KEY || accessToken) ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-green-50 text-green-700 hover:bg-green-100"
                onClick={() => window.open('https://docs.google.com/spreadsheets/d/1D4XNNt_GJ0WFXB64FFphwYP4jPlhtw_D1cbqKa1obus/edit?gid=0#gid=0', '_blank')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Abrir Google Sheet
              </Button>
              <Button onClick={() => fetchTodosFromSheets()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              {!accessToken && GOOGLE_CLIENT_ID && (
                <Button 
                  onClick={authenticateWithGoogle} 
                  variant="outline"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Conectar con Google
                </Button>
              )}
              {console.log('🔍 Debug botón OAuth:', { accessToken, GOOGLE_CLIENT_ID, showButton: !accessToken && GOOGLE_CLIENT_ID })}
            </div>
          ) : (
            <div className="text-center">
              <Button variant="outline" className="bg-red-50 text-red-700" disabled>
                <AlertCircle className="w-4 h-4 mr-2" />
                No Conectado
              </Button>
              <div className="text-xs text-gray-500 mt-1">
                <p>Configura la API Key</p>
              </div>
            </div>
          )}
          <Button onClick={() => setShowAddForm(true)} disabled={!(GOOGLE_API_KEY || accessToken)}>
            <Plus className="w-5 h-5 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">{totalTodos}</h3>
          <p className="text-gray-600">Total Tareas</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-green-600">{completedTodos}</h3>
          <p className="text-gray-600">Completadas</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-yellow-600">{pendingTodos}</h3>
          <p className="text-gray-600">Pendientes</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-red-600">{highPriorityTodos}</h3>
          <p className="text-gray-600">Prioridad Alta</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las prioridades</option>
              <option value="high">Alta prioridad</option>
              <option value="medium">Media prioridad</option>
              <option value="low">Baja prioridad</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las tareas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Todos List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <Card className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay tareas</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterPriority !== 'all' || filterStatus !== 'all' 
                ? 'No se encontraron tareas con los filtros aplicados'
                : 'Crea tu primera tarea para comenzar'
              }
            </p>
            {!searchTerm && filterPriority === 'all' && filterStatus === 'all' && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Tarea
              </Button>
            )}
          </Card>
        ) : (
          filteredTodos.map((todo) => (
            <Card key={todo.id} className={`transition-all duration-200 ${todo.completed ? 'opacity-75' : ''}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`mt-1 p-1 rounded transition-colors ${
                    todo.completed 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {todo.completed ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={todo.title || ''}
                        onChange={(e) => handleTitleChange(todo.id, e.target.value)}
                        className={`text-lg font-medium bg-transparent border-none outline-none w-full ${todo.completed ? 'line-through text-gray-500' : 'text-text'} hover:bg-gray-50 px-1 py-0.5 rounded`}
                        placeholder="Sin título seleccionado"
                      />
                      <textarea
                        value={todo.description || ''}
                        onChange={(e) => handleDescriptionChange(todo.id, e.target.value)}
                        className={`text-sm mt-1 bg-transparent border-none outline-none w-full resize-none ${todo.completed ? 'text-gray-400' : 'text-text-secondary'} hover:bg-gray-50 px-1 py-0.5 rounded`}
                        placeholder="Sin descripción seleccionada"
                        rows={2}
                      />
                      <div className={`text-xs mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded ${todo.completed ? 'opacity-60' : ''}`}>
                        <span className="font-medium text-yellow-800">Notas:</span>
                        <textarea
                          value={todo.notes || ''}
                          onChange={(e) => handleNotesChange(todo.id, e.target.value)}
                          className="text-yellow-700 mt-1 w-full bg-transparent border-none outline-none resize-none hover:bg-yellow-100 px-1 py-0.5 rounded"
                          placeholder="Agregar notas..."
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <select
                          value={todo.priority}
                          onChange={(e) => handlePriorityChange(todo.id, e.target.value as 'low' | 'medium' | 'high')}
                          className={`px-2 py-1 rounded-full border text-xs ${getPriorityColor(todo.priority)}`}
                        >
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                        </select>
                        <select
                          value={todo.completed ? 'completado' : 'pendiente'}
                          onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                          className={`px-2 py-1 rounded-full border text-xs flex items-center gap-1 ${
                            todo.completed 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completado">Completada</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className={`w-3 h-3 rounded-full ${todo.assignedTo ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                          <div className="relative">
                            <select
                              value={todo.assignedTo || ''}
                              onChange={(e) => {
                                if (e.target.value === 'add_new') {
                                  setShowAddAssigneeFor(todo.id);
                                } else {
                                  handleAssigneeChange(todo.id, e.target.value);
                                }
                              }}
                              className="px-2 py-1 rounded-full border text-xs bg-white border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Sin encargado seleccionado</option>
                              {availableAssignees.map((assignee) => (
                                <option key={assignee} value={assignee}>
                                  {assignee}
                                </option>
                              ))}
                              <option value="add_new" className="text-blue-600 font-medium">
                                + Agregar encargado
                              </option>
                            </select>
                            
                            {/* Modal para agregar nuevo encargado */}
                            {showAddAssigneeFor === todo.id && (
                              <div className="assignee-modal absolute top-8 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Nuevo encargado:
                                  </label>
                                  <input
                                    type="text"
                                    value={newAssignee}
                                    onChange={(e) => setNewAssignee(e.target.value)}
                                    placeholder="Nombre del encargado"
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={addNewAssignee}
                                      disabled={!newAssignee.trim()}
                                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                      Agregar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowAddAssigneeFor(null);
                                        setNewAssignee('');
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Fechas más claras y separadas */}
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-xs text-blue-600 font-medium">Fecha de entrega:</span>
                            <input
                              type="date"
                              value={todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleDueDateChange(todo.id, e.target.value)}
                              className="text-blue-800 font-semibold bg-transparent border-none outline-none cursor-pointer hover:bg-blue-100 px-1 py-0.5 rounded"
                              title="Haz clic para cambiar la fecha de entrega"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <div>
                            <span className="text-xs text-gray-600 font-medium">Creada:</span>
                            <div className="text-gray-800 font-semibold">
                              {formatDate(todo.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Todo Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-text mb-4">Nueva Tarea</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Título de la tarea"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Descripción de la tarea (opcional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={newTodo.notes}
                  onChange={(e) => setNewTodo({...newTodo, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({...newTodo, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encargado de la tarea
                </label>
                <input
                  type="text"
                  value={newTodo.assignedTo}
                  onChange={(e) => setNewTodo({...newTodo, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre del encargado (opcional)"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleAddTodo} disabled={!newTodo.title.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Tarea
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
