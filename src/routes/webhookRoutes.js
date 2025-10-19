import express from 'express';
import * as telegramController from '../controllers/telegramController.js';

const router = express.Router();

// Webhook de Telegram
router.post('/telegram', telegramController.handleTelegramWebhook);
router.get('/telegram/info', telegramController.getWebhookInfo);

export default router;
