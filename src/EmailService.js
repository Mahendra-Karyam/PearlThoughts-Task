const { sleep, getBackoffDelay, isEmailSent, markEmailSent, RateLimiter } = require('./utils');

class EmailService {
  constructor(providers) {
    this.providers = providers;
    this.statusMap = new Map();
    this.rateLimiter = new RateLimiter(10, 5); // 10 emails max, refill 5/sec
    this.maxRetries = 3;
  }

  async sendEmail(email) {
    if (isEmailSent(email.id)) {
      this.log(`Email ${email.id} already sent (idempotent)`);
      return (
        this.statusMap.get(email.id) || {
          emailId: email.id,
          status: 'sent',
          provider: '',
          attempts: 0,
        }
      );
    }

    if (!this.rateLimiter.allow()) {
      this.log(`Rate limit exceeded for email ${email.id}`);
      const status = {
        emailId: email.id,
        status: 'failed',
        provider: '',
        attempts: 0,
        lastError: 'Rate limit exceeded',
      };
      this.statusMap.set(email.id, status);
      return status;
    }

    let lastError = '';

    for (let providerIdx = 0; providerIdx < this.providers.length; providerIdx++) {
      const provider = this.providers[providerIdx];

      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          this.log(`Sending email ${email.id} via ${provider.name}, attempt ${attempt + 1}`);

          this.statusMap.set(email.id, {
            emailId: email.id,
            status: attempt === 0 ? 'pending' : 'retrying',
            provider: provider.name,
            attempts: attempt + 1,
          });

          await provider.send(email);
          markEmailSent(email.id);

          const status = {
            emailId: email.id,
            status: 'sent',
            provider: provider.name,
            attempts: attempt + 1,
          };

          this.statusMap.set(email.id, status);
          this.log(`Email ${email.id} sent via ${provider.name}`);
          return status;
        } catch (err) {
          lastError = err.message || String(err);
          this.log(`Error sending email ${email.id} via ${provider.name}: ${lastError}`);
          await sleep(getBackoffDelay(attempt));
        }
      }

      this.log(`Provider ${provider.name} failed for email ${email.id}, falling back to next provider.`);
    }

    const status = {
      emailId: email.id,
      status: 'failed',
      provider: '',
      attempts: this.maxRetries * this.providers.length,
      lastError,
    };

    this.statusMap.set(email.id, status);
    return status;
  }

  getStatus(emailId) {
    return this.statusMap.get(emailId);
  }

  log(msg) {
    console.log(`[EmailService] ${msg}`);
  }
}

module.exports = { EmailService };
