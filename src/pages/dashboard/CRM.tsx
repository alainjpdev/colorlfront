import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, MapPin, Calendar, User, Building, RefreshCw, CheckCircle, AlertCircle, X, Save } from 'lucide-react';

// Importar el logo para el PDF
import logoImage from '../../assets/logo_im.png';



interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  totalProjects: number;
  totalRevenue: number;
  lastContact: string;
  notes: string;
  rowIndex?: number; // Para identificar la fila en Google Sheets
  lastModified?: string; // Para mostrar cuando fue editado por última vez
  isUpdating?: boolean; // Para mostrar indicador de carga
}

export const CRM: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'prospect' as 'prospect' | 'active' | 'inactive',
    notes: ''
  });

  // Configuración de Google Sheets
  const GOOGLE_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA';
  const GOOGLE_SHEET_NAME = 'CRM';
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  
  // Estados para OAuth2
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Función para guardar token en localStorage
  const saveTokenToStorage = (token: string) => {
    try {
      // Los tokens de Google OAuth2 expiran en 1 hora (3600 segundos)
      const expiryTime = Date.now() + (3600 * 1000);
      
      localStorage.setItem('google_access_token', token);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      console.log('💾 Token guardado en localStorage, expira en:', new Date(expiryTime).toLocaleString());
    } catch (err) {
      console.error('Error al guardar token en localStorage:', err);
    }
  };

  // Función para limpiar token del localStorage
  const clearTokenFromStorage = () => {
    try {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_token_expiry');
      console.log('🗑️ Token eliminado del localStorage');
    } catch (err) {
      console.error('Error al limpiar token del localStorage:', err);
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setAccessToken(null);
    setIsAuthenticated(false);
    clearTokenFromStorage();
    setSuccessMessage('✅ Sesión cerrada exitosamente');
    setError(null);
    
    // Limpiar datos de clientes
    setClients([]);
    setIsConnected(false);
    
    console.log('👋 Sesión cerrada, datos limpiados');
  };

  // Función para autenticación OAuth2 (Authorization Code Flow)
  const authenticateWithGoogle = () => {
    try {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/crm')}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('🔐 Redirigiendo a Google OAuth2...');
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
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin + '/dashboard/crm',
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        setAccessToken(data.access_token);
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
          localStorage.setItem('google_refresh_token', data.refresh_token);
        }
        localStorage.setItem('google_access_token', data.access_token);
        localStorage.setItem('google_token_expires', (Date.now() + (data.expires_in * 1000)).toString());
        setIsAuthenticated(true);
        console.log('✅ Tokens obtenidos exitosamente');
        return data.access_token;
      } else {
        throw new Error(data.error_description || 'Error al obtener tokens');
      }
    } catch (error) {
      console.error('❌ Error al intercambiar código por tokens:', error);
      setError('Error al obtener tokens de Google');
      return null;
    }
  };

  // Función para verificar si el token es válido
  const isTokenValid = () => {
    const expiresAt = localStorage.getItem('google_token_expires');
    if (expiresAt && parseInt(expiresAt) > Date.now()) {
      return true;
    }
    return false;
  };

  // Función para refrescar el access token
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('google_refresh_token');
      if (!storedRefreshToken) {
        console.log('❌ No hay refresh token disponible');
        throw new Error('No hay refresh token disponible');
      }

      console.log('🔄 Refrescando access token con refresh token...');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET || '',
          refresh_token: storedRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('google_access_token', data.access_token);
        if (data.expires_in) {
          localStorage.setItem('google_token_expires', (Date.now() + (data.expires_in * 1000)).toString());
        }
        console.log('✅ Access token refrescado exitosamente');
        console.log('⏰ Token expira en:', data.expires_in, 'segundos');
        return data.access_token;
      } else {
        console.error('❌ Error en respuesta de refresh:', data);
        throw new Error(data.error_description || 'Error al refrescar token');
      }
    } catch (error) {
      console.error('❌ Error al refrescar token:', error);
      setError('Error al refrescar token de Google');
      return null;
    }
  };

  // Función para obtener un token válido (refresca si es necesario)
  const getValidToken = async () => {
    console.log('🔍 Verificando token válido...');
    
    if (isTokenValid()) {
      const token = localStorage.getItem('google_access_token');
      if (token) {
        console.log('✅ Token válido encontrado');
        return token;
      }
    }
    
    console.log('🔄 Token expirado o no válido, refrescando...');
    return await refreshAccessToken();
  };

  // Función para obtener datos de Google Sheets
  const fetchClientsFromSheets = async () => {
    if (!GOOGLE_API_KEY) {
      setError('API Key de Google no configurada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Usar solo API Key
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del Google Sheet');
      }

      const data = await response.json();
      
      if (!data.values || data.values.length < 2) {
        setClients([]);
        setIsConnected(true);
        setIsLoading(false);
        return;
      }

      const sheetHeaders = data.values[0];
      const rows = data.values.slice(1);
      
      console.log('Headers encontrados:', sheetHeaders);
      console.log('Filas de datos:', rows);
      console.log('🔍 Columna Estado (índice 5):', rows.map((row: any[]) => row[5]));

      // Mapear los datos según los headers encontrados
      const mappedClients: Client[] = rows.map((row: any[], index: number) => {
        // Normalizar el estado para asegurar que coincida
        let normalizedStatus = 'prospect'; // valor por defecto
        
        if (row[5]) {
          const statusValue = row[5].toString().toLowerCase().trim();
          if (statusValue === 'active' || statusValue === 'activo') {
            normalizedStatus = 'active';
          } else if (statusValue === 'prospect' || statusValue === 'prospecto') {
            normalizedStatus = 'prospect';
          } else if (statusValue === 'inactive' || statusValue === 'inactivo') {
            normalizedStatus = 'inactive';
          }
        }
        
        const client: Client = {
          id: `client-${index + 1}`,
          name: row[0] || '',
          contactPerson: row[1] || '',
          email: row[2] || '',
          phone: row[3] || '',
          address: row[4] || '',
          status: normalizedStatus,
          totalProjects: parseInt(row[6]) || 0,
          totalRevenue: parseFloat(row[7]) || 0,
          lastContact: row[8] || new Date().toISOString().split('T')[0],
          notes: row[9] || '',
          rowIndex: index + 2 // +2 porque index 0 es headers y las filas empiezan en 1
        };
        
        console.log(`Cliente ${client.name}: estado original "${row[5]}" -> normalizado a "${normalizedStatus}"`);
        
        return client;
      });

      console.log('Clientes mapeados:', mappedClients);
      setClients(mappedClients);
      setIsConnected(true);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar nuevo cliente a Google Sheets
  const addClientToSheets = async () => {
    if (!GOOGLE_API_KEY && !accessToken) {
      setError('No se puede agregar cliente - API Key o OAuth no configurado');
      return;
    }

    try {
      const values = [
        [
          newClient.name,
          newClient.contactPerson,
          newClient.email,
          newClient.phone,
          newClient.address,
          newClient.status,
          '0', // totalProjects
          '0', // totalRevenue
          new Date().toISOString().split('T')[0], // lastContact
          newClient.notes || ''
        ]
      ];

      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        const token = await getValidToken();
        if (!token) {
          setError('No se pudo obtener token válido para escribir');
          return;
        }
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}:append?valueInputOption=USER_ENTERED`;
        headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        console.log('🔐 Agregando cliente con OAuth2');
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
        console.log('🔑 Agregando cliente con API Key');
      }
      
      console.log('🔗 Agregando nuevo cliente:', newClient.name);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Error al agregar cliente: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Cliente agregado exitosamente a Google Sheets');

      // Limpiar formulario y recargar datos
      setNewClient({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: 'prospect',
        notes: ''
      });
      setShowAddClient(false);
      
      // Recargar datos para obtener el nuevo cliente
      await fetchClientsFromSheets();
      setSuccessMessage('✅ Cliente agregado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al agregar cliente:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para actualizar cliente en Google Sheets
  const updateClientInSheets = async (client: Client) => {
    console.log('📝 updateClientInSheets llamado con:', {
      clientName: client.name,
      status: client.status,
      rowIndex: client.rowIndex,
      hasAccessToken: !!accessToken,
      hasApiKey: !!GOOGLE_API_KEY
    });

    if (!GOOGLE_API_KEY && !accessToken) {
      console.error('❌ No hay API Key ni OAuth configurado');
      setError('No se puede actualizar el cliente - API Key o OAuth no configurado');
      return;
    }

    if (client.rowIndex === undefined) {
      console.error('❌ Cliente sin rowIndex:', client);
      setError('No se puede actualizar el cliente - índice no válido');
      return;
    }

    try {
      const values = [
        [
          client.name,
          client.contactPerson,
          client.email,
          client.phone,
          client.address,
          client.status,
          client.totalProjects.toString(),
          client.totalRevenue.toString(),
          client.lastContact,
          client.notes || ''
        ]
      ];

      const range = `${GOOGLE_SHEET_NAME}!A${client.rowIndex}:J${client.rowIndex}`;
      
      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        const token = await getValidToken();
        if (!token) {
          setError('No se pudo obtener token válido para escribir');
          return;
        }
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
        headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        console.log('🔐 Actualizando cliente con OAuth2:', client.name);
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
        console.log('🔑 Actualizando cliente con API Key:', client.name);
      }
      
      console.log('🔗 Actualizando cliente en fila:', client.rowIndex);
      console.log('📡 URL:', url);
      console.log('📋 Headers:', headers);
      console.log('📊 Values:', values);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          values: values
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(`Error al actualizar cliente: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Cliente actualizado exitosamente en Google Sheets');
      
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      throw err; // Re-lanzar el error para manejarlo en handleSaveEdit
    }
  };

  // Función para eliminar cliente de Google Sheets
  const deleteClientFromSheets = async (client: Client) => {
    if (!GOOGLE_API_KEY && !accessToken) {
      setError('No se puede eliminar el cliente - API Key o OAuth no configurado');
      return;
    }

    if (client.rowIndex === undefined) {
      setError('No se puede eliminar el cliente - índice no válido');
      return;
    }

    // Confirmar antes de eliminar
    if (!confirm(`¿Estás seguro de que quieres eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const range = `${GOOGLE_SHEET_NAME}!A${client.rowIndex}:J${client.rowIndex}`;
      
      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        const token = await getValidToken();
        if (!token) {
          setError('No se pudo obtener token válido para escribir');
          return;
        }
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}`;
        headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        console.log('🔐 Eliminando cliente con OAuth2:', client.name);
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;
        console.log('🔑 Eliminando cliente con API Key:', client.name);
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          values: [['', '', '', '', '', '', '', '', '', '']] // Limpiar la fila
        })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar cliente de Google Sheets');
      }

      await fetchClientsFromSheets();
      setSuccessMessage('✅ Cliente eliminado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para abrir modal de ver cliente
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewClient(true);
    // Limpiar mensajes al abrir modal
    setError(null);
    setSuccessMessage(null);
  };

  // Función para abrir modal de editar cliente
  const handleEditClient = (client: Client) => {
    setEditingClient({ ...client });
    setShowEditClient(true);
    // Limpiar mensajes al abrir modal
    setError(null);
    setSuccessMessage(null);
  };

  // Función para guardar cambios del cliente editado
  const handleSaveEdit = async () => {
    if (!editingClient) return;

    try {
      await updateClientInSheets(editingClient);
      
      // Actualizar el cliente en el estado local inmediatamente
      const updatedClient = {
        ...editingClient,
        lastModified: new Date().toISOString()
      };
      
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === editingClient.id ? updatedClient : client
        )
      );
      
      setShowEditClient(false);
      setEditingClient(null);
      setSuccessMessage('✅ Cliente actualizado exitosamente');
      setError(null);
      
      // También recargar desde Google Sheets para asegurar sincronización
      setTimeout(() => {
        fetchClientsFromSheets();
      }, 1000);
      
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      setError('Error al actualizar el cliente');
    }
  };

  // Función para cerrar modal de edición
  const handleCloseEdit = () => {
    setShowEditClient(false);
    setEditingClient(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Función para cerrar modal de vista
  const handleCloseView = () => {
    setShowViewClient(false);
    setSelectedClient(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Función para actualizar estado inline
  const handleStatusChange = async (client: Client, newStatus: string) => {
    if (newStatus === client.status) return; // No hacer nada si no cambió
    
    console.log('🔄 Cambiando estado del cliente:', {
      clientName: client.name,
      oldStatus: client.status,
      newStatus: newStatus,
      hasAccessToken: !!accessToken,
      hasApiKey: !!GOOGLE_API_KEY,
      rowIndex: client.rowIndex
    });
    
    try {
      // Mostrar indicador de carga
      const loadingClient = { ...client, status: newStatus, isUpdating: true };
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? loadingClient : c
        )
      );
      
      const updatedClient = { ...client, status: newStatus };
      await updateClientInSheets(updatedClient);
      
      // Actualizar el cliente en el estado local inmediatamente
      const clientWithTimestamp = {
        ...updatedClient,
        lastModified: new Date().toISOString()
      };
      
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? clientWithTimestamp : c
        )
      );
      
      setSuccessMessage('✅ Estado actualizado exitosamente');
      setError(null);
      
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado');
      
      // Revertir el cambio en caso de error
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? client : c
        )
      );
    }
  };



  // Función para convertir imagen a base64
  const convertImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = imageUrl;
    });
  };

  // Función para exportar clientes a PDF
  const exportToPDF = async () => {
    try {
      // Convertir logo a base64
      let logoBase64 = '';
      try {
        logoBase64 = await convertImageToBase64(logoImage);
        console.log('✅ Logo convertido a base64 exitosamente');
      } catch (err) {
        console.warn('⚠️ No se pudo convertir el logo, usando logo por defecto:', err);
        // Logo por defecto si falla la conversión
        logoBase64 = 'data:image/svg+xml;base64,' + btoa(`
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="url(#gradient)"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
              </linearGradient>
            </defs>
            <text x="40" y="48" text-anchor="middle" fill="white" font-size="24" font-weight="bold">CL</text>
          </svg>
        `);
      }

      // Crear contenido HTML para el PDF
      const createPDFContent = () => {
        const activeClients = clients.filter(c => c.status === 'active').length;
        const prospectClients = clients.filter(c => c.status === 'prospect').length;
        const inactiveClients = clients.filter(c => c.status === 'inactive').length;
        const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>CRM - Reporte de Clientes</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 30px; 
                line-height: 1.6; 
                color: #2c3e50;
                background-color: #ffffff;
              }
              .header { 
                margin-bottom: 40px; 
                padding-bottom: 20px;
                border-bottom: 3px solid #3498db;
              }
              .header-content { 
                display: flex; 
                align-items: center; 
                gap: 25px; 
              }
              .logo { 
                width: 90px; 
                height: auto; 
                flex-shrink: 0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .company-info { 
                flex-grow: 1; 
              }
              .report-title { 
                font-size: 28px; 
                font-weight: 700; 
                color: #2c3e50; 
                margin-bottom: 10px;
                letter-spacing: -0.5px;
              }
              .generated-date { 
                color: #7f8c8d; 
                font-size: 15px;
                font-style: italic;
              }
              .stats { 
                margin-bottom: 40px; 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 25px;
                border-radius: 12px;
                border-left: 5px solid #3498db;
              }
              .stats h3 { 
                color: #2c3e50; 
                border-bottom: 2px solid #3498db; 
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 20px;
              }
              .stat-item { 
                margin: 15px 0; 
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .stat-label { 
                font-weight: 600; 
                color: #5a6c7d; 
                font-size: 15px;
              }
              .stat-value { 
                color: #2c3e50; 
                font-weight: 700;
                font-size: 16px;
                background: white;
                padding: 8px 16px;
                border-radius: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h3 { 
                color: #2c3e50; 
                font-size: 22px;
                margin: 30px 0 20px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #ecf0f1;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 25px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              th, td { 
                border: 1px solid #e1e8ed; 
                padding: 12px; 
                text-align: left; 
              }
              th { 
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
                color: white; 
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              tr:nth-child(even) { 
                background-color: #f8f9fa; 
              }
              tr:hover { 
                background-color: #e3f2fd; 
                transition: background-color 0.2s ease;
              }
              .status-active { 
                color: #27ae60; 
                font-weight: 600;
                background: #d1fae5;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .status-prospect { 
                color: #d97706; 
                font-weight: 600;
                background: #fef3c7;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .status-inactive { 
                color: #dc2626; 
                font-weight: 600;
                background: #fee2e2;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                color: #7f8c8d; 
                font-size: 13px;
                background: #f8f9fa;
                padding: 25px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <img src="${logoBase64}" alt="Logo" class="logo">
                <div class="company-info">
                  <div class="report-title">CRM - Reporte de Clientes</div>
                  <div class="generated-date">Generado el: ${new Date().toLocaleDateString('es-CO')}</div>
                </div>
              </div>
            </div>
            
            <div class="stats">
              <h3>Resumen General</h3>
              <div class="stat-item">
                <span class="stat-label">Total de clientes:</span>
                <span class="stat-value">${clients.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Clientes activos:</span>
                <span class="stat-value">${activeClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Prospectos:</span>
                <span class="stat-value">${prospectClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Clientes inactivos:</span>
                <span class="stat-value">${inactiveClients}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Ingresos totales:</span>
                <span class="stat-value">${formatCurrency(totalRevenue)}</span>
              </div>
            </div>
            
            <h3>Lista de Clientes</h3>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Proyectos</th>
                  <th>Ingresos</th>
                  <th>Último Contacto</th>
                </tr>
              </thead>
              <tbody>
                ${clients.map(client => `
                  <tr>
                    <td>${client.name}</td>
                    <td>${client.contactPerson}</td>
                    <td>${client.email}</td>
                    <td>${client.phone}</td>
                    <td class="status-${client.status}">${getStatusText(client.status)}</td>
                    <td>${client.totalProjects}</td>
                    <td>${formatCurrency(client.totalRevenue)}</td>
                    <td>${client.lastContact}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
                <p style="margin-bottom: 10px;">Reporte generado automáticamente por el sistema CRM</p>
                <p style="margin-bottom: 5px;">Total de registros: ${clients.length}</p>
                <p style="font-size: 11px; color: #95a5a6;">© ${new Date().getFullYear()} - Todos los derechos reservados</p>
              </div>
            </div>
          </body>
          </html>
        `;
      };
      
      // Crear el contenido HTML
      const htmlContent = createPDFContent();
      
      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Crear URL del blob
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva ventana para imprimir/guardar como PDF
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setSuccessMessage('✅ Reporte con logo generado - Imprime o guarda como PDF');
      setError(null);
      
    } catch (err) {
      console.error('Error al exportar reporte:', err);
      setError('Error al generar el reporte');
    }
  };

  // Efecto para limpiar mensajes de éxito automáticamente
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Limpiar después de 5 segundos

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Efecto para cargar datos automáticamente
  useEffect(() => {
    console.log('🔄 Cargando CRM automáticamente...');
    console.log('🔧 Variables de entorno:', {
      GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado',
      GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ No configurado',
      GOOGLE_API_KEY: GOOGLE_API_KEY ? '✅ Configurado' : '❌ No configurado'
    });
    
    // Verificar si hay un código de autorización en la URL (callback de OAuth2)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('🔐 Código de autorización encontrado, intercambiando por tokens...');
      exchangeCodeForTokens(code).then(() => {
        // Limpiar la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Cargar datos después de obtener tokens
        fetchClientsFromSheets();
      });
      return;
    }
    
    // Verificar si hay tokens guardados
    const storedAccessToken = localStorage.getItem('google_access_token');
    const storedRefreshToken = localStorage.getItem('google_refresh_token');
    
    console.log('🔍 Estado de tokens:', {
      hasAccessToken: !!storedAccessToken,
      hasRefreshToken: !!storedRefreshToken,
      isTokenValid: isTokenValid()
    });
    
    if (storedAccessToken && isTokenValid()) {
      setAccessToken(storedAccessToken);
      setIsAuthenticated(true);
      console.log('🔐 Token válido encontrado, cargando datos...');
      fetchClientsFromSheets();
    } else if (storedRefreshToken) {
      console.log('🔄 Token expirado, refrescando con refresh token...');
      refreshAccessToken().then((token) => {
        if (token) {
          setIsAuthenticated(true);
          console.log('✅ Token refrescado exitosamente, cargando datos...');
          fetchClientsFromSheets();
        } else {
          console.log('⚠️ No se pudo refrescar token, usando API Key...');
          if (GOOGLE_API_KEY) {
            fetchClientsFromSheets();
          } else {
            loadSampleData();
          }
        }
      });
    } else if (GOOGLE_API_KEY) {
      console.log('🔑 API Key encontrada, cargando desde Google Sheets...');
      fetchClientsFromSheets();
    } else {
      console.log('⚠️ No hay autenticación configurada, cargando datos de ejemplo...');
      loadSampleData();
    }
  }, []);



  // Función para configurar automáticamente el Google Sheet
  const setupGoogleSheet = async () => {
    if (!GOOGLE_API_KEY) {
      setError('API Key de Google no configurada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🧹 Limpiando y configurando el sheet...');

      // Crear el contenido completo del sheet (headers + 3 clientes)
      const completeContent = [
        ['Empresa', 'Contacto', 'Email', 'Telefono', 'Direccion', 'Estado', 'Proyectos', 'Ingresos', 'Ultimo Contacto', 'Notas'], // Headers
        ['Constructora ABC', 'Juan Perez', 'juan@abc.com', '300 123 4567', 'Calle 123, Bogota', 'active', '5', '1250000', '2024-01-15', 'Cliente importante, siempre paga a tiempo'],
        ['Desarrolladora XYZ', 'Maria Garcia', 'maria@xyz.com', '310 987 6543', 'Carrera 78, Medellin', 'prospect', '2', '450000', '2024-01-10', 'Interesada en productos premium'],
        ['Arquitectura Moderna', 'Carlos Lopez', 'carlos@moderna.com', '315 555 1234', 'Avenida 5, Cali', 'inactive', '8', '2800000', '2023-12-20', 'Cliente historico, necesita seguimiento']
      ];

      // Usar solo API Key
      const replaceUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}!A1:J4?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      console.log('🔑 Usando API Key para reemplazar contenido');

      console.log('🔗 Reemplazando todo el contenido del sheet...');
      
      const response = await fetch(replaceUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          values: completeContent
        })
      });

      if (response.ok) {
        console.log('✅ Sheet completamente reemplazado con éxito');
        setSuccessMessage('✅ Sheet configurado correctamente con 3 clientes únicos');
      setError(null);
      } else {
        console.log('❌ Error al reemplazar contenido del sheet');
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setError('❌ Error al configurar el sheet');
      }

      // Recargar datos
      await fetchClientsFromSheets();
      
    } catch (err) {
      console.error('Error al configurar Google Sheet:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para probar la conexión con Google Sheets
  const testGoogleSheetsConnection = async () => {
    if (!GOOGLE_API_KEY && !GOOGLE_CLIENT_ID) {
      setError('❌ API Key o Client ID de Google no configurado');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔑 API Key configurada:', GOOGLE_API_KEY ? '✅ Sí' : '❌ No');
      console.log('🔐 Client ID configurado:', GOOGLE_CLIENT_ID ? '✅ Sí' : '❌ No');
      console.log('📊 Sheet ID configurado:', GOOGLE_SHEET_ID);
      console.log('📋 Nombre de la hoja:', GOOGLE_SHEET_NAME);
      
      // Test 1: Verificar que podemos acceder al sheet
      const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}?key=${GOOGLE_API_KEY}`;
      console.log('🔗 URL de prueba:', testUrl);
      
      const response = await fetch(testUrl);
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en la respuesta:', errorData);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const sheetInfo = await response.json();
      console.log('📊 Información del Sheet:', sheetInfo);
      
      // Test 2: Verificar que la hoja CRM existe
      const sheets = sheetInfo.sheets || [];
      const crmSheet = sheets.find((sheet: any) => sheet.properties.title === GOOGLE_SHEET_NAME);
      
      if (!crmSheet) {
        console.log('⚠️ Hoja CRM no encontrada, hojas disponibles:', sheets.map((s: any) => s.properties.title));
        setError(`❌ Hoja '${GOOGLE_SHEET_NAME}' no encontrada. Hojas disponibles: ${sheets.map((s: any) => s.properties.title).join(', ')}`);
        return;
      }
      
      console.log('✅ Hoja CRM encontrada:', crmSheet.properties.title);
      
      // Test 3: Intentar leer datos de la hoja
      const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      console.log('📖 Intentando leer datos de la hoja...');
      
      const readResponse = await fetch(readUrl);
      console.log('📡 Respuesta de lectura:', readResponse.status, readResponse.statusText);
      
      if (!readResponse.ok) {
        const readError = await readResponse.json();
        console.error('❌ Error al leer datos:', readError);
        throw new Error(`Error al leer datos: ${readResponse.status} ${readResponse.statusText}`);
      }
      
      const readData = await readResponse.json();
      console.log('📋 Datos leídos:', readData);
      
      if (readData.values && readData.values.length > 0) {
        console.log('✅ Datos encontrados en la hoja');
        console.log('📊 Número de filas:', readData.values.length);
        console.log('🏷️ Headers:', readData.values[0]);
      } else {
        console.log('ℹ️ Hoja vacía, lista para configurar');
      }
      
      setError('✅ Conexión exitosa con Google Sheets!');
      setIsConnected(true);
      
    } catch (err) {
      console.error('❌ Error en la prueba de conexión:', err);
      setError(`❌ Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'prospect':
        return 'Prospecto';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para cargar datos de ejemplo
  const loadSampleData = () => {
    setClients([
        {
          id: '1',
          name: 'Cliente Ejemplo 1',
          contactPerson: 'Juan Pérez',
          email: 'juan@ejemplo.com',
          phone: '+1234567890',
          address: 'Calle Principal 123',
          status: 'active',
          totalProjects: 3,
          totalRevenue: 15000,
          lastContact: new Date().toISOString().split('T')[0],
          notes: 'Cliente importante con buen historial'
        },
        {
          id: '2',
          name: 'Cliente Ejemplo 2',
          contactPerson: 'María García',
          email: 'maria@ejemplo.com',
          phone: '+0987654321',
          address: 'Avenida Central 456',
          status: 'prospect',
          totalProjects: 0,
          totalRevenue: 0,
          lastContact: new Date().toISOString().split('T')[0],
          notes: 'Prospecto interesado en nuestros servicios'
        }
      ]);
      setIsLoading(false);
    };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Cargando clientes desde Google Sheets...</p>
        </div>
      </div>
    );
  }

  // Si no hay OAuth2 autorizado, mostrar pantalla de autorización
  if (!accessToken && !isAuthenticated) {
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
              Para poder gestionar clientes y modificar datos en Google Sheets, 
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
          <h1 className="text-3xl font-bold text-text">CRM - Gestión de Clientes</h1>
          <p className="text-text-secondary mt-1">
            Gestiona tus clientes, prospectos y oportunidades de venta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="bg-green-50 text-green-700 hover:bg-green-100"
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA/edit', '_blank')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Abrir Google Sheet
          </Button>
          <Button onClick={() => fetchClientsFromSheets()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowAddClient(true)} className="bg-primary text-white hover:bg-primary-dark">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">{clients.length}</h3>
          <p className="text-gray-600">Total Clientes</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {clients.filter(c => c.status === 'active').length}
          </h3>
          <p className="text-gray-600">Clientes Activos</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {clients.filter(c => c.status === 'prospect').length}
          </h3>
          <p className="text-gray-600">Prospectos</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {formatCurrency(clients.reduce((sum, c) => sum + c.totalRevenue, 0))}
          </h3>
          <p className="text-gray-600">Ingresos Totales</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="prospect">Prospectos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-text">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-text">Contacto</th>
                <th className="text-left py-3 px-4 font-medium text-text">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-text">Proyectos</th>
                <th className="text-left py-3 px-4 font-medium text-text">Ingresos</th>
                <th className="text-left py-3 px-4 font-medium text-text">Último Contacto</th>
                <th className="text-left py-3 px-4 font-medium text-text">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-700">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.address}</p>
                      {client.lastModified && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✏️ Editado recientemente
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">{client.contactPerson}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client, e.target.value)}
                        disabled={client.isUpdating}
                        className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 ${getStatusColor(client.status)} ${client.isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          appearance: 'none',
                          paddingRight: '20px'
                        }}
                      >
                        <option value="prospect" className="bg-amber-100 text-amber-700">Prospecto</option>
                        <option value="active" className="bg-emerald-100 text-emerald-700">Activo</option>
                        <option value="inactive" className="bg-red-100 text-red-700">Inactivo</option>
                      </select>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {client.isUpdating ? (
                          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-3 h-3 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-700">{client.totalProjects} proyectos</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-700">{formatCurrency(client.totalRevenue)}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{client.lastContact}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteClientFromSheets(client)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-text mb-4">Agregar Nuevo Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={newClient.contactPerson}
                  onChange={(e) => setNewClient({...newClient, contactPerson: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="300 123 4567"
                  pattern="[0-9\s\-\(\)]+"
                  title="Ingresa solo números, espacios, -, ( y )"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select 
                  value={newClient.status}
                  onChange={(e) => setNewClient({...newClient, status: e.target.value as 'prospect' | 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="prospect">Prospecto</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Información adicional del cliente..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={addClientToSheets}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
              <Button variant="outline" onClick={() => setShowAddClient(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {showViewClient && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Detalles del Cliente</h3>
              <Button variant="outline" onClick={handleCloseView}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Empresa</label>
                <p className="text-gray-900 font-medium">{selectedClient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contacto</label>
                <p className="text-gray-900">{selectedClient.contactPerson}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{selectedClient.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                <p className="text-gray-900">{selectedClient.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Dirección</label>
                <p className="text-gray-900">{selectedClient.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status)}`}>
                  {getStatusText(selectedClient.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Proyectos</label>
                <p className="text-gray-900">{selectedClient.totalProjects} proyectos</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ingresos</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedClient.totalRevenue)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Último Contacto</label>
                <p className="text-gray-900">{selectedClient.lastContact}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Notas</label>
                <p className="text-gray-900">{selectedClient.notes || 'Sin notas'}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => {
                setShowViewClient(false);
                handleEditClient(selectedClient);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Cliente
              </Button>
              <Button variant="outline" onClick={handleCloseView}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClient && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Editar Cliente</h3>
              <Button variant="outline" onClick={handleCloseEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={editingClient.contactPerson}
                  onChange={(e) => setEditingClient({...editingClient, contactPerson: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="300 123 4567"
                  pattern="[0-9\s\-\(\)]+"
                  title="Ingresa solo números, espacios, -, ( y )"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select 
                  value={editingClient.status}
                  onChange={(e) => setEditingClient({...editingClient, status: e.target.value as 'prospect' | 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="prospect">Prospecto</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proyectos
                </label>
                <input
                  type="number"
                  value={editingClient.totalProjects}
                  onChange={(e) => setEditingClient({...editingClient, totalProjects: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingresos
                </label>
                <input
                  type="number"
                  value={editingClient.totalRevenue}
                  onChange={(e) => setEditingClient({...editingClient, totalRevenue: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Último Contacto
                </label>
                <input
                  type="date"
                  value={editingClient.lastContact}
                  onChange={(e) => setEditingClient({...editingClient, lastContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Información adicional del cliente..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={handleCloseEdit}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
