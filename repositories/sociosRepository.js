const db = require('../config/database');
const sql = require('mssql');

class SociosRepository {
  /**
   * Busca o token FCM de um sócio pelo ID
   */
  async getFirebaseTokenByIdSocio(idSocio) {
    try {
      console.log(`Buscando token FCM para sócio: ${idSocio}`);
      
      const query = `
        SELECT FcmToken 
        FROM Socios 
        WHERE IdSocio = @idSocio
      `;

      const params = {
        idSocio: sql.UniqueIdentifier, idSocio
      };

      const result = await db.query(query, { idSocio });
      
      if (result && result.length > 0) {
        const token = result[0].FcmToken;
        console.log(`Token encontrado para sócio ${idSocio}: ${token ? 'Sim' : 'Não'}`);
        return token;
      }
      
      console.log(`Nenhum token encontrado para sócio: ${idSocio}`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar token FCM por ID do sócio:', error);
      throw error;
    }
  }

  /**
   * Busca o token FCM de um sócio pelo ID do veículo
   */
  async getFirebaseTokenByIdSocioVeiculo(idSocioVeiculo) {
    try {
      console.log(`Buscando token FCM para sócio-veículo: ${idSocioVeiculo}`);
      
      const query = `
        SELECT FcmToken 
        FROM SOCIOS 
        WHERE IDSOCIO IN (
          SELECT IDSOCIO 
          FROM SOCIOSVEICULOS 
          WHERE IDSOCIOVEICULO = @idSocioVeiculo
        )
      `;

      const result = await db.query(query, { idSocioVeiculo });
      
      if (result && result.length > 0) {
        const token = result[0].FcmToken;
        console.log(`Token encontrado para sócio-veículo ${idSocioVeiculo}: ${token ? 'Sim' : 'Não'}`);
        return token;
      }
      
      console.log(`Nenhum token encontrado para sócio-veículo: ${idSocioVeiculo}`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar token FCM por ID do sócio-veículo:', error);
      throw error;
    }
  }

  /**
   * Busca tokens FCM de múltiplos sócios pelos IDs
   */
  async getFirebaseTokenByIdsSocios(idsSocios) {
    try {
      if (!idsSocios || idsSocios.length === 0) {
        console.log('Lista de IDs de sócios vazia');
        return [];
      }

      console.log(`Buscando tokens FCM para ${idsSocios.length} sócios`);
      
      // Criar parâmetros dinâmicos para a query
      const paramNames = idsSocios.map((_, index) => `@id${index}`).join(',');
      const params = {};
      
      idsSocios.forEach((id, index) => {
        params[`id${index}`] = id;
      });

      const query = `
        SELECT FcmToken 
        FROM Socios 
        WHERE IdSocio IN (${paramNames})
        AND FcmToken IS NOT NULL 
        AND FcmToken != ''
      `;

      const result = await db.query(query, params);
      
      // Filtrar apenas tokens válidos
      const tokens = result
        .map(row => row.FcmToken)
        .filter(token => token && token.trim() !== '');

      console.log(`Encontrados ${tokens.length} tokens válidos de ${idsSocios.length} sócios`);
      return tokens;
    } catch (error) {
      console.error('Erro ao buscar tokens FCM por IDs dos sócios:', error);
      throw error;
    }
  }

  /**
   * Busca todos os tokens FCM ativos
   */
  async getAllActiveFirebaseTokens() {
    try {
      console.log('Buscando todos os tokens FCM ativos');
      
      const query = `
        SELECT FcmToken 
        FROM Socios 
        WHERE FcmToken IS NOT NULL 
        AND FcmToken != ''
      `;

      const result = await db.query(query);
      
      const tokens = result
        .map(row => row.FcmToken)
        .filter(token => token && token.trim() !== '');

      console.log(`Encontrados ${tokens.length} tokens FCM ativos`);
      return tokens;
    } catch (error) {
      console.error('Erro ao buscar todos os tokens FCM ativos:', error);
      throw error;
    }
  }

  /**
   * Atualiza o token FCM de um sócio
   */
  async updateFirebaseToken(idSocio, fcmToken) {}

  /**
   * Remove token FCM inválido
   */
  async removeInvalidFirebaseToken(fcmToken) {}

  /**
   * Teste de conexão com o banco
   */
  async testConnection() {
    try {
      const query = 'SELECT COUNT(*) as total FROM Socios';
      const result = await db.query(query);
      console.log(`✓ Teste de conexão bem-sucedido. Total de sócios: ${result[0].total}`);
      return true;
    } catch (error) {
      console.error('✗ Teste de conexão falhou:', error);
      return false;
    }
  }
}

module.exports = new SociosRepository();