const FirebaseService = require('../services/firebaseService');
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
    
    // Simulação do repositório - substitua pela sua implementação
    this.sociosRepository = {
      getFirebaseTokenByIdSocio: async (idSocio) => {
        // Implementar busca no banco de dados
        // Retorna o token FCM do usuário
        console.log(`Buscando token para sócio: ${idSocio}`);
        return null; // Substitua pela implementação real
      },
      
      getFirebaseTokenByIdsSocios: async (idsSocios) => {
        // Implementar busca no banco de dados
        // Retorna array de tokens FCM dos usuários
        console.log(`Buscando tokens para sócios: ${idsSocios.join(', ')}`);
        return []; // Substitua pela implementação real
      }
    };
  }

  /**
   * Envia notificação push para um usuário específico
   */
  async enviarFirebasePushNotification(req, res) {
    try {
      // Validar entrada
      const { error, value } = firebaseMessageRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { idSocio, title, body } = value;

      // Buscar token FCM do usuário
      const fcmToken = await this.sociosRepository.getFirebaseTokenByIdSocio(idSocio);

      if (!fcmToken) {
        return res.status(404).json({
          success: false,
          message: 'Token FCM não encontrado para o usuário'
        });
      }

      // Criar mensagem
      const message = new FirebaseMessage(
        fcmToken,
        title,
        body,
        {
          type: 'notificação',
          timestamp: new Date().toISOString()
        }
      );

      // Enviar mensagem
      const result = await this.firebaseService.sendMessageAsync(message);

      return res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Envia notificações push para múltiplos usuários
   */
  async enviarFirebasePushNotificationTokens(req, res) {
    try {
      // Validar entrada
      const { error, value } = firebaseBulkMessageRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { idsSocios, title, body, data = {} } = value;

      // Buscar tokens FCM dos usuários
      const fcmTokens = await this.sociosRepository.getFirebaseTokenByIdsSocios(idsSocios);

      if (!fcmTokens || fcmTokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum token FCM encontrado para os usuários'
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

      // Enviar mensagens
      const result = await this.firebaseService.sendBulkMessagesAsync(
        bulkMessage,
        100, // batchSize
        10   // maxConcurrency
      );

      return res.json({
        success: result.successCount > 0,
        totalTokens: result.totalTokens,
        successCount: result.successCount,
        failureCount: result.failureCount,
        duration: result.duration,
        successfulTokens: result.successfulTokens,
        failedTokens: result.failedTokens
      });

    } catch (error) {
      console.error('Erro ao enviar notificações em lote:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Envia notificação push para todos os usuários de um tópico
   */
  async enviarFirebasePushNotificationAll(req, res) {
    try {
      // Validar entrada
      const { error, value } = firebaseBulkMessageTopicRequestSchema.validate(req.body);
      if (error) {
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

      return res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

    } catch (error) {
      console.error('Erro ao enviar notificação para tópico:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = FirebaseController;