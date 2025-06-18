const express = require('express');
const app = express();
const PORT = 3004;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de teste funcionando!' });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Rota de teste OK!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
});