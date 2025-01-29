import wbm from 'wbm'

const sendWhatsAppMessage = async ({ mobileNo, message }) => {
    try {
        console.log("mobile number ", mobileNo);
        
        await wbm.start();
        const phones = [`${mobileNo}`];
        await wbm.send(phone, message);
        await wbm.end();
    } catch (err) {
        console.error('Error sending WhatsApp message:', err);
    }
};

export default sendWhatsAppMessage;
