# Integración con Google Sheets - ColorLand

## 🚀 Nueva Funcionalidad: Conexión Automática

Hemos implementado una integración mejorada con Google Sheets que permite conexión automática sin requerir autenticación manual del usuario.

## 📋 Características

### ✅ **Conexión Automática**
- No requiere login manual del usuario
- Conexión persistente y confiable
- Ideal para aplicaciones de producción

### ✅ **Gestión Completa de Tareas**
- Crear, leer, actualizar y eliminar tareas
- Sincronización en tiempo real con Google Sheets
- Gestión de encargados y prioridades

### ✅ **Interfaz Mejorada**
- Diseño limpio y moderno
- Filtros y búsqueda avanzada
- Estados de carga y mensajes informativos

## 🛠️ Configuración Rápida

### Opción 1: Script Automático (Recomendado)

```bash
npm run setup-google
```

Este script te guiará paso a paso para configurar todas las variables necesarias.

### Opción 2: Configuración Manual

1. **Crear Service Account en Google Cloud Console**
2. **Configurar variables de entorno en `.env`:**

```env
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
VITE_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
VITE_TODO_SHEET_ID=tu_google_sheet_id
```

3. **Compartir Google Sheet con el Service Account**

## 📊 Estructura del Google Sheet

Tu Google Sheet debe tener estas columnas en la primera fila:

| A (ID) | B (Title) | C (Description) | D (Completed) | E (Priority) | F (Due Date) | G (Assigned To) | H (Notes) | I (Created At) | J (Updated At) |
|--------|-----------|-----------------|---------------|--------------|--------------|-----------------|-----------|----------------|----------------|
| todo_1 | Tarea 1   | Descripción     | FALSE         | medium       | 2024-01-01   | Usuario 1       | Notas     | 2024-01-01     | 2024-01-01     |

## 🔗 Rutas Disponibles

- **`/dashboard/todo`** - Versión original con OAuth2
- **`/dashboard/todo-service`** - Nueva versión con Service Account (Recomendada)

## 🎯 Migración

### Para usar la nueva versión:

1. **Configura el Service Account** siguiendo los pasos anteriores
2. **Actualiza el menú** para apuntar a `/dashboard/todo-service`
3. **Prueba la funcionalidad** para asegurar que todo funciona
4. **Opcionalmente**, puedes remover la ruta antigua

### Actualizar el menú dinámico:

1. Ve a "Gestión de Menús" en el dashboard
2. Edita el elemento "To Do"
3. Cambia la URL de `/dashboard/todo` a `/dashboard/todo-service`
4. Guarda los cambios

## 🔧 Desarrollo

### Archivos Principales

- `src/services/googleSheetsService.ts` - Servicio principal de Google Sheets
- `src/pages/dashboard/TodoServiceAccount.tsx` - Componente de interfaz
- `scripts/setup-google-service-account.js` - Script de configuración

### Dependencias

- `googleapis` - Cliente oficial de Google APIs
- `@dnd-kit/*` - Para drag and drop (si se implementa)

## 🚨 Troubleshooting

### Error: "Service Account credentials not configured"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que la clave privada esté en el formato correcto

### Error: "The caller does not have permission"
- Verifica que el Service Account tenga acceso al Google Sheet
- Asegúrate de que el email del Service Account esté agregado como editor

### Error: "Spreadsheet not found"
- Verifica que el `VITE_TODO_SHEET_ID` sea correcto
- Asegúrate de que el Service Account tenga acceso al Sheet

## 🔒 Seguridad

- Las credenciales del Service Account están en variables de entorno
- Nunca subas el archivo `.env` a Git
- Para producción, configura las variables en tu plataforma de hosting

## 📈 Ventajas sobre OAuth2

| Característica | OAuth2 | Service Account |
|----------------|--------|----------------|
| Conexión | Manual | Automática |
| Persistencia | Temporal | Permanente |
| Configuración | Compleja | Simple |
| Escalabilidad | Limitada | Alta |
| Seguridad | Buena | Excelente |

## 🎉 ¡Listo!

Una vez configurado, tendrás una integración perfecta con Google Sheets que funciona de manera automática y confiable. ¡No más problemas de autenticación!
