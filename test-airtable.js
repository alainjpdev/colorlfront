// Script de prueba para verificar extracción de Airtable público

const AIRTABLE_PUBLIC_URL = 'https://airtable.com/appVlqKt2yB8zguhu/shrVPQxhL6xAlXBZ2';

async function testAirtableExtraction() {
  console.log('🔄 Probando extracción de Airtable público...');
  console.log('📋 URL:', AIRTABLE_PUBLIC_URL);
  
  // Probar diferentes proxies
  const proxies = [
    `https://cors-anywhere.herokuapp.com/${AIRTABLE_PUBLIC_URL}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(AIRTABLE_PUBLIC_URL)}`,
    `https://corsproxy.io/?${encodeURIComponent(AIRTABLE_PUBLIC_URL)}`,
    `https://thingproxy.freeboard.io/fetch/${AIRTABLE_PUBLIC_URL}`
  ];

  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i];
    console.log(`\n🔗 Probando proxy ${i + 1}: ${proxyUrl.split('?')[0]}...`);
    
    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const html = await response.text();
        console.log(`✅ Éxito! HTML obtenido (${html.length} caracteres)`);
        
        // Buscar datos en el HTML
        console.log('🔍 Buscando datos en el HTML...');
        
        // Buscar window.__INITIAL_STATE__
        const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
        if (initialStateMatch) {
          console.log('✅ Encontrado window.__INITIAL_STATE__');
          try {
            const state = JSON.parse(initialStateMatch[1]);
            console.log('📊 Estado inicial:', Object.keys(state));
          } catch (e) {
            console.log('❌ Error parseando estado:', e.message);
          }
        } else {
          console.log('⚠️ No se encontró window.__INITIAL_STATE__');
        }
        
        // Buscar otros patrones
        const recordMatches = html.match(/data-record-id="[^"]+"/g) || [];
        console.log(`📋 Encontrados ${recordMatches.length} data-record-id`);
        
        const tableMatches = html.match(/data-table-id="[^"]+"/g) || [];
        console.log(`📊 Encontrados ${tableMatches.length} data-table-id`);
        
        // Buscar texto que indique que es una tabla
        const tableTextMatches = html.match(/table|record|field/gi) || [];
        console.log(`🔤 Encontradas ${tableTextMatches.length} referencias a tabla/registro/campo`);
        
        // Mostrar una muestra del HTML
        console.log('📄 Muestra del HTML (primeros 500 caracteres):');
        console.log(html.substring(0, 500) + '...');
        
        return true;
      } else {
        console.log(`❌ Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error de red: ${error.message}`);
    }
  }
  
  console.log('\n❌ Todos los proxies fallaron');
  return false;
}

// Ejecutar la prueba
testAirtableExtraction().then(success => {
  if (success) {
    console.log('\n✅ Al menos un proxy funcionó');
  } else {
    console.log('\n❌ Ningún proxy funcionó');
  }
}).catch(error => {
  console.error('❌ Error general:', error);
});
