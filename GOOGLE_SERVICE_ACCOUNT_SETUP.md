# Configuración de Google Service Account para Conexión Automática

## ¿Por qué usar Service Account?

El Service Account permite que la aplicación se conecte automáticamente a Google Sheets sin requerir autenticación manual del usuario. Esto es ideal para aplicaciones que necesitan acceso persistente a los datos.

## Pasos para Configurar Service Account

### 1. Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google Sheets API:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API"
   - Haz clic en "Enable"

### 2. Crear Service Account

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "Service Account"
3. Completa los detalles:
   - **Name**: `colorland-sheets-service`
   - **Description**: `Service account for ColorLand Google Sheets integration`
4. Haz clic en "Create and Continue"
5. En "Grant this service account access to project":
   - Role: `Editor` (o un rol más específico si lo prefieres)
6. Haz clic en "Done"

### 3. Generar Clave Privada

1. En la lista de Service Accounts, haz clic en el que acabas de crear
2. Ve a la pestaña "Keys"
3. Haz clic en "Add Key" > "Create new key"
4. Selecciona "JSON" y haz clic en "Create"
5. Se descargará un archivo JSON con las credenciales

### 4. Compartir Google Sheet con Service Account

1. Abre tu Google Sheet
2. Haz clic en "Share" (Compartir)
3. Agrega el email del Service Account (encontrado en el archivo JSON como `client_email`)
4. Dale permisos de "Editor"
5. Haz clic en "Send"

### 5. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Google Service Account (para conexión automática)
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
VITE_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"

# Google Sheet ID
VITE_TODO_SHEET_ID=tu_google_sheet_id_aqui
```

### 6. Estructura del Google Sheet

Tu Google Sheet debe tener estas columnas en la primera fila:

| A (ID) | B (Title) | C (Description) | D (Completed) | E (Priority) | F (Due Date) | G (Assigned To) | H (Notes) | I (Created At) | J (Updated At) |
|--------|-----------|-----------------|---------------|--------------|--------------|-----------------|-----------|----------------|----------------|
| todo_1 | Tarea 1   | Descripción     | FALSE         | medium       | 2024-01-01   | Usuario 1       | Notas     | 2024-01-01     | 2024-01-01     |

## Ventajas del Service Account

✅ **Conexión automática**: No requiere autenticación manual
✅ **Persistente**: La conexión se mantiene siempre activa
✅ **Seguro**: Las credenciales están en el servidor, no en el cliente
✅ **Escalable**: Funciona para múltiples usuarios sin configuración individual

## Migración desde OAuth2

Si ya tienes OAuth2 configurado, puedes migrar gradualmente:

1. Configura el Service Account
2. Actualiza el código para usar el nuevo servicio
3. Mantén OAuth2 como fallback si es necesario
4. Una vez que todo funcione, puedes remover OAuth2

## Troubleshooting

### Error: "Service Account credentials not configured"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que la clave privada esté en el formato correcto (con `\n` para saltos de línea)

### Error: "The caller does not have permission"
- Verifica que el Service Account tenga acceso al Google Sheet
- Asegúrate de que el email del Service Account esté agregado como editor en el Sheet

### Error: "Spreadsheet not found"
- Verifica que el `VITE_TODO_SHEET_ID` sea correcto
- Asegúrate de que el Service Account tenga acceso al Sheet
