const Joi = require('joi');

// Schemas de validação
const firebaseMessageRequestSchema = Joi.object({
  idSocio: Joi.string().guid().required(),
  title: Joi.string().required(),
  body: Joi.string().required()
});

const firebaseBulkMessageRequestSchema = Joi.object({
  idsSocios: Joi.array().items(Joi.string().guid()).min(1).required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  data: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

const firebaseBulkMessageTopicRequestSchema = Joi.object({
  topic: Joi.string().required(),
  title: Joi.string().required(),
  body: Joi.string().required()
});

// Classes de modelo
class FirebaseMessage {
  constructor(token, title, body, data = {}) {
    this.token = token;
    this.title = title;
    this.body = body;
    this.data = data;
  }
}

class FirebaseBulkMessage {
  constructor(tokens, title, body, data = {}) {
    this.tokens = tokens;
    this.title = title;
    this.body = body;
    this.data = data;
  }
}

class FirebaseSendResult {
  constructor(token) {
    this.success = false;
    this.messageId = null;
    this.error = null;
    this.token = token;
  }
}

class FirebaseBulkResult {
  constructor(totalTokens = 0) {
    this.totalTokens = totalTokens;
    this.successCount = 0;
    this.failureCount = 0;
    this.results = [];
    this.duration = 0;
    this.startTime = Date.now();
  }

  addResult(result) {
    this.results.push(result);
    if (result.success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
  }

  finalize() {
    this.duration = Date.now() - this.startTime;
  }

  get successfulTokens() {
    return this.results.filter(r => r.success).map(r => r.token);
  }

  get failedTokens() {
    return this.results.filter(r => !r.success).map(r => r.token);
  }
}

module.exports = {
  FirebaseMessage,
  FirebaseBulkMessage,
  FirebaseSendResult,
  FirebaseBulkResult,
  firebaseMessageRequestSchema,
  firebaseBulkMessageRequestSchema,
  firebaseBulkMessageTopicRequestSchema
};