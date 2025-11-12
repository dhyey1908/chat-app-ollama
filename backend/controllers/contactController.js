const { sendContactMessage } = require('../service/contactService');

exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        const result = await sendContactMessage(name, email, message);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (err) {
        console.error('Unexpected error in controller:', err);
        return res.status(500).json({
            success: false,
            error: 'An unexpected error occurred while sending your message.',
        });
    }
};