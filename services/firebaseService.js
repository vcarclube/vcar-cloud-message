const admin = require('../config/firebaseConfig');
const { 
  FirebaseMessage, 
  FirebaseBulkMessage, 
  FirebaseSendResult, 
  FirebaseBulkResult 
} = require('../models/firebaseModels');

class FirebaseService {
  constructor() {
    this.messaging = admin.messaging();
  }

  /**
   * Envia uma mensagem para um token específico
   */
  async sendMessageAsync(firebaseMessage) {
    const result = new FirebaseSendResult(firebaseMessage.token);

    try {
      const message = {
        token: firebaseMessage.token,
        notification: {
          title: firebaseMessage.title,
          body: firebaseMessage.body
        },
        data: firebaseMessage.data || {}
      };

      const response = await this.messaging.send(message);
      
      result.success = true;
      result.messageId = response;
    } catch (error) {
      result.success = false;
      result.error = error.message;
      
      // Log específico para tokens inválidos
      if (error.code === 'messaging/registration-token-not-registered') {
        console.warn(`Token inválido ou não registrado: ${firebaseMessage.token}`);
      }
    }

    return result;
  }

  /**
   * Envia mensagens em lote com controle de concorrência
   */
  async sendBulkMessagesAsync(bulkMessage, batchSize = 100, maxConcurrency = 10) {
    const result = new FirebaseBulkResult(bulkMessage.tokens.length);

    if (!bulkMessage.tokens || bulkMessage.tokens.length === 0) {
      result.finalize();
      return result;
    }

    // Criar lotes
    const batches = this.createBatches(bulkMessage.tokens, batchSize);

    // Processar lotes com controle de concorrência
    const semaphore = new Semaphore(maxConcurrency);

    const batchPromises = batches.map(async (batch) => {
      await semaphore.acquire();
      try {
        return await this.processBatchAsync(batch, bulkMessage);
      } finally {
        semaphore.release();
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Consolidar resultados
    batchResults.forEach(batchResult => {
      batchResult.forEach(singleResult => {
        result.addResult(singleResult);
      });
    });

    result.finalize();
    return result;
  }

  /**
   * Envia mensagem para um tópico
   */
  async sendToTopicAsync(topic, title, body, data = {}) {
    const result = new FirebaseSendResult(`topic:${topic}`);

    try {
      const message = {
        topic: topic,
        notification: {
          title: title,
          body: body
        },
        data: data
      };

      const response = await this.messaging.send(message);
      
      result.success = true;
      result.messageId = response;
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Envia múltiplas mensagens usando multicast (mais eficiente)
   */
  async sendMulticastAsync(tokens, title, body, data = {}) {
    const result = new FirebaseBulkResult(tokens.length);

    if (!tokens || tokens.length === 0) {
      result.finalize();
      return result;
    }

    try {
      const message = {
        tokens: tokens,
        notification: {
          title: title,
          body: body
        },
        data: data || {}
      };

      const response = await this.messaging.sendMulticast(message);

      // Processar resultados
      response.responses.forEach((resp, index) => {
        const singleResult = new FirebaseSendResult(tokens[index]);
        
        if (resp.success) {
          singleResult.success = true;
          singleResult.messageId = resp.messageId;
        } else {
          singleResult.success = false;
          singleResult.error = resp.error?.message || 'Unknown error';
        }

        result.addResult(singleResult);
      });

    } catch (error) {
      // Se falhar completamente, marcar todos como falha
      tokens.forEach(token => {
        const singleResult = new FirebaseSendResult(token);
        singleResult.success = false;
        singleResult.error = error.message;
        result.addResult(singleResult);
      });
    }

    result.finalize();
    return result;
  }

  /**
   * Cria lotes de tokens
   */
  createBatches(tokens, batchSize) {
    const batches = [];
    for (let i = 0; i < tokens.length; i += batchSize) {
      batches.push(tokens.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Processa um lote de tokens
   */
  async processBatchAsync(tokenBatch, bulkMessage) {
    // Usar multicast para melhor performance
    const result = await this.sendMulticastAsync(
      tokenBatch,
      bulkMessage.title,
      bulkMessage.body,
      bulkMessage.data
    );

    return result.results;
  }
}

/**
 * Semáforo para controle de concorrência
 */
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.currentConcurrency--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.currentConcurrency++;
      next();
    }
  }
}

module.exports = FirebaseService;