import axios from 'axios';

async function testEndpoint() {
  try {
    console.log('🧪 Probando endpoint de roadmaps...\n');
    
    const response = await axios.get(
      'http://127.0.0.1:8080/learning_path/roadmaps/user/user@example.com',
      {
        params: { limit: 20 },
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'internal_service_key_123'
        }
      }
    );

    console.log('✅ Respuesta del endpoint:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`\n📚 Roadmaps encontrados: ${response.data.count}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📋 Lista:');
        response.data.data.forEach((conv, i) => {
          console.log(`${i + 1}. ${conv.prompt}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testEndpoint();
