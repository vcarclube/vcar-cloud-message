const admin = require('firebase-admin');
const path = require('path');

// Caminho para o arquivo de credenciais
const serviceAccountPath = path.join(__dirname, 'firebase-credential.json');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    // Opcional: você pode especificar o projectId aqui também
    // projectId: 'vcarclube-26a10'
  });
}

module.exports = admin;