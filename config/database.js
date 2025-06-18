const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'vCarClube',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  async connect() {
    try {
      if (!this.connected) {
        console.log('Conectando ao SQL Server...');
        this.pool = await sql.connect(dbConfig);
        this.connected = true;
        console.log('✓ Conectado ao SQL Server com sucesso');
        
        // Event listeners
        this.pool.on('error', (err) => {
          console.error('Erro na conexão com o banco:', err);
          this.connected = false;
        });
      }
      return this.pool;
    } catch (error) {
      console.error('Erro ao conectar com o SQL Server:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connected && this.pool) {
        await this.pool.close();
        this.connected = false;
        console.log('✓ Desconectado do SQL Server');
      }
    } catch (error) {
      console.error('Erro ao desconectar do SQL Server:', error);
    }
  }

  async query(sqlQuery, params = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();
      
      // Adicionar parâmetros se fornecidos
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });

      const result = await request.query(sqlQuery);
      return result.recordset;
    } catch (error) {
      console.error('Erro na consulta SQL:', error);
      console.error('Query:', sqlQuery);
      console.error('Params:', params);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;