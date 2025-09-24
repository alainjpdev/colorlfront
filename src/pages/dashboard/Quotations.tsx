import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, RefreshCw, Calculator, Save, Mail, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { quotationAPI } from '../../services/api';
import { Quotation, CreateQuotationData } from '../../types';
import { useGoogleAuth } from '../../services/googleAuthService';
import jsPDF from 'jspdf';

// Importar el logo para el PDF
import logoImage from '../../assets/logo.webp';

export const Quotations: React.FC = () => {
  const [products, setProducts] = useState<any[]>([
    {
      id: '1',
      sku: 'PT-002-BC',
      codigointerno: 'PT-002-BC',
      codigo: 'PT-002-BC',
      code: 'PT-002-BC',
      nombre: 'COLORLAND PLUS MATE 19LT',
      nombredelproducto: 'COLORLAND PLUS MATE 19LT',
      titulo: 'COLORLAND PLUS MATE 19LT',
      title: 'COLORLAND PLUS MATE 19LT',
      producto: 'COLORLAND PLUS MATE 19LT',
      product: 'COLORLAND PLUS MATE 19LT',
      precio: '$4,599.98',
      preciopublicoads: '$4,599.98',
      price: '$4,599.98',
      nuevosprecioscolorland: '$4,599.98',
      preciopublico: '$4,599.98',
      categoria: 'Pinturas',
      category: 'Pinturas',
      categoría: 'Pinturas',
      descripcion: 'Pintura Colorland Plus Mate 19 litros',
      description: 'Pintura Colorland Plus Mate 19 litros',
      desc: 'Pintura Colorland Plus Mate 19 litros',
      detalle: 'Pintura Colorland Plus Mate 19 litros'
    }
  ]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<any>({
    clientName: '',
    projectName: '',
    quotationName: '', // Nombre específico para la cotización
    items: [],
    total: 0,
    subtotal: 0,
    discount: 0,
    discountType: 'percentage', // 'percentage' or 'amount'
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showQuotationForm, setShowQuotationForm] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tempQuotationName, setTempQuotationName] = useState('');
  const [showQuotationsModal, setShowQuotationsModal] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  
  // Estados para clientes del CRM
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  
  // Usar el servicio centralizado de autenticación con Google
  const { 
    isAuthenticated, 
    accessToken, 
    authenticate, 
    getValidToken, 
    isLoading: authLoading, 
    error: authError 
  } = useGoogleAuth();
  
  // Estados para búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Estados para búsqueda de clientes del CRM
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  
  // Estado para nuevo cliente
  const [newClient, setNewClient] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'prospect',
    notes: ''
  });

  // Configuración del Google Sheet
  const GOOGLE_SHEET_ID = '1OkUGLzVwwafRQmdIwqE0KRWLdXS8EyWrdKkAaBWijCI'; // Tu Google Sheet real
  const GOOGLE_SHEET_NAME = 'Sheet1'; // Nombre de la hoja por defecto
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; // API Key desde .env
  
  // Configuración OAuth2
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Configuración del CRM (Google Sheets)
  const CRM_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA';
  const CRM_SHEET_NAME = 'CRM';

    // Función para agregar nuevo cliente al CRM
  const addClientToCrm = async () => {
    try {
      console.log('🔄 Agregando nuevo cliente al CRM...');
      console.log('📋 Datos del cliente:', newClient);
      console.log('🔑 CRM_SHEET_ID:', CRM_SHEET_ID);
      console.log('📋 CRM_SHEET_NAME:', CRM_SHEET_NAME);
      console.log('🔑 GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'Configurada' : 'No configurada');
      console.log('🔑 OAuth2 autenticado:', isAuthenticated);
      
      const clientData = [
        newClient.name,
        newClient.contactPerson,
        newClient.email,
        newClient.phone,
        newClient.address,
        newClient.status,
        '0', // totalProjects
        '0', // totalRevenue
        new Date().toISOString().split('T')[0], // lastContact
        newClient.notes
      ];
      
      console.log('📊 Datos a enviar:', clientData);
      
      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (isAuthenticated && accessToken) {
        try {
          const validToken = await getValidAccessToken();
          url = `https://sheets.googleapis.com/v4/spreadsheets/${CRM_SHEET_ID}/values/${CRM_SHEET_NAME}:append?valueInputOption=USER_ENTERED`;
          headers['Authorization'] = `Bearer ${validToken}`;
          console.log('🔑 Usando OAuth2 para agregar cliente');
        } catch (err) {
          console.error('Error al obtener token válido:', err);
          throw new Error('No se pudo obtener un token válido para agregar el cliente');
        }
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${CRM_SHEET_ID}/values/${CRM_SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
        console.log('🔑 Usando API Key para agregar cliente');
      }
      
      console.log('🔗 URL de append:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          values: [clientData]
        })
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', response.status, response.statusText);
        console.error('❌ Detalles del error:', errorText);
        
        if (response.status === 401) {
          throw new Error('No autorizado para escribir en este Google Sheet. Verifica que estés autenticado con Google o que el sheet esté compartido correctamente.');
        } else if (response.status === 403) {
          throw new Error('Permisos insuficientes para escribir en este Google Sheet.');
        } else {
          throw new Error(`Error al agregar cliente al CRM: ${response.status} ${response.statusText}`);
        }
      }

      const responseData = await response.json();
      console.log('✅ Cliente agregado exitosamente:', responseData);

      // Limpiar formulario y cerrar modal
      setNewClient({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: 'prospect',
        notes: ''
      });
      setShowAddClientModal(false);
      
      // Recargar clientes del CRM
      await fetchCrmClients();
      
      // Mostrar popup de éxito
      setShowSuccessPopup(true);
      
      // Cerrar el popup después de 3 segundos
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Error al agregar cliente:', err);
      
      // Si es error 401 (token expirado), redirigir a reconexión
      if (err.message && err.message.includes('401')) {
        console.log('🔄 Token expirado, redirigiendo a reconexión...');
        alert('⚠️ Tu sesión de Google ha expirado. Serás redirigido para reconectarte.');
        
        // Limpiar tokens y forzar reconexión
        localStorage.removeItem('google-auth-storage');
        
        // Redirigir a reconexión después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return;
      }
      
      // Para otros errores, mostrar mensaje normal
      alert('❌ Error al agregar cliente: ' + (err.message || 'Error desconocido'));
    }
  };

  // Función para reconectar con Google (refrescar permisos)
  const reconnectWithGoogle = async () => {
    try {
      console.log('🔄 Reconectando con Google para refrescar permisos...');
      
      // Limpiar tokens existentes del localStorage
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
      localStorage.removeItem('google_auth_state');
      localStorage.removeItem('google-auth-storage'); // Zustand storage
      
      // Redirigir a Google OAuth con prompt=consent para forzar nueva autorización
      const redirectUri = `${window.location.origin}/dashboard`;
      const scope = 'https://www.googleapis.com/auth/spreadsheets';
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('state', 'quotations_reconnect');
      authUrl.searchParams.set('prompt', 'consent'); // Forzar nueva autorización
      
      console.log('🔗 Redirigiendo a Google OAuth para reconectar...');
      window.location.href = authUrl.toString();
      
    } catch (err) {
      console.error('Error al reconectar con Google:', err);
      alert('Error al reconectar con Google');
    }
  };

  // Funciones de autenticación OAuth2 (copiadas de Todo.tsx)
  const authenticateWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID no configurado');
      return;
    }

    try {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/quotations')}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${encodeURIComponent('quotations_auth')}&` +
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
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin + '/dashboard/quotations'
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




  // Función para obtener token válido usando el servicio centralizado
  const getValidAccessToken = async () => {
    return await getValidToken();
  };

  // Función para obtener clientes del CRM
  const fetchCrmClients = async () => {
    try {
      setCrmLoading(true);
      console.log('🔄 Iniciando carga de clientes del CRM...');
      console.log('📊 CRM_SHEET_ID:', CRM_SHEET_ID);
      console.log('📋 CRM_SHEET_NAME:', CRM_SHEET_NAME);
      console.log('🔑 GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'Configurada' : 'No configurada');
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CRM_SHEET_ID}/values/${CRM_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      console.log('🔗 URL de consulta:', url);
      
      const response = await fetch(url);
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error en la respuesta:', errorData);
        throw new Error(`Error al obtener clientes del CRM: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Datos recibidos:', data);
      
      if (data.values && data.values.length > 1) {
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        console.log('🏷️ Headers encontrados:', headers);
        console.log('📊 Número de filas:', rows.length);
        console.log('📝 Primeras 3 filas:', rows.slice(0, 3));
        
        // Mapear clientes del CRM
        const mappedClients = rows
          .filter((row: any[]) => row.some(cell => cell && cell.toString().trim() !== ''))
          .map((row: any[], index: number) => {
            const client: any = {};
            
            headers.forEach((header: string, colIndex: number) => {
              if (header && header.toString().trim() !== '') {
                const cleanHeader = header.toString().toLowerCase().replace(/\s+/g, '');
                client[cleanHeader] = row[colIndex] || '';
              }
            });
            
            client.id = (index + 1).toString();
            return client;
          });
        
        console.log('✅ Clientes del CRM mapeados:', mappedClients.length);
        console.log('👥 Primeros 3 clientes completos:', mappedClients.slice(0, 3));
        console.log('🔍 Claves del primer cliente:', mappedClients[0] ? Object.keys(mappedClients[0]) : 'No hay clientes');
        setCrmClients(mappedClients);
      } else {
        console.log('⚠️ No hay datos en el CRM o solo hay headers');
        setCrmClients([]);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar clientes del CRM:', err);
      
      // Si es error 401 (token expirado), redirigir a reconexión
      if (err.message && err.message.includes('401')) {
        console.log('🔄 Token expirado al cargar CRM, redirigiendo a reconexión...');
        alert('⚠️ Tu sesión de Google ha expirado. Serás redirigido para reconectarte.');
        
        // Limpiar tokens y forzar reconexión
        localStorage.removeItem('google-auth-storage');
        
        // Redirigir a reconexión después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return;
      }
      
      setCrmClients([]);
    } finally {
      setCrmLoading(false);
    }
  };

  // Función para obtener datos del Google Sheet
  const fetchGoogleSheetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = {};
      
      // Por ahora, usar solo API Key para evitar problemas de permisos
      // TODO: Implementar verificación de permisos OAuth más robusta
      console.log('🔑 Usando API Key para acceder al sheet de cotizaciones');
      url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      
      console.log('🔗 URL de consulta:', url);
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', response.status, response.statusText);
        console.error('❌ Detalles del error:', errorText);
        
        if (response.status === 401) {
          throw new Error('No autorizado para acceder a este Google Sheet. Verifica que el sheet esté compartido con tu cuenta de Google.');
        } else if (response.status === 403) {
          throw new Error('Permisos insuficientes para acceder a este Google Sheet.');
        } else {
          throw new Error(`Error al obtener datos del Google Sheet: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (data.values && data.values.length > 0) {
        // La primera fila contiene los encabezados
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        console.log('Headers encontrados:', headers);
        console.log('Primeras filas:', rows.slice(0, 3));
        
        // Mapear las filas a objetos usando los encabezados
        const mappedProducts = rows
          .filter((row: any[]) => row.some(cell => cell && cell.toString().trim() !== '')) // Filtrar filas vacías
          .map((row: any[], index: number) => {
            const product: any = {};
            
            headers.forEach((header: string, colIndex: number) => {
              if (header && header.toString().trim() !== '') {
                const cleanHeader = header.toString().toLowerCase().replace(/\s+/g, '');
                product[cleanHeader] = row[colIndex] || '';
              }
            });
            
            product.id = (index + 1).toString();
            return product;
          });
        
        console.log('Productos mapeados:', mappedProducts.slice(0, 3));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching Google Sheet data:', err);
      setError(err.message || 'Error al cargar los productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener valor de columna
  const getColumnValue = (item: any, columnName: string) => {
    // Mapeo de las nuevas columnas del Google Sheet
    const columnMappings: { [key: string]: string[] } = {
      'sku': ['sku', 'codigointerno', 'codigo', 'code'],
      'categoria': ['categoria', 'category', 'categoría'],
      'nombre': ['nombredelproducto', 'nombre', 'titulo', 'title', 'producto', 'product'],
      'precio': ['preciopublicoads', 'precio', 'price', 'nuevosprecioscolorland', 'preciopublico'],
      'descripcion': ['descripcion', 'description', 'desc', 'detalle'],
      // Mapeos adicionales para compatibilidad
      'clientName': ['nombrecliente', 'cliente', 'client'],
      'projectName': ['nombreproyecto', 'proyecto', 'project'],
      'totalAmount': ['valor', 'precio', 'total'],
      'status': ['situacion', 'estado', 'status'],
      'createdAt': ['fecha', 'date', 'created'],
      'validUntil': ['expiracion', 'expiration', 'valido']
    };
    
    // Obtener las variaciones para la columna solicitada
    const variations = columnMappings[columnName] || [
      columnName,
      columnName.toLowerCase(),
      columnName.replace(/\s+/g, ''),
      columnName.toLowerCase().replace(/\s+/g, ''),
    ];
    
    // Buscar el valor en las variaciones
    for (const variation of variations) {
      if (variation && item[variation] !== undefined && item[variation] !== '') {
        return item[variation];
      }
    }
    
    // Si no se encuentra, mostrar las claves disponibles para debug
    console.log(`Columna no encontrada: ${columnName}. Claves disponibles:`, Object.keys(item));
    return 'N/A';
  };

  // Función para buscar productos
  const searchProducts = (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowProductDropdown(false);
      return;
    }

    const results = products.filter(product => {
      const title = getColumnValue(product, 'nombre')?.toLowerCase() || '';
      const sku = getColumnValue(product, 'sku')?.toLowerCase() || '';
      const categoria = getColumnValue(product, 'categoria')?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return title.includes(searchLower) || sku.includes(searchLower) || categoria.includes(searchLower);
    });

    setSearchResults(results);
    setShowProductDropdown(true);
  };

  // Función para buscar clientes del CRM
  const searchClients = (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setClientSearchResults([]);
      setShowClientDropdown(false);
      return;
    }

    const results = crmClients.filter(client => {
      const contacto = client.contacto?.toLowerCase() || '';
      const empresa = client.empresa?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return contacto.includes(searchLower) || empresa.includes(searchLower);
    });

    setClientSearchResults(results);
    setShowClientDropdown(true);
  };

  // Función para seleccionar producto desde el dropdown de búsqueda
  const selectProductFromSearch = (product: any, quantity: number = 1) => {
    const existingItem = currentQuotation.items.find((item: any) => item.productId === product.id);
    
    if (existingItem) {
      // Incrementar cantidad existente
      updateItemQuantity(product.id, existingItem.quantity + quantity);
    } else {
      // Agregar nuevo producto
      const newItem = {
        productId: product.id,
        code: getColumnValue(product, 'sku'),
        title: getColumnValue(product, 'nombre'),
        categoria: getColumnValue(product, 'categoria'),
        descripcion: getColumnValue(product, 'descripcion'),
        price: parseFloat(getColumnValue(product, 'precio').replace(/[^\d.-]/g, '')) || 0,
        quantity: quantity,
        total: (parseFloat(getColumnValue(product, 'precio').replace(/[^\d.-]/g, '')) || 0) * quantity
      };
      
      const newSubtotal = currentQuotation.subtotal + newItem.total;
      const newTotal = calculateTotalWithDiscount(newSubtotal, currentQuotation.discount, currentQuotation.discountType);
      
      setCurrentQuotation({
        ...currentQuotation,
        items: [...currentQuotation.items, newItem],
        subtotal: newSubtotal,
        total: newTotal
      });
    }
    
    // Limpiar búsqueda
    setProductSearchTerm('');
    setShowProductDropdown(false);
    setSearchResults([]);
  };

  // Función para seleccionar cliente desde el dropdown de búsqueda
  const selectClientFromSearch = (client: any) => {
    setCurrentQuotation({
      ...currentQuotation,
      clientName: client.empresa,
      projectName: client.empresa
    });
    
    // Limpiar búsqueda
    setClientSearchTerm('');
    setShowClientDropdown(false);
    setClientSearchResults([]);
  };

  // Función para calcular el total con descuento
  const calculateTotalWithDiscount = (subtotal: number, discount: number, discountType: string) => {
    if (discountType === 'percentage') {
      return subtotal - (subtotal * discount / 100);
    } else {
      return Math.max(0, subtotal - discount);
    }
  };

  // Función para actualizar el descuento
  const updateDiscount = (discount: number, discountType: string) => {
    const subtotal = currentQuotation.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = calculateTotalWithDiscount(subtotal, discount, discountType);
    
    setCurrentQuotation({
      ...currentQuotation,
      discount,
      discountType,
      subtotal,
      total
    });
  };

  // Función para cargar cotizaciones desde la base de datos
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const quotationsData = await quotationAPI.getQuotations();
      setQuotations(quotationsData);
      console.log('✅ Cotizaciones cargadas desde la base de datos:', quotationsData.length);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('Error al cargar cotizaciones desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar cotización
  const deleteQuotation = async (quotationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando cotización:', quotationId);
      await quotationAPI.deleteQuotation(quotationId);
      
      // Actualizar estado local removiendo la cotización eliminada
      setQuotations(quotations.filter(q => q.id !== quotationId));
      
      console.log('✅ Cotización eliminada exitosamente');
      alert('✅ Cotización eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar cotización:', err);
      alert('❌ Error al eliminar cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const openQuotationInForm = (quotation: Quotation) => {
    // Cargar la cotización seleccionada en el formulario
    setCurrentQuotation({
      clientName: quotation.clientName,
      projectName: quotation.projectName,
      quotationName: quotation.quotationName, // Mantener el nombre original
      items: quotation.items,
      total: quotation.total,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      discountType: quotation.discountType,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Marcar que estamos editando una cotización existente
    setIsEditingExisting(true);
    setEditingQuotationId(quotation.id);
    
    // Cerrar el modal de cotizaciones
    setShowQuotationsModal(false);
  };

  // Efecto para manejar OAuth2 y cargar datos (copiado de Todo.tsx)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state === 'quotations_auth') {
        console.log('🔑 Código de autorización recibido:', code);
        
        // El callback de OAuth ya se maneja en App.tsx
        // Solo limpiar la URL y cargar datos
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Cargar datos después de autenticación
        fetchGoogleSheetData();
        fetchCrmClients();
        fetchQuotations();
      }
    };

    const loadData = async () => {
      console.log('🔄 Cargando datos de cotizaciones...');
      
      // Verificar si ya estamos autenticados con el servicio centralizado
      if (isAuthenticated && accessToken) {
        console.log('🔑 Ya autenticado con servicio centralizado, cargando desde Google Sheets...');
        fetchGoogleSheetData();
        fetchCrmClients();
        fetchQuotations();
      } else if (GOOGLE_API_KEY) {
        console.log('🔑 API Key encontrada, cargando desde Google Sheets...');
        fetchGoogleSheetData();
        fetchCrmClients();
        fetchQuotations();
      } else {
        console.log('⚠️ Sin autenticación, cargando datos de ejemplo...');
        setLoading(false);
      }
    };

    // Manejar callback de OAuth2
    handleOAuthCallback();
    
    // Cargar datos
    loadData();
  }, []);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
      if (!target.closest('.client-search-container')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar productos basado en búsqueda y filtros
  const filteredProducts = products.filter(product => {
    const matchesSearch = getColumnValue(product, 'nombre')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getColumnValue(product, 'sku')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getColumnValue(product, 'categoria')?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || 
                         getColumnValue(product, 'categoria')?.toLowerCase().includes(statusFilter);
    
    return matchesSearch && matchesFilter;
  });

  // Funciones para manejar cotizaciones
  const addProductToQuotation = (product: any) => {
    const existingItem = currentQuotation.items.find((item: any) => item.productId === product.id);
    
    if (existingItem) {
      // Incrementar cantidad
      const updatedItems = currentQuotation.items.map((item: any) =>
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      const newSubtotal = updatedItems.reduce((sum: number, item: any) => sum + item.total, 0);
      const newTotal = calculateTotalWithDiscount(newSubtotal, currentQuotation.discount, currentQuotation.discountType);
      
      setCurrentQuotation({
        ...currentQuotation,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newTotal
      });
    } else {
      // Agregar nuevo producto
      const newItem = {
        productId: product.id,
        code: getColumnValue(product, 'sku'),
        title: getColumnValue(product, 'nombre'),
        categoria: getColumnValue(product, 'categoria'),
        descripcion: getColumnValue(product, 'descripcion'),
        price: parseFloat(getColumnValue(product, 'precio').replace(/[^\d.-]/g, '')) || 0,
        quantity: 1,
        total: parseFloat(getColumnValue(product, 'precio').replace(/[^\d.-]/g, '')) || 0
      };
      
      const newSubtotal = currentQuotation.subtotal + newItem.total;
      const newTotal = calculateTotalWithDiscount(newSubtotal, currentQuotation.discount, currentQuotation.discountType);
      
      setCurrentQuotation({
        ...currentQuotation,
        items: [...currentQuotation.items, newItem],
        subtotal: newSubtotal,
        total: newTotal
      });
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const updatedItems = currentQuotation.items.map((item: any) =>
      item.productId === productId 
        ? { ...item, quantity: Math.max(1, quantity), total: item.price * Math.max(1, quantity) }
        : item
    );
    
    const subtotal = updatedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = calculateTotalWithDiscount(subtotal, currentQuotation.discount, currentQuotation.discountType);
    
    setCurrentQuotation({
      ...currentQuotation,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const removeItemFromQuotation = (productId: string) => {
    const updatedItems = currentQuotation.items.filter((item: any) => item.productId !== productId);
    const subtotal = updatedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = calculateTotalWithDiscount(subtotal, currentQuotation.discount, currentQuotation.discountType);
    
    setCurrentQuotation({
      ...currentQuotation,
      items: updatedItems,
      subtotal,
      total
    });
  };

  // Función para guardar cotización en Google Sheets
  const saveQuotationToSheets = async (quotation: any) => {
    if (!accessToken && !GOOGLE_API_KEY) {
      throw new Error('No se puede guardar cotización - Sin autenticación');
    }

    try {
      // Crear array de valores para la cotización
      const values = [
        quotation.id || Date.now().toString(),
        quotation.clientName || '',
        quotation.projectName || '',
        quotation.total || 0,
        quotation.status || 'pending',
        quotation.createdAt || new Date().toISOString().split('T')[0],
        quotation.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quotation.items.length || 0,
        JSON.stringify(quotation.items) // Guardar items como JSON
      ];

      // Usar OAuth2 si está disponible, sino API Key
      let url: string;
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        try {
          const validToken = await getValidAccessToken();
          url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}:append?valueInputOption=USER_ENTERED`;
          headers['Authorization'] = `Bearer ${validToken}`;
        } catch (err) {
          console.error('Error al obtener token válido:', err);
          throw new Error('No se pudo obtener un token válido para guardar la cotización');
        }
      } else {
        url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [values] })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error al guardar cotización: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Cotización guardada exitosamente en Google Sheets');
      
    } catch (err) {
      console.error('Error al guardar cotización en Google Sheets:', err);
      throw err;
    }
  };

  const saveChanges = async () => {
    if (!currentQuotation.clientName || currentQuotation.items.length === 0) {
      if (!currentQuotation.clientName) {
        alert('❌ Por favor selecciona un cliente antes de guardar la cotización');
      } else if (currentQuotation.items.length === 0) {
        alert('❌ Por favor agrega al menos un producto antes de guardar la cotización');
      }
      return;
    }

    if (!isEditingExisting || !editingQuotationId) {
      alert('❌ Error: No se puede actualizar una cotización que no existe');
      return;
    }

    try {
      const quotationData: CreateQuotationData = {
        quotationName: currentQuotation.quotationName,
        clientName: currentQuotation.clientName,
        projectName: currentQuotation.projectName,
        total: currentQuotation.total,
        subtotal: currentQuotation.subtotal,
        discount: currentQuotation.discount || 0,
        discountType: currentQuotation.discountType || 'percentage',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        items: currentQuotation.items
      };

      console.log('🔄 Actualizando cotización existente...', editingQuotationId);
      
      const updatedQuotation = await quotationAPI.updateQuotation(editingQuotationId, quotationData);
      
      // Actualizar la cotización en la lista local
      setQuotations(quotations.map(q => 
        q.id === editingQuotationId ? updatedQuotation : q
      ));

      console.log('✅ Cotización actualizada exitosamente');
      alert('✅ Cotización actualizada exitosamente');
      
    } catch (err) {
      console.error('❌ Error al actualizar cotización:', err);
      alert('❌ Error al actualizar cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const openSaveModal = () => {
    if (currentQuotation.clientName && currentQuotation.items.length > 0) {
      // Si estamos editando una cotización existente, usar su nombre actual
      if (isEditingExisting && currentQuotation.quotationName) {
        setTempQuotationName(currentQuotation.quotationName);
      } else {
        // Generar nombre sugerido automáticamente para nueva cotización
        const suggestedName = `Cotización ${currentQuotation.clientName} - ${new Date().toLocaleDateString('es-CO')}`;
        setTempQuotationName(suggestedName);
      }
      setShowSaveModal(true);
    } else {
      console.log('❌ No se puede guardar: falta cliente o productos');
      if (!currentQuotation.clientName) {
        alert('❌ Por favor selecciona un cliente antes de guardar la cotización');
      } else if (currentQuotation.items.length === 0) {
        alert('❌ Por favor agrega al menos un producto antes de guardar la cotización');
      }
    }
  };

  const saveQuotation = async () => {
    console.log('🔍 Intentando guardar cotización...');
    console.log('📝 Nombre:', tempQuotationName);
    console.log('📋 Cliente:', currentQuotation.clientName);
    console.log('📦 Productos:', currentQuotation.items.length);
    console.log('💰 Total:', currentQuotation.total);
    console.log('🔄 Editando existente:', isEditingExisting);
    console.log('🆔 ID de edición:', editingQuotationId);
    
    try {
      const quotationData: CreateQuotationData = {
        quotationName: tempQuotationName,
        clientName: currentQuotation.clientName,
        projectName: currentQuotation.projectName,
        total: currentQuotation.total,
        subtotal: currentQuotation.subtotal,
        discount: currentQuotation.discount || 0,
        discountType: currentQuotation.discountType || 'percentage',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días
        items: currentQuotation.items
      };
      
      console.log('📤 Enviando datos a la API:', quotationData);
      
      let savedQuotation: Quotation;
      
      if (isEditingExisting && editingQuotationId) {
        // Actualizar cotización existente
        console.log('🔄 Actualizando cotización existente...');
        savedQuotation = await quotationAPI.updateQuotation(editingQuotationId, quotationData);
        
        // Actualizar la cotización en la lista local
        setQuotations(quotations.map(q => 
          q.id === editingQuotationId ? savedQuotation : q
        ));
      } else {
        // Crear nueva cotización
        console.log('➕ Creando nueva cotización...');
        savedQuotation = await quotationAPI.createQuotation(quotationData);
        
        // Agregar la nueva cotización a la lista local
        setQuotations([savedQuotation, ...quotations]);
      }
      
      console.log('✅ Cotización guardada exitosamente:', savedQuotation);
      
      // Limpiar la cotización actual para empezar una nueva
      setCurrentQuotation({
        clientName: '',
        projectName: '',
        quotationName: '',
        items: [],
        total: 0,
        subtotal: 0,
        discount: 0,
        discountType: 'percentage',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Limpiar estados de edición
      setIsEditingExisting(false);
      setEditingQuotationId(null);
      
      // Limpiar también la búsqueda de productos
      setProductSearchTerm('');
      setShowProductDropdown(false);
      setSearchResults([]);
      
      // Cerrar modal
      setShowSaveModal(false);
      setTempQuotationName('');
      
      // Resetear estado de edición
      setIsEditingExisting(false);
      
      alert(`✅ Cotización "${tempQuotationName}" guardada exitosamente en la base de datos`);
    } catch (err) {
      console.error('Error al guardar cotización:', err);
      alert('❌ Error al guardar cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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

  // Función para generar PDF con jsPDF (sin enlaces blob visibles)
  const generatePDF = async (quotation: any) => {
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configurar colores
      const primaryColor = [102, 126, 234]; // #667eea
      
      // Convertir logo a base64
      let logoBase64 = '';
      try {
        logoBase64 = await convertImageToBase64(logoImage);
        console.log('✅ Logo convertido a base64 exitosamente');
        
        // Agregar logo al PDF (manteniendo proporción original)
        // Calcular proporción para mantener aspect ratio
        const logoWidth = 30;
        const logoHeight = 20; // Mantener proporción h-20 w-auto
        doc.addImage(logoBase64, 'PNG', 80, 10, logoWidth, logoHeight);
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
        const logoWidth = 30;
        const logoHeight = 20;
        doc.addImage(logoBase64, 'PNG', 80, 10, logoWidth, logoHeight);
      }
      
      // Línea separadora
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);
      
      // Información de la cotización
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('INFORMACIÓN DE LA COTIZACIÓN', 20, 55);
      
      // Datos del cliente y proyecto
      doc.setFontSize(10);
      doc.text(`Cliente: ${quotation.clientName || 'Cliente por definir'}`, 20, 65);
      doc.text(`Proyecto: ${quotation.projectName || 'Proyecto por definir'}`, 20, 70);
      doc.text(`Fecha: ${quotation.createdAt || new Date().toLocaleDateString()}`, 110, 65);
      doc.text(`Válida hasta: ${quotation.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 110, 70);
      
      // Tabla de productos/servicios
      doc.setFontSize(12);
      doc.text('DETALLE DE PRODUCTOS/SERVICIOS', 20, 110);
      
      // Encabezados de la tabla
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, 115, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción', 25, 122);
      doc.text('Cantidad', 120, 122);
      doc.text('Precio Unit.', 145, 122);
      doc.text('Total', 170, 122);
      
      // Filas de productos
      let yPosition = 135;
      let subtotal = 0;
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      quotation.items.forEach((item: any, index: number) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;
        
        // Alternar color de fondo
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPosition - 5, 170, 12, 'F');
        }
        
        // Mostrar clave y nombre del producto
        const productCode = item.code || item.sku || '';
        const productName = item.description || item.name || item.title || 'Producto/Servicio';
        const productDisplay = productCode ? `${productCode} - ${productName}` : productName;
        
        // Ajustar tamaño de fuente para mejor legibilidad
        doc.setFontSize(9);
        doc.text(productDisplay, 25, yPosition + 2);
        doc.setFontSize(10);
        doc.text((item.quantity || 1).toString(), 120, yPosition + 2);
        doc.text(`$${(item.price || 0).toLocaleString()}`, 145, yPosition + 2);
        doc.text(`$${itemTotal.toLocaleString()}`, 170, yPosition + 2);
        
        yPosition += 12;
      });
      
      // Totales
      yPosition += 15;
      doc.setFontSize(10);
      doc.text('Subtotal:', 145, yPosition);
      doc.text(`$${subtotal.toLocaleString()}`, 170, yPosition);
      
      if (quotation.discount > 0) {
        const discountAmount = quotation.discountType === 'percentage' 
          ? (subtotal * quotation.discount / 100)
          : quotation.discount;
        
        yPosition += 10;
        doc.text(`Descuento ${quotation.discountType === 'percentage' ? `(${quotation.discount}%)` : ''}:`, 145, yPosition);
        doc.text(`-$${discountAmount.toLocaleString()}`, 170, yPosition);
        
        yPosition += 10;
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 145, yPosition);
        doc.text(`$${(subtotal - discountAmount).toLocaleString()}`, 170, yPosition);
      } else {
        yPosition += 10;
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 145, yPosition);
        doc.text(`$${subtotal.toLocaleString()}`, 170, yPosition);
      }
      
      // Nota de validez
      yPosition += 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Nota: Esta cotización es válida por 15 días a partir de la fecha de emisión.', 20, yPosition);
      doc.text('Los precios están sujetos a cambios sin previo aviso.', 20, yPosition + 5);
      
      // Pie de página
      doc.setFontSize(8);
      doc.text('© ' + new Date().getFullYear() + ' Colorland. Todos los derechos reservados.', 105, 285, { align: 'center' });
      
      // Generar nombre del archivo
      const fileName = `cotizacion-${quotation.clientName || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Descargar el PDF
      doc.save(fileName);
      
      console.log('✅ PDF generado exitosamente con jsPDF');
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  // Función antigua para generar PDF con HTML (mantener como respaldo)
  const generatePDFOld = async (quotation: any) => {
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
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Cotización ColorLand</title>
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
              .quotation-info { 
                margin-bottom: 40px; 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 25px;
                border-radius: 12px;
                border-left: 5px solid #3498db;
              }
              .quotation-info h3 { 
                color: #2c3e50; 
                border-bottom: 2px solid #3498db; 
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 20px;
              }
              .info-item { 
                margin: 15px 0; 
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .info-label { 
                font-weight: 600; 
                color: #5a6c7d; 
                font-size: 15px;
              }
              .info-value { 
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
              .total-section { 
                margin-top: 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
              }
              .total-amount { 
                font-size: 36px; 
                font-weight: 700; 
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .total-label { 
                font-size: 18px; 
                opacity: 0.9;
                margin-bottom: 5px;
              }
              .total-note { 
                font-size: 14px; 
                opacity: 0.8;
                margin-top: 10px;
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
                  <div class="report-title">COTIZACIÓN COLORLAND</div>
                </div>
              </div>
            </div>
            
            <div class="quotation-info">
              <h3>Información de la Cotización</h3>
              <div class="info-item">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${quotation.clientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Proyecto:</span>
                <span class="info-value">${quotation.projectName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total de productos:</span>
                <span class="info-value">${quotation.items.length} productos</span>
              </div>
            </div>
            
            <h3>Detalle de Productos</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.code}</td>
                    <td>${item.title}</td>
                    <td>${item.quantity}</td>
                    <td>$${formatInternationalNumber(item.price)}</td>
                    <td>$${formatInternationalNumber(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-label">TOTAL DE LA COTIZACIÓN</div>
              <div class="total-amount">$${formatInternationalNumber(quotation.total)}</div>
              <div class="total-note">IVA incluido • Válida por 15 días</div>
            </div>
            
            <div class="footer">
              <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
                <p style="margin-bottom: 10px;">ColorLand - Pinturas de Alta Calidad</p>
                <p style="margin-bottom: 5px;">Esta cotización es válida por 15 días</p>
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
      
      // Crear un enlace temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${quotation.clientName || 'cliente'}-${new Date().toISOString().split('T')[0]}.html`;
      link.style.display = 'none';
      
      // Agregar al DOM temporalmente, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL inmediatamente
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF generado exitosamente con logo');
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  // Función para enviar email
  const sendEmail = () => {
    if (emailAddress && selectedQuotation) {
      // Guardar la cotización si es una nueva
      if (!selectedQuotation.id) {
        const newQuotation = {
          ...selectedQuotation,
          id: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 días
        };
        setQuotations([newQuotation, ...quotations]);
      }
      
      // Aquí iría la lógica para enviar el email
      // Por ahora solo mostraremos un alert
      alert(`Cotización enviada a: ${emailAddress}`);
      setShowEmailModal(false);
      setEmailAddress('');
      setSelectedQuotation(null);
      
      // Limpiar el formulario si era una nueva cotización
      if (!selectedQuotation.id) {
        setCurrentQuotation({
          clientName: '',
          projectName: '',
          items: [],
          total: 0,
          date: new Date().toISOString().split('T')[0]
        });
        
        // Limpiar también la búsqueda de productos
        setProductSearchTerm('');
        setShowProductDropdown(false);
        setSearchResults([]);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'approved':
      case 'aprobada':
        return 'Aprobada';
      case 'rejected':
      case 'rechazada':
        return 'Rechazada';
      default:
        return status || 'Desconocido';
    }
  };

  const formatCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return 'N/A';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
    
    // Formato colombiano: punto para miles, coma para decimales
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(numAmount);
  };

  const formatNumber = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return 'N/A';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
    
    // Formato colombiano: punto para miles, coma para decimales
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(numAmount);
  };

  // Función personalizada para formato internacional (coma para miles, punto para decimales)
  const formatInternationalNumber = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return 'N/A';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
    
    // Convertir a string con 2 decimales
    const numStr = numAmount.toFixed(2);
    
    // Separar parte entera y decimal
    const [integerPart, decimalPart] = numStr.split('.');
    
    // Agregar comas para miles en la parte entera
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combinar con punto decimal
    return `${formattedInteger}.${decimalPart}`;
  };

  const formatInternationalCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return 'N/A';
    
    const formattedNumber = formatInternationalNumber(amount);
    return `$${formattedNumber}`;
  };



  return (
    <div className="space-y-6">
                    {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-text">Cotizaciones</h1>
                </div>
                <div className="flex gap-2">
                  {(GOOGLE_API_KEY || accessToken) ? (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                        onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?gid=0#gid=0`, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Abrir Google Sheet
                      </Button>
                      <Button onClick={() => fetchGoogleSheetData()} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualizar
                      </Button>
                      {!isAuthenticated && GOOGLE_CLIENT_ID && (
                        <Button 
                          onClick={authenticateWithGoogle} 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                          disabled={authLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {authLoading ? 'Conectando...' : 'Conectar con Google'}
                        </Button>
                      )}
                      {isAuthenticated && GOOGLE_CLIENT_ID && (
                        <Button 
                          onClick={reconnectWithGoogle} 
                          variant="outline"
                          className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconectar Google
                        </Button>
                      )}
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
                  <Button 
                    onClick={() => {
                      // Limpiar solo los productos de la cotización actual
                      setCurrentQuotation({
                        clientName: '',
                        projectName: '',
                        quotationName: '',
                        items: [],
                        total: 0,
                        subtotal: 0,
                        discount: 0,
                        discountType: 'percentage',
                        date: new Date().toISOString().split('T')[0]
                      });
                      // Limpiar también la búsqueda de productos
                      setProductSearchTerm('');
                      setShowProductDropdown(false);
                      setSearchResults([]);
                      // Limpiar búsqueda de clientes
                      setClientSearchTerm('');
                      setShowClientDropdown(false);
                      setClientSearchResults([]);
                      // Resetear estado de edición
                      setIsEditingExisting(false);
                      // Mostrar mensaje de confirmación
                      alert('✅ Formulario de cotización limpiado. Puedes crear una nueva cotización.');
                    }}
                    variant={currentQuotation.clientName || currentQuotation.items.length > 0 ? "danger" : "outline"}
                    className={currentQuotation.clientName || currentQuotation.items.length > 0 ? "bg-red-50 text-red-700 hover:bg-red-100" : ""}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    {currentQuotation.clientName || currentQuotation.items.length > 0 ? 'Limpiar Cotización' : 'Nueva Cotización'}
                  </Button>
                </div>
              </div>

      {/* Stats Cards */}
      {/* Stats Cards - Oculto temporalmente */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">{products.length}</h3>
          <p className="text-gray-600">Total Productos</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {products.filter(p => 
              getColumnValue(p, 'categoria')?.toLowerCase().includes('cubeta') || 
              getColumnValue(p, 'sku')?.toLowerCase().includes('bc')
            ).length}
          </h3>
          <p className="text-gray-600">Cubetas 19LT</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {products.filter(p => 
              getColumnValue(p, 'categoria')?.toLowerCase().includes('galon') || 
              getColumnValue(p, 'sku')?.toLowerCase().includes('bg')
            ).length}
          </h3>
          <p className="text-gray-600">Galones 4LT</p>
        </Card>
      </div> */}

      {/* Formulario de Cotización - Siempre visible */}
        <Card className={currentQuotation.clientName || currentQuotation.items.length > 0 ? "border-blue-200 bg-blue-50" : ""}>
          <div className="space-y-4">
            
            {/* Mostrar nombre de la cotización cuando se está editando */}
            {isEditingExisting && currentQuotation.quotationName && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Editando:</span>
                  <span className="text-sm text-blue-700 font-semibold">{currentQuotation.quotationName}</span>
                </div>
              </div>
            )}
            
            {/* Nombre de la cotización - Oculto */}
            {/* <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Cotización
              </label>
              <input
                type="text"
                value={currentQuotation.quotationName}
                onChange={(e) => setCurrentQuotation({
                  ...currentQuotation,
                  quotationName: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ej: Cotización Casa ABC - Enero 2025"
              />
              <p className="text-xs text-gray-500 mt-1">
                Asigna un nombre descriptivo para identificar fácilmente esta cotización
              </p>
            </div> */}

            {/* Información del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente del CRM
                </label>
                
                {/* Dropdown tradicional */}
                <div className="mb-3">
                  <select
                    value={currentQuotation.clientName}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedClient = crmClients.find(c => c.empresa === e.target.value);
                        if (selectedClient) {
                          setCurrentQuotation({
                            ...currentQuotation,
                            clientName: selectedClient.empresa,
                            projectName: selectedClient.empresa
                          });
                        }
                      } else {
                        setCurrentQuotation({
                          ...currentQuotation,
                          clientName: '',
                          projectName: ''
                        });
                      }
                    }}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Seleccionar cliente del CRM...</option>
                    {crmClients.length > 0 ? (
                      crmClients.map((client) => (
                        <option key={client.id} value={client.empresa}>
                          {client.contacto} - {client.empresa}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {crmLoading ? 'Cargando clientes...' : `No hay clientes (${crmClients.length})`}
                      </option>
                    )}
                  </select>
                </div>

                {/* Search bar */}
                <div className="relative client-search-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Cliente
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value);
                          searchClients(e.target.value);
                        }}
                        className="w-full h-10 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Buscar por contacto o empresa..."
                      />
                      {clientSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientSearchTerm('');
                            setShowClientDropdown(false);
                            setClientSearchResults([]);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Limpiar búsqueda"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <Button
                      onClick={fetchCrmClients}
                      disabled={crmLoading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${crmLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  {/* Dropdown de resultados de búsqueda de clientes */}
                  {showClientDropdown && clientSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {clientSearchResults.slice(0, 10).map((client) => (
                        <div
                          key={client.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectClientFromSearch(client)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">
                                {client.contacto}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {client.empresa}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs text-gray-500">
                                {client.email || 'Sin email'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {client.telefono || 'Sin teléfono'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {clientSearchResults.length > 10 && (
                        <div className="px-4 py-2 text-xs text-gray-500 text-center bg-gray-50">
                          Mostrando 10 de {clientSearchResults.length} resultados
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay resultados */}
                  {showClientDropdown && clientSearchResults.length === 0 && clientSearchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="px-4 py-3 text-center text-gray-500">
                        <p className="text-sm">No se encontraron clientes con "{clientSearchTerm}"</p>
                        <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {crmLoading && (
                  <p className="text-xs text-blue-600 mt-1">🔄 Cargando clientes del CRM...</p>
                )}
                <div className="mt-2">
                  <Button
                    onClick={() => setShowAddClientModal(true)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar Nuevo Cliente
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={currentQuotation.projectName}
                  onChange={(e) => setCurrentQuotation({
                    ...currentQuotation,
                    projectName: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Se llenará automáticamente con el nombre de la empresa"
                />
              </div>
            </div>

            {/* Información adicional del cliente */}
            {currentQuotation.clientName && (
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Información del Cliente</h4>
                  <Button
                    onClick={() => {
                      setCurrentQuotation({
                        ...currentQuotation,
                        clientName: '',
                        projectName: ''
                      });
                      setClientSearchTerm('');
                      setShowClientDropdown(false);
                      setClientSearchResults([]);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Cambiar Cliente
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {(() => {
                    const selectedClient = crmClients.find(c => c.empresa === currentQuotation.clientName);
                    if (!selectedClient) return null;
                    
                    return (
                      <>
                        <div>
                          <span className="font-medium text-gray-600">Empresa:</span>
                          <p className="text-gray-800">{selectedClient.empresa || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Contacto:</span>
                          <p className="text-gray-800">{selectedClient.contacto || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Email:</span>
                          <p className="text-gray-800">{selectedClient.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Teléfono:</span>
                          <p className="text-gray-800">{selectedClient.telefono || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Estado:</span>
                          <p className="text-gray-800">{selectedClient.estado || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Dirección:</span>
                          <p className="text-gray-800">{selectedClient.direccion || 'N/A'}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Selección de productos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Productos
              </label>
              <div className="space-y-4">
                {/* Campos de selección */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dropdown tradicional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar del catálogo
                    </label>
                    <select
                      id="product-select"
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedProduct = products.find(p => p.id === e.target.value);
                          const quantityInput = document.getElementById('quantity-input') as HTMLInputElement;
                          const quantity = parseInt(quantityInput.value) || 1;
                          
                          if (selectedProduct) {
                            selectProductFromSearch(selectedProduct, quantity);
                            e.target.value = ''; // Limpiar selección
                          }
                        }
                      }}
                    >
                      <option value="">Seleccionar producto...</option>
                      {filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {getColumnValue(product, 'sku')} - {getColumnValue(product, 'nombre')} ({getColumnValue(product, 'categoria')})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search bar con dropdown */}
                  <div className="relative product-search-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar producto
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => {
                          setProductSearchTerm(e.target.value);
                          searchProducts(e.target.value);
                        }}
                        className="w-full h-10 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Buscar (ej: satin, azul, 19LT)..."
                      />
                      {productSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearchTerm('');
                            setShowProductDropdown(false);
                            setSearchResults([]);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Limpiar búsqueda"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {/* Dropdown de resultados de búsqueda */}
                    {showProductDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.slice(0, 10).map((product) => (
                          <div
                            key={product.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              const quantityInput = document.getElementById('quantity-input') as HTMLInputElement;
                              const quantity = parseInt(quantityInput.value) || 1;
                              selectProductFromSearch(product, quantity);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">
                                  {getColumnValue(product, 'sku')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {getColumnValue(product, 'nombre')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getColumnValue(product, 'categoria')}
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-sm font-semibold text-blue-600">
                                  {formatInternationalCurrency(getColumnValue(product, 'precio'))}
                                </p>
                                <p className="text-xs text-gray-500">por unidad</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {searchResults.length > 10 && (
                          <div className="px-4 py-2 text-xs text-gray-500 text-center bg-gray-50">
                            Mostrando 10 de {searchResults.length} resultados
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Mensaje cuando no hay resultados */}
                    {showProductDropdown && searchResults.length === 0 && productSearchTerm.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div className="px-4 py-3 text-center text-gray-500">
                          <p className="text-sm">No se encontraron productos con "{productSearchTerm}"</p>
                          <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Campo de cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const quantityInput = document.getElementById('quantity-input') as HTMLInputElement;
                          const currentValue = parseInt(quantityInput.value) || 1;
                          const newValue = Math.max(1, currentValue - 1);
                          quantityInput.value = newValue.toString();
                        }}
                        className="w-10 h-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        id="quantity-input"
                        min="1"
                        defaultValue="1"
                        className="flex-1 h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center"
                        placeholder="Cantidad"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const quantityInput = document.getElementById('quantity-input') as HTMLInputElement;
                          const currentValue = parseInt(quantityInput.value) || 1;
                          const newValue = currentValue + 1;
                          quantityInput.value = newValue.toString();
                        }}
                        className="w-10 h-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Botón de actualizar */}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={fetchGoogleSheetData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar Productos
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de productos seleccionados */}
            {currentQuotation.items.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Productos en la cotización ({currentQuotation.items.length} productos):</h4>
                <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {currentQuotation.items.map((item: any, index: number) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            #{index + 1}
                          </span>
                          <p className="font-medium text-sm">{item.code}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.title}</p>
                        <p className="text-xs text-gray-500">${formatInternationalNumber(item.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Cantidad:</label>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.productId, Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              -
                            </Button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatInternationalCurrency(item.total)}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x ${formatInternationalNumber(item.price)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeItemFromQuotation(item.productId)}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Descuento */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Descuento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Descuento
                      </label>
                      <select
                        value={currentQuotation.discountType}
                        onChange={(e) => updateDiscount(currentQuotation.discount, e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="amount">Monto fijo ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {currentQuotation.discountType === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={currentQuotation.discountType === 'percentage' ? '100' : currentQuotation.subtotal}
                        step={currentQuotation.discountType === 'percentage' ? '0.1' : '1'}
                        value={currentQuotation.discount}
                        onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0, currentQuotation.discountType)}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={currentQuotation.discountType === 'percentage' ? '0.0' : '0'}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => updateDiscount(0, currentQuotation.discountType)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Limpiar Descuento
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Resumen de Totales */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Subtotal:</span>
                      <span className="text-lg font-semibold text-gray-800">
                        {formatInternationalCurrency(currentQuotation.subtotal)}
                      </span>
                    </div>
                    {currentQuotation.discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Descuento ({currentQuotation.discountType === 'percentage' ? `${currentQuotation.discount}%` : 'Monto fijo'}):
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          -{formatInternationalCurrency(
                            currentQuotation.discountType === 'percentage' 
                              ? (currentQuotation.subtotal * currentQuotation.discount / 100)
                              : currentQuotation.discount
                          )}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-gray-700">Total de la Cotización:</span>
                        <span className="text-3xl font-bold text-blue-600">
                          {formatInternationalCurrency(currentQuotation.total)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 text-right">
                        {currentQuotation.items.length} productos seleccionados • IVA incluido
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado de la cotización */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentQuotation.clientName ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">
                          Cliente: {currentQuotation.clientName || 'No seleccionado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentQuotation.items.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">
                          Productos: {currentQuotation.items.length}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentQuotation.clientName && currentQuotation.items.length > 0 
                        ? '✅ Listo para guardar' 
                        : '❌ Faltan datos requeridos'
                      }
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-4 flex gap-2">
                  {/* Botón Enviar por Email - Oculto */}
                  {/* <Button 
                    onClick={() => {
                      if (currentQuotation.clientName && currentQuotation.items.length > 0) {
                        setSelectedQuotation(currentQuotation);
                        setShowEmailModal(true);
                      }
                    }} 
                    disabled={!currentQuotation.clientName || currentQuotation.items.length === 0}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar por Email
                  </Button> */}
                  {isEditingExisting ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={saveChanges}
                        disabled={!currentQuotation.clientName || currentQuotation.items.length === 0}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={openSaveModal}
                        disabled={!currentQuotation.clientName || currentQuotation.items.length === 0}
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar como Nueva
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={openSaveModal}
                      disabled={!currentQuotation.clientName || currentQuotation.items.length === 0}
                      className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cotización
                    </Button>
                  )}
                  {/* Botón Crear Prueba - Oculto */}
                  {/* <Button 
                    variant="outline" 
                    onClick={() => {
                      // Crear una cotización de prueba
                      setCurrentQuotation({
                        clientName: 'Cliente de Prueba',
                        projectName: 'Proyecto de Prueba',
                        quotationName: 'Cotización de Prueba - ' + new Date().toLocaleDateString('es-CO'),
                        items: [
                          {
                            productId: '1',
                            code: 'TEST001',
                            title: 'Producto de Prueba',
                            price: 100000,
                            quantity: 2,
                            total: 200000
                          }
                        ],
                        total: 200000,
                        subtotal: 200000,
                        discount: 0,
                        discountType: 'percentage',
                        date: new Date().toISOString().split('T')[0]
                      });
                      alert('✅ Cotización de prueba creada. Ahora puedes guardarla.');
                    }}
                    className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Prueba
                  </Button> */}
                </div>
              </div>
            )}
          </div>
        </Card>

      {/* Botones de acción principales */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          onClick={() => {
            // Cargar cotizaciones guardadas y abrir modal
            fetchQuotations();
            setShowQuotationsModal(true);
          }}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
        >
          <FileText className="w-4 h-4 mr-2" />
          Ver Cotizaciones Guardadas
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            if (currentQuotation.items.length > 0) {
              // Exportar la cotización actual
              const quotationToExport = {
                ...currentQuotation,
                clientName: currentQuotation.clientName || 'Cliente por definir',
                projectName: currentQuotation.projectName || 'Proyecto por definir',
                createdAt: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              };
              generatePDF(quotationToExport);
            } else {
              alert('❌ No hay productos para exportar');
            }
          }}
          disabled={currentQuotation.items.length === 0}
          className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Botón de Exportar PDF - Oculto ya que está arriba */}
      <div className="hidden">
        <Button 
          variant="outline" 
          onClick={() => {
            if (currentQuotation.items.length > 0) {
              // Exportar la cotización actual
              const quotationToExport = {
                ...currentQuotation,
                clientName: currentQuotation.clientName || 'Cliente por definir',
                projectName: currentQuotation.projectName || 'Proyecto por definir',
                createdAt: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              };
              generatePDF(quotationToExport);
            } else if (quotations.length > 0) {
              // Exportar todas las cotizaciones guardadas como un reporte
              const allQuotationsReport = {
                clientName: 'REPORTE GENERAL',
                projectName: 'Todas las Cotizaciones',
                items: quotations.flatMap(q => q.items),
                total: quotations.reduce((sum, q) => sum + q.total, 0),
                createdAt: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              };
              generatePDF(allQuotationsReport);
            } else {
              alert('No hay cotizaciones para exportar. Agrega productos a la cotización actual.');
            }
          }}
          disabled={currentQuotation.items.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>


      {/* Modal para agregar nuevo cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Agregar Nuevo Cliente al CRM</h3>
              <Button
                onClick={() => setShowAddClientModal(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>
            
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
                  type="text"
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
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
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
                  onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="prospect">Prospecto</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={newClient.notes}
                onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Información adicional del cliente"
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={addClientToCrm}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Agregar Cliente al CRM
              </Button>
              <Button
                onClick={() => setShowAddClientModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text mb-4">Enviar Cotización por Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Email
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="ejemplo@email.com"
                />
              </div>
              
              {selectedQuotation && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Cliente:</strong> {selectedQuotation.clientName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> {formatInternationalCurrency(selectedQuotation.total)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={sendEmail} disabled={!emailAddress}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEmailModal(false);
                setEmailAddress('');
                setSelectedQuotation(null);
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar cotización con nombre */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditingExisting ? 'Guardar como Nueva Cotización' : 'Guardar Cotización'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Cotización
              </label>
              <input
                type="text"
                value={tempQuotationName}
                onChange={(e) => setTempQuotationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ingresa un nombre para la cotización"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {isEditingExisting 
                  ? 'Ingresa un nuevo nombre para crear una copia de esta cotización' 
                  : 'Este nombre te ayudará a identificar la cotización más fácilmente'
                }
              </p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen de la Cotización:</h4>
              <p className="text-sm text-gray-600">
                <strong>Cliente:</strong> {currentQuotation.clientName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Proyecto:</strong> {currentQuotation.projectName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Productos:</strong> {currentQuotation.items.length} items
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total:</strong> ${currentQuotation.total.toLocaleString('es-CO')}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveModal(false);
                  setTempQuotationName('');
                }}
                className="px-4 py-2"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveQuotation}
                disabled={!tempQuotationName.trim()}
                className={isEditingExisting ? "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2" : "bg-green-600 hover:bg-green-700 text-white px-4 py-2"}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditingExisting ? 'Guardar como Nueva' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver cotizaciones guardadas */}
      {showQuotationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Cotizaciones Guardadas ({quotations.length})
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowQuotationsModal(false)}
                className="px-4 py-2"
              >
                Cerrar
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {quotations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cotizaciones guardadas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Proyecto</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Items</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Fecha</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map((quotation) => (
                        <tr 
                          key={quotation.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => openQuotationInForm(quotation)}
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 truncate max-w-48" title={quotation.quotationName}>
                              {quotation.quotationName}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-gray-700 truncate max-w-32" title={quotation.clientName}>
                              {quotation.clientName}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-gray-700 truncate max-w-32" title={quotation.projectName}>
                              {quotation.projectName}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {quotation.items.length}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-medium text-gray-900">{formatInternationalCurrency(quotation.total)}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}>
                              {getStatusText(quotation.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500">
                            {new Date(quotation.createdAt).toLocaleDateString('es-CO', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              {/* Botones ocultos - Solo eliminar visible */}
                              {/* <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e?: React.MouseEvent) => {
                                  e?.stopPropagation();
                                  openQuotationInForm(quotation);
                                }}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e?: React.MouseEvent) => {
                                  e.stopPropagation();
                                  generatePDF(quotation);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e?: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setSelectedQuotation(quotation);
                                  setShowEmailModal(true);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Mail className="w-4 h-4" />
                              </Button> */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e?: React.MouseEvent) => {
                                  e?.stopPropagation();
                                  deleteQuotation(quotation.id);
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup de éxito para cliente agregado */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Cliente Agregado Exitosamente!
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                El nuevo cliente ha sido guardado en el CRM de Google Sheets.
              </p>
              <Button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
