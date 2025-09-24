# Solución de Problemas: Error 401 al Agregar Clientes al CRM

## 🔍 **Diagnóstico del Error 401**

Si recibes el error: `❌ Error al agregar cliente: No autorizado para escribir en este Google Sheet`

### **Paso 1: Verificar Autenticación**

1. **Ve a la página de Cotizaciones**
2. **¿Ves el botón "Reconectar Google" (naranja)?**
   - **SÍ**: Haz clic en él y autoriza nuevamente
   - **NO**: Haz clic en "Conectar con Google" (azul)

3. **Después de autorizar**, intenta agregar un cliente nuevamente

### **Paso 2: Verificar el Google Sheet**

1. **Abre el Google Sheet del CRM**:
   - https://docs.google.com/spreadsheets/d/1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA

2. **Haz clic en "Compartir"** (botón azul)

3. **Cambia los permisos a**:
   - **"Cualquier persona con el enlace puede editar"**
   - O agrega tu email de Google con permisos de "Editor"

4. **Guarda los cambios**

### **Paso 3: Verificar Logs en la Consola**

1. **Abre la consola del navegador** (F12)
2. **Intenta agregar un cliente**
3. **Revisa los logs**:

```
🔄 Agregando nuevo cliente al CRM...
📋 Datos del cliente: [datos]
🔑 OAuth2 autenticado: true/false
🔑 Usando OAuth2/API Key para agregar cliente
🔗 URL de append: [URL]
📊 Datos a enviar: [array]
📡 Respuesta del servidor: [status]
```

### **Paso 4: Soluciones por Tipo de Error**

#### **Si `OAuth2 autenticado: false`**
- Haz clic en **"Reconectar Google"**
- Autoriza la aplicación
- Intenta nuevamente

#### **Si `OAuth2 autenticado: true` pero sigue el error**
- El Google Sheet no está compartido correctamente
- Sigue el **Paso 2** para compartir el sheet

#### **Si `Usando API Key para agregar cliente`**
- La API Key no tiene permisos de escritura
- Usa OAuth2 en su lugar (haz clic en "Reconectar Google")

### **Paso 5: Verificar Configuración de Google Cloud Console**

1. **Ve a**: https://console.cloud.google.com/
2. **"APIs y servicios" > "Pantalla de consentimiento de OAuth"**
3. **Verifica que tengas estos scopes**:
   - ✅ `https://www.googleapis.com/auth/spreadsheets`
   - ✅ `https://www.googleapis.com/auth/drive.file`

### **Paso 6: Solución Definitiva**

Si nada funciona, sigue estos pasos en orden:

1. **Reconectar con Google**:
   - Haz clic en "Reconectar Google"
   - Autoriza todos los permisos

2. **Compartir el Google Sheet**:
   - Cambia a "Cualquier persona con el enlace puede editar"

3. **Verificar en la consola**:
   - Debe mostrar `OAuth2 autenticado: true`
   - Debe mostrar `Usando OAuth2 para agregar cliente`

4. **Intentar agregar cliente**:
   - Debe mostrar `✅ Cliente agregado exitosamente`

### **Paso 7: Contacto**

Si sigues teniendo problemas:
1. **Copia los logs de la consola**
2. **Indica qué pasos ya intentaste**
3. **Menciona si ves el botón "Reconectar Google"**

## ✅ **Verificación Final**

Después de seguir todos los pasos, deberías ver:
- ✅ Botón "Reconectar Google" visible
- ✅ `OAuth2 autenticado: true` en la consola
- ✅ `Usando OAuth2 para agregar cliente` en la consola
- ✅ `✅ Cliente agregado exitosamente` al agregar un cliente
