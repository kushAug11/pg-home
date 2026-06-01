/**
 * Internationalization (i18n) Configuration
 * Stores templates for Email and SMS in multiple languages.
 */

const templates = {
    en: {
        setupEmailSubject: "Welcome to {PG_NAME} – Your Tenant Login Details",
        setupEmailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Welcome to {PG_NAME}!</h2>
                <p>Hi <strong>{TENANT_NAME}</strong>,</p>
                <p>Welcome to {PG_NAME} 👋</p>
                <p>Your tenant account has been created by the hostel management. You can now access your dashboard to view rent details, payments, and raise requests.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{ACTIVATION_LINK}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Set Password & Activate</a>
                </div>

                <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📧 Login Email:</strong> {TENANT_EMAIL}</p>
                </div>

                <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; color: #92400E; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
                    <strong>⏳ Note:</strong> For security reasons, this link will expire in {LINK_EXPIRY_TIME}.
                </div>

                <p style="font-size: 14px; color: #666;">If you did not expect this email, please ignore it.</p>
                <p style="margin-top: 30px;">Thanks,<br/>{PG_NAME} Team</p>
            </div>
        `,
        smsBody: "Welcome to {PG_NAME}! Your tenant account is ready. Activate here: {SHORT_LINK}. If not expected, ignore this message."
    },
    hi: {
        setupEmailSubject: "{PG_NAME} में आपका स्वागत है – आपकी लॉगिन जानकारी",
        setupEmailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">{PG_NAME} में आपका स्वागत है!</h2>
                <p>नमस्ते <strong>{TENANT_NAME}</strong>,</p>
                <p>{PG_NAME} में आपका स्वागत है 👋</p>
                <p>आपका किरायेदार खाता हॉस्टल प्रबंधन द्वारा बनाया गया है। अब आप किराया विवरण, भुगतान देखने और अनुरोध करने के लिए अपने डैशबोर्ड तक पहुँच सकते हैं।</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{ACTIVATION_LINK}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">पासवर्ड सेट करें और सक्रिय करें</a>
                </div>

                <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📧 लॉगिन ईमेल:</strong> {TENANT_EMAIL}</p>
                </div>

                <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; color: #92400E; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
                    <strong>⏳ ध्यान दें:</strong> सुरक्षा कारणों से, यह लिंक {LINK_EXPIRY_TIME} में समाप्त हो जाएगा।
                </div>

                <p style="font-size: 14px; color: #666;">यदि आपको यह ईमेल अपेक्षित नहीं है, तो कृपया इसे अनदेखा करें।</p>
                <p style="margin-top: 30px;">धन्यवाद,<br/>{PG_NAME} टीम</p>
            </div>
        `,
        smsBody: "{PG_NAME} में आपका स्वागत है! आपका खाता तैयार है। यहाँ सक्रिय करें: {SHORT_LINK}. यदि अपेक्षित नहीं है, तो अनदेखा करें।"
    }
};

/**
 * Get Template
 * @param {string} lang - Language Code (en, hi)
 * @param {string} type - Template Type (setupEmailSubject, setupEmailBody, smsBody)
 * @returns {string} Template string
 */
const getTemplate = (lang, type) => {
    const selectedLang = templates[lang] ? lang : 'en'; // Fallback to English
    return templates[selectedLang][type] || templates['en'][type];
};

/**
 * Fill Template with Data
 * @param {string} template - The raw template string
 * @param {object} data - Key-value pairs to replace
 * @returns {string} Filled string
 */
const fillTemplate = (template, data) => {
    let output = template;
    for (const key in data) {
        output = output.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return output;
};

module.exports = { getTemplate, fillTemplate };
