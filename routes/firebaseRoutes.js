const express = require('express');
const FirebaseController = require('../controllers/firebaseController');

const router = express.Router();
const firebaseController = new FirebaseController();

// Middleware para log de requisições
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Rotas específicas primeiro (ordem importa)
router.post('/enviarFirebasePushNotification', async (req, res) => {
  try {
    await firebaseController.enviarFirebasePushNotification(req, res);
  } catch (error) {
    console.error('Erro na rota enviarFirebasePushNotification:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/enviarFirebasePushNotificationTokens', async (req, res) => {
  try {
    await firebaseController.enviarFirebasePushNotificationTokens(req, res);
  } catch (error) {
    console.error('Erro na rota enviarFirebasePushNotificationTokens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/enviarFirebasePushNotificationAll', async (req, res) => {
  try {
    await firebaseController.enviarFirebasePushNotificationAll(req, res);
  } catch (error) {
    console.error('Erro na rota enviarFirebasePushNotificationAll:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de teste
router.get('/test', (req, res) => {
  res.json({
    message: 'Firebase Push Notification API está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;