const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5001;

require('dotenv').config();

// Настройка CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Обработчик для отправки сообщений через WhatsApp
app.post('/send-whatsapp', async (req, res) => {
    const { to, message } = req.body;
    console.log('Received request:', { to, message });
    try {
        const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            to: to,
            body: message,
            typing_time: 0,
            channel: "DRSTRG-6DCWB"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('WhatsApp API response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Ошибка при отправке сообщения WhatsApp:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
