const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3004;

// Configurações de segurança
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Firebase Push Notification API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rotas Firebase - definidas diretamente no server.js para evitar problemas
app.get('/api/firebase/test', (req, res) => {
  res.json({
    message: 'Firebase API funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/firebase/enviarFirebasePushNotification', async (req, res) => {
  try {
    console.log('Recebida requisição para notificação única:', req.body);
    
    // Validação básica
    const { idSocio, title, body } = req.body;
    
    if (!idSocio || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: idSocio, title, body'
      });
    }

    // Aqui você implementaria a lógica do Firebase
    // Por enquanto, vamos simular
    res.json({
      success: true,
      message: 'Notificação enviada com sucesso (simulado)',
      idSocio: idSocio,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/firebase/enviarFirebasePushNotificationTokens', async (req, res) => {
  try {
    console.log('Recebida requisição para notificações em lote:', req.body);
    
    const { idsSocios, title, body } = req.body;
    
    if (!idsSocios || !Array.isArray(idsSocios) || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: idsSocios (array), title, body'
      });
    }

    res.json({
      success: true,
      message: 'Notificações em lote enviadas com sucesso (simulado)',
      totalTokens: idsSocios.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/firebase/enviarFirebasePushNotificationAll', async (req, res) => {
  try {
    console.log('Recebida requisição para notificação por tópico:', req.body);
    
    const { topic, title, body } = req.body;
    
    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: topic, title, body'
      });
    }

    res.json({
      success: true,
      message: 'Notificação por tópico enviada com sucesso (simulado)',
      topic: topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`🚀 Servidor Firebase API iniciado!`);
  console.log(`🚀 Porta: ${PORT}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log('🚀 ========================================');
  console.log('📱 Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/firebase/test`);
  console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotification`);
  console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotificationTokens`);
  console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotificationAll`);
  console.log('🚀 ========================================');
});

module.exports = app;