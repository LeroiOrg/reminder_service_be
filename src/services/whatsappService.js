import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

class WhatsAppService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    this.client = twilio(accountSid, authToken);
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendMessage(toNumber, message) {
    try {
      // Asegurar formato correcto
      const formattedNumber = toNumber.startsWith('whatsapp:') 
        ? toNumber 
        : `whatsapp:${toNumber}`;

      const messageObj = await this.client.messages.create({
        from: this.fromNumber,
        to: formattedNumber,
        body: message
      });

      return {
        success: true,
        messageSid: messageObj.sid,
        status: messageObj.status,
        to: formattedNumber
      };
    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar mensaje con link
   */
  async sendMessageWithLink(toNumber, message, linkText, linkUrl) {
    const fullMessage = `${message}\n\n${linkText}\n${linkUrl}`;
    return this.sendMessage(toNumber, fullMessage);
  }
}

// Exportar instancia singleton
export default new WhatsAppService();
