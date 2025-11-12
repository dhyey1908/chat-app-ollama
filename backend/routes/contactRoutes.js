const expreess = require('express');
const { sendContactMessage } = require('../controllers/contactController');

const router = expreess.Router();

router.post('/send', sendContactMessage);

module.exports = router;