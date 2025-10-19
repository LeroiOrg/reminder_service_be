import express from 'express';
import { handleWhatsAppWebhook } from '../controllers/whatsappController.js';

const router = express.Router();

/**
 * Webhook de WhatsApp (Twilio)
 */
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;
