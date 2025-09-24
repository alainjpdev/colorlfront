# Configuración de Permisos de Google Sheets

## Error 401: Unauthorized

Si estás viendo el error `401 (Unauthorized)` al intentar acceder a Google Sheets, significa que hay un problema con los permisos.

## Soluciones

### 1. Verificar que el Google Sheet esté compartido

**Para el sheet de Cotizaciones:**
- Ve a [Google Sheets](https://sheets.google.com)
- Abre el sheet con ID: `1OkUGLzVwwafRQmdIwqE0KRWLdXS8EyWrdKkAaBWijCI`
- Haz clic en "Compartir" (botón azul en la esquina superior derecha)
- Agrega la cuenta de Google que usaste para autenticarte
- Dale permisos de "Editor" o "Lector"

### 2. Verificar que el Google Sheet sea público (para API Key)

**Si usas API Key:**
- Ve al sheet de Google Sheets
- Haz clic en "Compartir"
- Cambia la configuración a "Cualquier persona con el enlace puede ver"
- O agrega específicamente la cuenta de servicio de Google

### 3. Verificar la configuración de la API Key

**En Google Cloud Console:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**
4. Busca tu **API Key**
5. Haz clic en editar
6. En **Application restrictions**, asegúrate de que esté configurada correctamente
7. En **API restrictions**, verifica que **Google Sheets API** esté habilitada

### 4. Habilitar Google Sheets API

**En Google Cloud Console:**
1. Ve a **APIs & Services** > **Library**
2. Busca "Google Sheets API"
3. Haz clic en "Enable"

### 5. Verificar el ID del Google Sheet

**Para encontrar el ID correcto:**
- Abre el Google Sheet en tu navegador
- El ID está en la URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Copia el ID y actualiza la variable `GOOGLE_SHEET_ID` en tu código

## Configuración actual

**Sheet de Cotizaciones:**
- ID: `1OkUGLzVwwafRQmdIwqE0KRWLdXS8EyWrdKkAaBWijCI`
- Nombre: `Sheet1`

**Sheet del CRM:**
- ID: `1_Uwb2TZ8L5OB20C7NEn01YZGWyjXINRLuZ6KH9ND-yA`
- Nombre: `CRM`

## Troubleshooting

### Error persiste después de compartir
1. Espera 5-10 minutos para que los cambios se propaguen
2. Verifica que estés usando la cuenta correcta de Google
3. Intenta abrir el sheet directamente en el navegador para verificar permisos

### API Key no funciona
1. Verifica que la API Key esté configurada correctamente
2. Asegúrate de que Google Sheets API esté habilitada
3. Verifica que no haya restricciones de dominio en la API Key

### OAuth no funciona
1. Verifica que el redirect URI esté configurado correctamente
2. Asegúrate de que el scope incluya `https://www.googleapis.com/auth/spreadsheets`
3. Verifica que el sheet esté compartido con la cuenta autenticada

## Solución temporal

Si necesitas una solución rápida, puedes:

1. Hacer el Google Sheet público (cualquier persona con el enlace puede ver)
2. Usar solo API Key en lugar de OAuth
3. Verificar que la API Key tenga permisos para acceder al sheet

## Verificar configuración

Para verificar que todo esté configurado correctamente:

1. Ve a `/dashboard/test-navigation`
2. Usa el componente de prueba de autenticación
3. Verifica que puedas acceder a los sheets sin errores
4. Revisa la consola del navegador para ver los logs detallados
