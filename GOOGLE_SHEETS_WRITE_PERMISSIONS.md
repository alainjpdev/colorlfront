# Configuración de Permisos para Escribir en Google Sheets

## Error 401: No autorizado para escribir

Si recibes el error `401 Unauthorized` al intentar agregar clientes al CRM, sigue estos pasos:

### 1. Verificar Autenticación OAuth2

**Opción A: Usar OAuth2 (Recomendado)**
1. Ve a la página de Cotizaciones
2. Haz clic en "Conectar con Google" 
3. Autoriza la aplicación
4. Una vez autenticado, intenta agregar un cliente nuevamente

**Opción B: Configurar API Key con permisos de escritura**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs y servicios" > "Credenciales"
4. Edita tu API Key
5. En "Restricciones de API", asegúrate de que esté habilitada la "Google Sheets API"
6. En "Restricciones de aplicación", configura las restricciones necesarias

### 2. Compartir el Google Sheet

**Para OAuth2:**
1. Abre el Google Sheet del CRM
2. Haz clic en "Compartir" (botón azul en la esquina superior derecha)
3. Agrega el email de la cuenta de Google que usas para autenticarte
4. Asigna permisos de "Editor"
5. Guarda los cambios

**Para API Key:**
1. Abre el Google Sheet del CRM
2. Haz clic en "Compartir"
3. Cambia los permisos a "Cualquier persona con el enlace puede editar"
4. Guarda los cambios

### 3. Verificar Configuración del Sheet

Asegúrate de que:
- El Sheet ID sea correcto: `1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA`
- El nombre de la hoja sea: `CRM`
- La hoja tenga las columnas correctas en la primera fila

### 4. Estructura del Sheet CRM

La primera fila debe contener estos encabezados:
```
Empresa | Contacto | Email | Telefono | Direccion | Estado | Proyectos | Ingresos | Ultimo Contacto | Notas
```

### 5. Variables de Entorno

Verifica que tengas configuradas estas variables en tu archivo `.env`:

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
VITE_GOOGLE_API_KEY=tu_api_key_aqui
VITE_GOOGLE_SHEET_ID=1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA
```

### 6. Solución de Problemas

**Si sigues teniendo problemas:**

1. **Verifica la consola del navegador** para ver los logs detallados
2. **Prueba primero con OAuth2** antes de usar API Key
3. **Asegúrate de que el Google Sheet esté compartido** con la cuenta correcta
4. **Verifica que la Google Sheets API esté habilitada** en tu proyecto de Google Cloud

### 7. Logs de Diagnóstico

La aplicación ahora muestra logs detallados en la consola:
- 🔄 Agregando nuevo cliente al CRM...
- 📋 Datos del cliente: [datos]
- 🔑 OAuth2 autenticado: true/false
- 🔗 URL de append: [URL]
- 📡 Respuesta del servidor: [status]

Revisa estos logs para identificar exactamente dónde está el problema.

## Contacto

Si necesitas ayuda adicional, revisa los logs de la consola del navegador y comparte la información de error específica.
