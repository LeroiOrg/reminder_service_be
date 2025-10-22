import { initializeMongoDB, userNotificationSettingsService, mongoConnection } from '../mongodb/index.js';

/**
 * Script de prueba para la colección user_notification_settings
 */
async function testUserNotificationSettings() {
  console.log('🧪 Iniciando test de UserNotificationSettings...\n');

  try {
    // 1. Inicializar MongoDB
    console.log('📝 Paso 1: Inicializar MongoDB');
    await initializeMongoDB();
    console.log('');

    // 2. Crear un usuario de prueba
    const testEmail = 'test@leroi.com';
    console.log(`📝 Paso 2: Vincular Telegram para ${testEmail}`);
    await userNotificationSettingsService.linkTelegram(testEmail, '123456789');
    console.log('');

    // 3. Obtener configuración del usuario
    console.log(`📝 Paso 3: Obtener settings de ${testEmail}`);
    let settings = await userNotificationSettingsService.getUserSettings(testEmail);
    console.log('Settings obtenidos:', JSON.stringify(settings, null, 2));
    console.log('');

    // 4. Vincular WhatsApp
    console.log(`📝 Paso 4: Vincular WhatsApp para ${testEmail}`);
    await userNotificationSettingsService.linkWhatsApp(testEmail, '+573001234567');
    console.log('');

    // 5. Actualizar canal preferido
    console.log(`📝 Paso 5: Actualizar canal preferido a 'both'`);
    await userNotificationSettingsService.updatePreferredChannel(testEmail, 'both');
    console.log('');

    // 6. Actualizar recordatorios
    console.log(`📝 Paso 6: Actualizar configuración de recordatorios`);
    await userNotificationSettingsService.updateReminderSettings(testEmail, {
      frequency: 'weekly',
      time: '10:30',
      activeRoadmapTopic: 'Machine Learning'
    });
    console.log('');

    // 7. Verificar cambios
    console.log(`📝 Paso 7: Verificar todos los cambios`);
    settings = await userNotificationSettingsService.getUserSettings(testEmail);
    console.log('Settings actualizados:', JSON.stringify(settings, null, 2));
    console.log('');

    // 8. Buscar por chatId
    console.log(`📝 Paso 8: Buscar usuario por chatId`);
    const userByChatId = await userNotificationSettingsService.findByChatId('123456789');
    console.log('Usuario encontrado por chatId:', userByChatId ? userByChatId.userEmail : 'No encontrado');
    console.log('');

    // 9. Buscar por WhatsApp
    console.log(`📝 Paso 9: Buscar usuario por número de WhatsApp`);
    const userByWhatsApp = await userNotificationSettingsService.findByWhatsAppNumber('+573001234567');
    console.log('Usuario encontrado por WhatsApp:', userByWhatsApp ? userByWhatsApp.userEmail : 'No encontrado');
    console.log('');

    // 10. Desvincular Telegram
    console.log(`📝 Paso 10: Desvincular Telegram`);
    await userNotificationSettingsService.unlinkTelegram(testEmail);
    settings = await userNotificationSettingsService.getUserSettings(testEmail);
    console.log('Telegram enabled:', settings.telegram.enabled);
    console.log('');

    // 11. Limpiar - eliminar usuario de prueba
    console.log(`📝 Paso 11: Eliminar usuario de prueba`);
    await userNotificationSettingsService.deleteUserSettings(testEmail);
    console.log('');

    console.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE!\n');

  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    // Cerrar conexión
    await mongoConnection.disconnect();
    process.exit(0);
  }
}

// Ejecutar test
testUserNotificationSettings();
