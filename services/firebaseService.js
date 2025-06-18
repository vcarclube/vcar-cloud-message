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
        data: this.convertDataToStrings(firebaseMessage.data || {})
      };

      console.log(`Enviando mensagem para token: ${firebaseMessage.token.substring(0, 20)}...`);
      const response = await this.messaging.send(message);
      
      result.success = true;
      result.messageId = response;
      console.log(`✓ Mensagem enviada com sucesso. MessageId: ${response}`);
    } catch (error) {
      result.success = false;
      result.error = error.message;
      result.errorCode = error.code || 'unknown';
      
      console.error(`✗ Erro ao enviar mensagem:`, {
        token: firebaseMessage.token.substring(0, 20) + '...',
        error: error.message,
        code: error.code
      });

      // Log específico para diferentes tipos de erro
      if (error.code === 'messaging/registration-token-not-registered') {
        console.warn(`Token não registrado: ${firebaseMessage.token.substring(0, 20)}...`);
      } else if (error.code === 'messaging/invalid-registration-token') {
        console.warn(`Token inválido: ${firebaseMessage.token.substring(0, 20)}...`);
      } else if (error.code === 'messaging/mismatched-credential') {
        console.error('Erro de credenciais do Firebase');
      }
    }

    return result;
  }

  /**
   * Envia mensagens em lote com controle de concorrência (usando envios individuais)
   */
  async sendBulkMessagesAsync(bulkMessage, batchSize = 100, maxConcurrency = 5) {
    console.log(`=== Iniciando envio em lote ===`);
    console.log(`Total de tokens: ${bulkMessage.tokens.length}`);
    console.log(`Concorrência máxima: ${maxConcurrency}`);

    const result = new FirebaseBulkResult(bulkMessage.tokens.length);

    if (!bulkMessage.tokens || bulkMessage.tokens.length === 0) {
      console.log('Nenhum token fornecido para envio em lote');
      result.finalize();
      return result;
    }

    // Processar tokens com controle de concorrência
    const semaphore = new Semaphore(maxConcurrency);

    const tokenPromises = bulkMessage.tokens.map(async (token, index) => {
      await semaphore.acquire();
      try {
        console.log(`Processando token ${index + 1}/${bulkMessage.tokens.length}`);
        
        const message = new FirebaseMessage(
          token,
          bulkMessage.title,
          bulkMessage.body,
          bulkMessage.data
        );
        
        return await this.sendMessageAsync(message);
      } finally {
        semaphore.release();
      }
    });

    const tokenResults = await Promise.all(tokenPromises);

    // Consolidar resultados
    tokenResults.forEach(singleResult => {
      result.addResult(singleResult);
    });

    result.finalize();
    
    console.log(`=== Envio em lote finalizado ===`);
    console.log(`Sucessos: ${result.successCount}`);
    console.log(`Falhas: ${result.failureCount}`);
    console.log(`Duração: ${result.duration}ms`);

    return result;
  }

  /**
   * Envia para tópico
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
        data: this.convertDataToStrings(data)
      };

      console.log(`Enviando mensagem para tópico: ${topic}`);
      const response = await this.messaging.send(message);
      
      result.success = true;
      result.messageId = response;
      console.log(`✓ Mensagem enviada para tópico com sucesso. MessageId: ${response}`);
    } catch (error) {
      result.success = false;
      result.error = error.message;
      result.errorCode = error.code || 'unknown';
      console.error(`✗ Erro ao enviar para tópico ${topic}:`, error.message);
    }

    return result;
  }

  /**
   * Método alternativo usando multicast (caso queira testar depois)
   */
  async sendMulticastAsync(tokens, title, body, data = {}) {
    const result = new FirebaseBulkResult(tokens.length);

    if (!tokens || tokens.length === 0) {
      console.log('Nenhum token fornecido para multicast');
      result.finalize();
      return result;
    }

    try {
      // Dividir em lotes menores para evitar problemas
      const batchSize = 500; // Firebase permite até 500 tokens por multicast
      const batches = this.createBatches(tokens, batchSize);
      
      console.log(`Enviando multicast em ${batches.length} lotes`);

      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processando lote ${batchIndex + 1}/${batches.length} com ${batch.length} tokens`);
        
        const message = {
          tokens: batch,
          notification: {
            title: title,
            body: body
          },
          data: this.convertDataToStrings(data)
        };

        const response = await this.messaging.sendMulticast(message);
        console.log(`Lote ${batchIndex + 1}: Sucessos: ${response.successCount}, Falhas: ${response.failureCount}`);

        // Processar resultados do lote
        response.responses.forEach((resp, index) => {
          const singleResult = new FirebaseSendResult(batch[index]);
          
          if (resp.success) {
            singleResult.success = true;
            singleResult.messageId = resp.messageId;
          } else {
            singleResult.success = false;
            singleResult.error = resp.error?.message || 'Unknown error';
            singleResult.errorCode = resp.error?.code || 'unknown';
          }

          result.addResult(singleResult);
        });
      }

    } catch (error) {
      console.error('Erro no multicast:', error.message);
      // Se falhar completamente, marcar todos como falha
      tokens.forEach(token => {
        const singleResult = new FirebaseSendResult(token);
        singleResult.success = false;
        singleResult.error = error.message;
        singleResult.errorCode = error.code || 'unknown';
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
   * Converte todos os valores do data para string (requerido pelo Firebase)
   */
  convertDataToStrings(data) {
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    return stringData;
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