import emailjs from '@emailjs/browser';
import { db } from '../firebase-setup';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Sends an email using EmailJS and IDs stored in Firestore Admin Settings.
 * @param {string} templateType - 'otp' or 'multi'
 * @param {object} params - Key-value pairs for the template
 */
export const sendEmail = async (templateType, params) => {
    try {
        // 1. Fetch Config from Firestore
        const platformRef = doc(db, 'admin_set', 'platform');
        const platformSnap = await getDoc(platformRef);

        if (!platformSnap.exists()) {
            console.error("Email Config missing in Settings!");
            return { success: false, error: "Config Missing" };
        }

        const config = platformSnap.data();
        const serviceId = config.emailjsServiceId;
        const publicKey = config.emailjsPublicKey;

        // Parse dynamic templates
        const templates = (config.emailjsTemplates || '').split(',').map(id => id.trim()).filter(id => id);
        const templateId = templateType === 'otp' ? templates[0] : templates[1];

        console.log(`[EmailService] Sending "${templateType}" email using TemplateID: ${templateId}`);
        console.log(`[EmailService] Parameters:`, params);

        if (!serviceId || !templateId || !publicKey) {
            console.error("EmailJS Keys missing!");
            return { success: false, error: "Keys Missing" };
        }

        // 2. Send via EmailJS
        const result = await emailjs.send(serviceId, templateId, params, publicKey);
        console.log("Email sent successfully:", result.text);
        return { success: true, text: result.text };
    } catch (error) {
        console.error("Email send failed:", error);
        return { success: false, error: error.text || error.message };
    }
};
