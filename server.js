const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Importar controller
const FirebaseController = require('./controllers/firebaseController');
const firebaseController = new FirebaseController();

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Firebase Push Notification API com SQL Server',
    version: '1.0.0',
    status: 'online',
    database: db.isConnected() ? 'conectado' : 'desconectado',
    timestamp: new Date().toISOString()
  });
});

// Rotas Firebase
app.get('/api/firebase/test', (req, res) => {
  res.json({
    message: 'Firebase API funcionando!',
    database: db.isConnected() ? 'conectado' : 'desconectado',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/firebase/test-db', 
  firebaseController.testeConexaoBanco.bind(firebaseController)
);

app.post('/api/firebase/enviarFirebasePushNotification', 
  firebaseController.enviarFirebasePushNotification.bind(firebaseController)
);

app.post('/api/firebase/enviarFirebasePushNotificationTokens', 
  firebaseController.enviarFirebasePushNotificationTokens.bind(firebaseController)
);

app.post('/api/firebase/enviarFirebasePushNotificationAll', 
  firebaseController.enviarFirebasePushNotificationAll.bind(firebaseController)
);

app.post('/api/firebase/enviarFirebasePushNotificationVeiculo', 
  firebaseController.enviarFirebasePushNotificationVeiculo.bind(firebaseController)
);

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

// Inicializar conexão com banco e servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await db.connect();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log(`🚀 Servidor Firebase API iniciado!`);
      console.log(`🚀 Porta: ${PORT}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 Banco: ${db.isConnected() ? '✓ Conectado' : '✗ Desconectado'}`);
      console.log('🚀 ========================================');
      console.log('📱 Endpoints:');
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/api/firebase/test`);
      console.log(`   GET  http://localhost:${PORT}/api/firebase/test-db`);
      console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotification`);
      console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotificationTokens`);
      console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotificationAll`);
      console.log(`   POST http://localhost:${PORT}/api/firebase/enviarFirebasePushNotificationVeiculo`);
      console.log('🚀 ========================================');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, fechando servidor...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, fechando servidor...');
  await db.disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;