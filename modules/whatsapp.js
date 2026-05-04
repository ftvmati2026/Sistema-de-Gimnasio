import TWILIO_CONFIG from '../config/secrets.js';

/**
 * Función para enviar mensajes de WhatsApp a través de la API de Twilio.
 * @param {string} to - Número de destino (ej: +54911...)
 * @param {string} body - Contenido del mensaje
 */
export async function enviarWhatsAppIA(to, body) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`;
    
    // Formatear el número de destino para WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to}`;
    
    const auth = btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`);
    
    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', TWILIO_CONFIG.fromNumber);
    params.append('Body', body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ WhatsApp enviado con éxito:', data.sid);
            return { success: true, sid: data.sid };
        } else {
            console.error('❌ Error de Twilio:', data.message);
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return { success: false, error: 'Error de conexión con el servidor' };
    }
}
