# Configuración de Google OAuth 2.0

## Error: redirect_uri_mismatch

Si estás viendo el error `redirect_uri_mismatch`, necesitas configurar correctamente los redirect URIs en Google Cloud Console.

## Pasos para resolver el error:

### 1. Ir a Google Cloud Console
- Ve a [Google Cloud Console](https://console.cloud.google.com/)
- Selecciona tu proyecto

### 2. Configurar OAuth 2.0
- Ve a **APIs & Services** > **Credentials**
- Busca tu **OAuth 2.0 Client ID** (el que estás usando en la aplicación)
- Haz clic en el ícono de editar (lápiz)

### 3. Agregar Redirect URIs
En la sección **Authorized redirect URIs**, agrega:

**Para desarrollo local:**
```
http://localhost:5173/dashboard
http://localhost:5174/dashboard
http://localhost:3000/dashboard
```

**Para producción:**
```
https://tu-dominio.com/dashboard
```

### 4. Guardar cambios
- Haz clic en **Save**
- Los cambios pueden tardar unos minutos en aplicarse

## Verificar la configuración actual

Para ver qué redirect URI está usando tu aplicación:

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la consola
3. Intenta autenticarte con Google
4. Verás un log que dice: `🔗 Redirect URI: http://localhost:XXXX/dashboard`

## Puertos comunes de desarrollo

- **Vite**: `http://localhost:5173`
- **Create React App**: `http://localhost:3000`
- **Next.js**: `http://localhost:3000`
- **Vue CLI**: `http://localhost:8080`

## Solución temporal

Si necesitas una solución rápida, puedes:

1. Detener el servidor de desarrollo
2. Cambiar el puerto en `vite.config.ts`:
   ```typescript
   export default defineConfig({
     server: {
       port: 5174
     }
   })
   ```
3. Reiniciar el servidor

## Verificar que funciona

Después de configurar los redirect URIs:

1. Ve a `/dashboard/test-navigation`
2. Haz clic en "Conectar con Google"
3. Deberías ser redirigido a Google sin errores
4. Después de autorizar, serás redirigido de vuelta a tu aplicación

## Troubleshooting

### Error persiste después de configurar
- Espera 5-10 minutos para que los cambios se propaguen
- Verifica que el redirect URI coincida exactamente (incluyendo http/https)
- Asegúrate de que no haya espacios extra en la configuración

### Múltiples puertos
Es recomendable agregar todos los puertos que uses durante el desarrollo para evitar este problema en el futuro.
