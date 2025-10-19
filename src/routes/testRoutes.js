import express from 'express';
import * as testController from '../controllers/testController.js';

const router = express.Router();

// Telegram Tests
router.get('/telegram/bot-info', testController.testTelegramBot);
router.post('/telegram/send', testController.testSendTelegram);
router.post('/telegram/send-with-button', testController.testSendTelegramWithButton);

// WhatsApp Tests
router.post('/whatsapp/send', testController.testSendWhatsApp);
router.post('/whatsapp/send-with-link', testController.testSendWhatsAppWithLink);

export default router;
