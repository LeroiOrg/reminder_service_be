/**
 * Test de funcionalidad real - reminder_service_be con Firestore
 */
import firestoreConnection from './src/mongodb/firestoreConnection.js';
import userNotificationSettingsService from './src/mongodb/userNotificationSettingsService.js';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const testUsers = [
  'test_telegram@example.com',
  'test_whatsapp@example.com',
  'test_both@example.com'
];

function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(text);
  console.log('='.repeat(60));
}

async function test_1_connect() {
  printHeader('🧪 TEST 1: Conexión a Firestore');
  
  try {
    await firestoreConnection.connect();
    console.log(`${colors.green}✅ Conexión establecida${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_2_link_telegram() {
  printHeader('🧪 TEST 2: Vincular Telegram');
  
  try {
    const userEmail = testUsers[0];
    const chatId = '123456789';
    
    await userNotificationSettingsService.linkTelegram(userEmail, chatId);
    
    // Verificar que se guardó
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings && settings.telegram.chatId === chatId) {
      console.log(`${colors.green}✅ Telegram vinculado correctamente${colors.reset}`);
      console.log(`   User: ${userEmail}`);
      console.log(`   ChatId: ${settings.telegram.chatId}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se guardó correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_3_link_whatsapp() {
  printHeader('🧪 TEST 3: Vincular WhatsApp');
  
  try {
    const userEmail = testUsers[1];
    const phoneNumber = '+573001234567';
    
    await userNotificationSettingsService.linkWhatsApp(userEmail, phoneNumber);
    
    // Verificar que se guardó
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings && settings.whatsapp.number === phoneNumber) {
      console.log(`${colors.green}✅ WhatsApp vinculado correctamente${colors.reset}`);
      console.log(`   User: ${userEmail}`);
      console.log(`   Phone: ${settings.whatsapp.number}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se guardó correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_4_link_both() {
  printHeader('🧪 TEST 4: Vincular Telegram y WhatsApp al mismo usuario');
  
  try {
    const userEmail = testUsers[2];
    const chatId = '987654321';
    const phoneNumber = '+573007654321';
    
    await userNotificationSettingsService.linkTelegram(userEmail, chatId);
    await userNotificationSettingsService.linkWhatsApp(userEmail, phoneNumber);
    
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings && settings.telegram.enabled && settings.whatsapp.enabled) {
      console.log(`${colors.green}✅ Ambos canales vinculados${colors.reset}`);
      console.log(`   Telegram: ${settings.telegram.chatId}`);
      console.log(`   WhatsApp: ${settings.whatsapp.number}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se vincularon ambos canales${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_5_find_by_chatid() {
  printHeader('🧪 TEST 5: Buscar usuario por Chat ID');
  
  try {
    const chatId = '123456789';
    const user = await userNotificationSettingsService.findByChatId(chatId);
    
    if (user && user.userEmail === testUsers[0]) {
      console.log(`${colors.green}✅ Usuario encontrado por ChatId${colors.reset}`);
      console.log(`   Email: ${user.userEmail}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Usuario no encontrado${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_6_find_by_whatsapp() {
  printHeader('🧪 TEST 6: Buscar usuario por WhatsApp');
  
  try {
    const phoneNumber = '+573001234567';
    const user = await userNotificationSettingsService.findByWhatsAppNumber(phoneNumber);
    
    if (user && user.userEmail === testUsers[1]) {
      console.log(`${colors.green}✅ Usuario encontrado por WhatsApp${colors.reset}`);
      console.log(`   Email: ${user.userEmail}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Usuario no encontrado${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_7_update_reminder_settings() {
  printHeader('🧪 TEST 7: Actualizar configuración de recordatorios');
  
  try {
    const userEmail = testUsers[0];
    
    await userNotificationSettingsService.updateReminderSettings(userEmail, {
      frequency: 'weekly',
      time: '10:00',
      activeRoadmapTopic: 'Python Basics'
    });
    
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings.reminderSettings.frequency === 'weekly' &&
        settings.reminderSettings.time === '10:00' &&
        settings.reminderSettings.activeRoadmapTopic === 'Python Basics') {
      console.log(`${colors.green}✅ Recordatorios actualizados${colors.reset}`);
      console.log(`   Frecuencia: ${settings.reminderSettings.frequency}`);
      console.log(`   Hora: ${settings.reminderSettings.time}`);
      console.log(`   Topic: ${settings.reminderSettings.activeRoadmapTopic}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se actualizaron correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_8_update_preferred_channel() {
  printHeader('🧪 TEST 8: Actualizar canal preferido');
  
  try {
    const userEmail = testUsers[2];
    
    await userNotificationSettingsService.updatePreferredChannel(userEmail, 'both');
    
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings.preferredChannel === 'both') {
      console.log(`${colors.green}✅ Canal preferido actualizado${colors.reset}`);
      console.log(`   Canal: ${settings.preferredChannel}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se actualizó correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_9_get_users_with_reminders() {
  printHeader('🧪 TEST 9: Obtener usuarios con recordatorios activos');
  
  try {
    const users = await userNotificationSettingsService.getAllUsersWithRemindersEnabled();
    
    console.log(`${colors.green}✅ Query ejecutado${colors.reset}`);
    console.log(`   Usuarios con recordatorios activos: ${users.length}`);
    
    if (users.length > 0) {
      console.log(`   Ejemplo: ${users[0].userEmail}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_10_unlink_telegram() {
  printHeader('🧪 TEST 10: Desvincular Telegram');
  
  try {
    const userEmail = testUsers[0];
    
    await userNotificationSettingsService.unlinkTelegram(userEmail);
    
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings.telegram.enabled === false && settings.telegram.chatId === null) {
      console.log(`${colors.green}✅ Telegram desvinculado${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se desvinculó correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_11_unlink_whatsapp() {
  printHeader('🧪 TEST 11: Desvincular WhatsApp');
  
  try {
    const userEmail = testUsers[1];
    
    await userNotificationSettingsService.unlinkWhatsApp(userEmail);
    
    const settings = await userNotificationSettingsService.getUserSettings(userEmail);
    
    if (settings.whatsapp.enabled === false && settings.whatsapp.number === null) {
      console.log(`${colors.green}✅ WhatsApp desvinculado${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ No se desvinculó correctamente${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function test_12_cleanup() {
  printHeader('🧪 TEST 12: Limpiar datos de prueba');
  
  try {
    let deleted = 0;
    
    for (const userEmail of testUsers) {
      await userNotificationSettingsService.deleteUserSettings(userEmail);
      deleted++;
    }
    
    console.log(`${colors.green}✅ Usuarios eliminados: ${deleted}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '🔥'.repeat(30));
  console.log('TESTS DE FUNCIONALIDAD REAL - REMINDER_SERVICE_BE');
  console.log('🔥'.repeat(30));

  const tests = [
    test_1_connect,
    test_2_link_telegram,
    test_3_link_whatsapp,
    test_4_link_both,
    test_5_find_by_chatid,
    test_6_find_by_whatsapp,
    test_7_update_reminder_settings,
    test_8_update_preferred_channel,
    test_9_get_users_with_reminders,
    test_10_unlink_telegram,
    test_11_unlink_whatsapp,
    test_12_cleanup
  ];

  const results = [];
  for (const test of tests) {
    const result = await test();
    results.push(result);
  }

  // Resumen
  printHeader('📊 RESUMEN FINAL');
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`${colors.green}✅ Tests exitosos: ${passed}/${total}${colors.reset}`);
  console.log(`${colors.red}❌ Tests fallidos: ${total - passed}/${total}${colors.reset}`);

  if (passed === total) {
    console.log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON!${colors.reset}`);
    console.log(`${colors.green}✅ reminder_service_be está listo para usar Firestore${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Algunos tests fallaron${colors.reset}`);
  }

  console.log('='.repeat(60) + '\n');

  await firestoreConnection.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch(error => {
  console.error(`${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
