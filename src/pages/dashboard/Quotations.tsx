import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, RefreshCw, Calculator, Save, Mail, FileText } from 'lucide-react';

// Importar el logo para el PDF
import logoImage from '../../assets/logo.webp';

export const Quotations: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<any>({
    clientName: '',
    projectName: '',
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  
  // Estados para clientes del CRM
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  
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
  
  // Configuración del CRM (Google Sheets)
  const CRM_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA';
  const CRM_SHEET_NAME = 'CRM';

    // Función para agregar nuevo cliente al CRM
  const addClientToCrm = async () => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CRM_SHEET_ID}/values/${CRM_SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
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
          ]]
        })
      });

      if (!response.ok) {
        throw new Error('Error al agregar cliente al CRM');
      }

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
      
      // Mostrar mensaje de éxito
      alert('✅ Cliente agregado exitosamente al CRM');
      
    } catch (err: any) {
      console.error('Error al agregar cliente:', err);
      alert('❌ Error al agregar cliente: ' + err.message);
    }
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
      
      // URL de la API de Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_NAME}?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del Google Sheet');
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
    // Buscar el valor por diferentes variaciones del nombre de columna
    const variations = [
      columnName,
      columnName.toLowerCase(),
      columnName.replace(/\s+/g, ''),
      columnName.toLowerCase().replace(/\s+/g, ''),
      // Variaciones comunes en español
      columnName === 'clientName' ? 'cliente' : null,
      columnName === 'projectName' ? 'proyecto' : null,
      columnName === 'totalAmount' ? 'monto' : null,
      columnName === 'status' ? 'estado' : null,
      columnName === 'createdAt' ? 'fechacreacion' : null,
      columnName === 'validUntil' ? 'validaHasta' : null,
      // Variaciones adicionales
      columnName === 'clientName' ? 'nombrecliente' : null,
      columnName === 'projectName' ? 'nombreproyecto' : null,
      columnName === 'totalAmount' ? 'valor' : null,
      columnName === 'totalAmount' ? 'precio' : null,
      columnName === 'status' ? 'situacion' : null,
      columnName === 'createdAt' ? 'fecha' : null,
      columnName === 'validUntil' ? 'expiracion' : null,
    ].filter(Boolean);
    
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
      const title = getColumnValue(product, 'titulo')?.toLowerCase() || '';
      const code = getColumnValue(product, 'codigointerno')?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return title.includes(searchLower) || code.includes(searchLower);
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
        code: getColumnValue(product, 'codigointerno'),
        title: getColumnValue(product, 'titulo'),
        price: parseFloat(getColumnValue(product, 'nuevosprecioscolorland').replace(/[^\d.-]/g, '')) || 0,
        quantity: quantity,
        total: (parseFloat(getColumnValue(product, 'nuevosprecioscolorland').replace(/[^\d.-]/g, '')) || 0) * quantity
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

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchGoogleSheetData();
    fetchCrmClients();
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
    const matchesSearch = getColumnValue(product, 'titulo')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getColumnValue(product, 'codigointerno')?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || 
                         getColumnValue(product, 'codigointerno')?.toLowerCase().includes(statusFilter);
    
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
        code: getColumnValue(product, 'codigointerno'),
        title: getColumnValue(product, 'titulo'),
        price: parseFloat(getColumnValue(product, 'nuevosprecioscolorland').replace(/[^\d.-]/g, '')) || 0,
        quantity: 1,
        total: parseFloat(getColumnValue(product, 'nuevosprecioscolorland').replace(/[^\d.-]/g, '')) || 0
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

  const saveQuotation = () => {
    if (currentQuotation.clientName && currentQuotation.items.length > 0) {
      const newQuotation = {
        ...currentQuotation,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 días
      };
      
      setQuotations([newQuotation, ...quotations]);
      
      // Limpiar la cotización actual para empezar una nueva
      setCurrentQuotation({
        clientName: '',
        projectName: '',
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
      
      alert('✅ Cotización guardada exitosamente');
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

  // Función para generar PDF con logo y formato profesional
  const generatePDF = async (quotation: any) => {
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
                  <div class="generated-date">Generado el: ${new Date().toLocaleDateString('es-CO')}</div>
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
                <span class="info-label">Fecha de emisión:</span>
                <span class="info-value">${quotation.createdAt}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Válida hasta:</span>
                <span class="info-value">${quotation.validUntil}</span>
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
              <div class="total-note">IVA incluido • Válida por 30 días</div>
            </div>
            
            <div class="footer">
              <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
                <p style="margin-bottom: 10px;">ColorLand - Pinturas de Alta Calidad</p>
                <p style="margin-bottom: 5px;">Esta cotización es válida por 30 días desde la fecha de emisión</p>
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
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 días
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
                  <h1 className="text-3xl font-bold text-text">Sistema de Cotizaciones</h1>
                  <p className="text-text-secondary mt-1">
                    Crear cotizaciones usando productos de ColorLand
                  </p>
                  {GOOGLE_API_KEY ? (
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Conectado a Google Sheets
                    </div>
                  ) : (
                    <div className="flex items-center mt-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      API Key no configurada
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // Limpiar solo los productos de la cotización actual
                      setCurrentQuotation({
                        clientName: '',
                        projectName: '',
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
                    }}
                    variant="outline"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Nueva Cotización
                  </Button>
                </div>
              </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">{products.length}</h3>
          <p className="text-gray-600">Total Productos</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {products.filter(p => 
              getColumnValue(p, 'codigointerno')?.toLowerCase().includes('bc')
            ).length}
          </h3>
          <p className="text-gray-600">Cubetas 19LT</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-text">
            {products.filter(p => 
              getColumnValue(p, 'codigointerno')?.toLowerCase().includes('bg')
            ).length}
          </h3>
          <p className="text-gray-600">Galones 4LT</p>
        </Card>

      </div>

      {/* Formulario de Cotización - Siempre visible */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Nueva Cotización</h3>
            
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
                          {getColumnValue(product, 'codigointerno')} - {getColumnValue(product, 'titulo')}
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
                                  {getColumnValue(product, 'codigointerno')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {getColumnValue(product, 'titulo')}
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-sm font-semibold text-blue-600">
                                  {formatInternationalCurrency(getColumnValue(product, 'nuevosprecioscolorland'))}
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
                    <input
                      type="number"
                      id="quantity-input"
                      min="1"
                      defaultValue="1"
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Cantidad"
                    />
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
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                          />
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

                {/* Botones de acción */}
                <div className="mt-4 flex gap-2">
                  <Button 
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
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={saveQuotation}
                    disabled={!currentQuotation.clientName || currentQuotation.items.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cotización
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

      {/* Botón de Exportar PDF */}
      <div className="flex justify-end">
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
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

      {/* Cotizaciones Guardadas */}
      {quotations.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold text-text mb-4">Cotizaciones Guardadas</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-text">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Proyecto</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Productos</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-700">{quotation.clientName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700">{quotation.projectName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{quotation.items.length} productos</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-700">{formatInternationalCurrency(quotation.total)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}>
                        {getStatusText(quotation.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{quotation.createdAt}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generatePDF(quotation)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setShowEmailModal(true);
                          }}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
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
      )}

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
    </div>
  );
};
