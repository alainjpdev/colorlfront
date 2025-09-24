#!/usr/bin/env node

/**
 * Script para verificar la configuración de OAuth
 */

console.log('🔍 Verificando configuración de OAuth...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_CLIENT_SECRET'
];

console.log('📋 Variables de entorno:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: Configurada`);
  } else {
    console.log(`❌ ${envVar}: No configurada`);
  }
});

// Obtener el puerto actual
const port = process.env.PORT || 5173;
const redirectUri = `http://localhost:${port}/dashboard`;

console.log(`\n🔗 Redirect URI actual: ${redirectUri}`);

console.log('\n📝 Para configurar en Google Cloud Console:');
console.log('1. Ve a https://console.cloud.google.com/');
console.log('2. Selecciona tu proyecto');
console.log('3. Ve a APIs & Services > Credentials');
console.log('4. Edita tu OAuth 2.0 Client ID');
console.log('5. En "Authorized redirect URIs" agrega:');
console.log(`   ${redirectUri}`);
console.log('6. Guarda los cambios');

console.log('\n⚠️  Nota: Los cambios pueden tardar 5-10 minutos en aplicarse');

// Verificar si hay un archivo .env
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('\n📄 Archivo .env encontrado');
} else {
  console.log('\n⚠️  Archivo .env no encontrado');
  console.log('   Crea un archivo .env con:');
  console.log('   VITE_GOOGLE_CLIENT_ID=tu_client_id');
  console.log('   VITE_GOOGLE_CLIENT_SECRET=tu_client_secret');
}
