const { getTemplate, fillTemplate } = require('../config/i18n');

/**
 * Send WhatsApp Message
 * Currently a MOCK implementation logging to console.
 * @param {string} to - Phone number
 * @param {string} templateKey - Key in i18n
 * @param {object} data - Data to fill
 * @param {string} lang - Language code
 */
const sendWhatsApp = async (to, templateKey, data, lang = 'en') => {
    try {
        const template = getTemplate(lang, templateKey);
        const message = fillTemplate(template, data);

        // MOCK SEND
        console.log('==================================================');
        console.log(`[WHATSAPP MOCK] To: ${to}`);
        console.log(`[MESSAGE] ${message}`);
        console.log('==================================================');

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        return false;
    }
};

module.exports = { sendWhatsApp };
