const FirebaseService = require('../services/firebaseService');
const sociosRepository = require('../repositories/sociosRepository');
const { 
  FirebaseMessage, 
  FirebaseBulkMessage,
  firebaseMessageRequestSchema,
  firebaseBulkMessageRequestSchema,
  firebaseBulkMessageTopicRequestSchema
} = require('../models/firebaseModels');

class FirebaseController {
  constructor() {
    this.firebaseService = new FirebaseService();
  }

  /**
   * Envia notificação push para um usuário específico
   */
  async enviarFirebasePushNotification(req, res) {
    try {
      console.log('=== Enviando notificação única ===');
      console.log('Body recebido:', req.body);

      // Validar entrada
      const { error, value } = firebaseMessageRequestSchema.validate(req.body);
      if (error) {
        console.error('Erro de validação:', error.details[0].message);
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { idSocio, title, body } = value;

      // Buscar token FCM do usuário
      const fcmToken = await sociosRepository.getFirebaseTokenByIdSocio(idSocio);

      if (!fcmToken) {
        console.log(`Token FCM não encontrado para sócio: ${idSocio}`);
        return res.status(404).json({
          success: false,
          message: 'Token FCM não encontrado para o usuário',
          idSocio: idSocio
        });
      }

      // Criar mensagem
      const message = new FirebaseMessage(
        fcmToken,
        title,
        body,
        {
          type: 'notificação',
          timestamp: new Date().toISOString(),
          idSocio: idSocio
        }
      );

      // Enviar mensagem
      const result = await this.firebaseService.sendMessageAsync(message);

      // Se o token for inválido, remover do banco
      if (!result.success && result.errorCode && 
          (result.errorCode.includes('registration-token-not-registered') || 
           result.errorCode.includes('invalid-registration-token'))) {
        console.log(`Removendo token FCM inválido: ${fcmToken.substring(0, 20)}...`);
        await sociosRepository.removeInvalidFirebaseToken(fcmToken);
      }

      console.log('Resultado do envio:', {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        errorCode: result.errorCode
      });

      return res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        errorCode: result.errorCode,
        idSocio: idSocio,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao enviar notificação única:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
 * Envia notificações push para múltiplos usuários
 */
async enviarFirebasePushNotificationTokens(req, res) {
  try {
    console.log('=== Enviando notificações em lote ===');
    console.log('Body recebido:', req.body);

    // Validar entrada
    const { error, value } = firebaseBulkMessageRequestSchema.validate(req.body);
    if (error) {
      console.error('Erro de validação:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { idsSocios, title, body, data = {} } = value;

    // Buscar tokens FCM dos usuários
    const fcmTokens = await sociosRepository.getFirebaseTokenByIdsSocios(idsSocios);

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log(`Nenhum token FCM encontrado para os sócios: ${idsSocios.join(', ')}`);
      return res.status(404).json({
        success: false,
        message: 'Nenhum token FCM encontrado para os usuários',
        idsSocios: idsSocios,
        totalSocios: idsSocios.length
      });
    }

    // Criar mensagem em lote
    const bulkMessage = new FirebaseBulkMessage(
      fcmTokens,
      title,
      body,
      {
        ...data,
        type: 'notificação',
        timestamp: new Date().toISOString()
      }
    );

    // Enviar mensagens com concorrência reduzida
    const result = await this.firebaseService.sendBulkMessagesAsync(
      bulkMessage,
      100, // batchSize (não usado no método atual)
      3    // maxConcurrency reduzida para evitar problemas
    );

    // Remover tokens inválidos do banco
    const invalidTokens = result.failedTokens.filter((token, index) => {
      const failedResult = result.results.find(r => r.token === token && !r.success);
      return failedResult && failedResult.errorCode && 
             (failedResult.errorCode.includes('registration-token-not-registered') || 
              failedResult.errorCode.includes('invalid-registration-token'));
    });

    if (invalidTokens.length > 0) {
      console.log(`Removendo ${invalidTokens.length} tokens inválidos do banco`);
      for (const invalidToken of invalidTokens) {
        try {
          await sociosRepository.removeInvalidFirebaseToken(invalidToken);
        } catch (error) {
          console.error(`Erro ao remover token inválido ${invalidToken.substring(0, 20)}...:`, error);
        }
      }
    }

    console.log('Resultado do envio em lote:', {
      totalTokens: result.totalTokens,
      successCount: result.successCount,
      failureCount: result.failureCount,
      duration: result.duration,
      errorSummary: result.errorSummary
    });

    return res.json({
      success: result.successCount > 0,
      totalTokens: result.totalTokens,
      successCount: result.successCount,
      failureCount: result.failureCount,
      duration: result.duration,
      totalSocios: idsSocios.length,
      tokensEncontrados: fcmTokens.length,
      tokensInvalidosRemovidos: invalidTokens.length,
      errorSummary: result.errorSummary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao enviar notificações em lote:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

  /**
   * Envia notificação push para todos os usuários de um tópico
   */
  async enviarFirebasePushNotificationAll(req, res) {
    try {
      console.log('=== Enviando notificação para tópico ===');
      console.log('Body recebido:', req.body);

      // Validar entrada
      const { error, value } = firebaseBulkMessageTopicRequestSchema.validate(req.body);
      if (error) {
        console.error('Erro de validação:', error.details[0].message);
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { topic, title, body } = value;

      // Enviar para tópico
      const result = await this.firebaseService.sendToTopicAsync(
        topic,
        title,
        body,
        {
          type: 'notificação',
          timestamp: new Date().toISOString(),
          priority: 'high'
        }
      );

      console.log('Resultado do envio para tópico:', result);

      return res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        errorCode: result.errorCode,
        topic: topic,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao enviar notificação para tópico:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Envia notificação por ID do sócio-veículo
   */
  async enviarFirebasePushNotificationVeiculo(req, res) {
    try {
      console.log('=== Enviando notificação por veículo ===');
      console.log('Body recebido:', req.body);

      const { idSocioVeiculo, title, body } = req.body;

      if (!idSocioVeiculo || !title || !body) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: idSocioVeiculo, title, body'
        });
      }

      // Buscar token FCM do usuário pelo veículo
      const fcmToken = await sociosRepository.getFirebaseTokenByIdSocioVeiculo(idSocioVeiculo);

      if (!fcmToken) {
        console.log(`Token FCM não encontrado para sócio-veículo: ${idSocioVeiculo}`);
        return res.status(404).json({
          success: false,
          message: 'Token FCM não encontrado para o sócio-veículo',
          idSocioVeiculo: idSocioVeiculo
        });
      }

      // Criar mensagem
      const message = new FirebaseMessage(
        fcmToken,
        title,
        body,
        {
          type: 'notificação',
          timestamp: new Date().toISOString(),
          idSocioVeiculo: idSocioVeiculo
        }
      );

      // Enviar mensagem
      const result = await this.firebaseService.sendMessageAsync(message);

      console.log('Resultado do envio por veículo:', result);

      return res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        errorCode: result.errorCode,
        idSocioVeiculo: idSocioVeiculo,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao enviar notificação por veículo:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Teste de conexão com banco de dados
   */
  async testeConexaoBanco(req, res) {
    try {
      const resultado = await sociosRepository.testConnection();
      
      return res.json({
        success: resultado,
        message: resultado ? 'Conexão com banco OK' : 'Falha na conexão com banco',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = FirebaseController;