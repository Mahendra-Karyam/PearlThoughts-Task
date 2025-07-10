function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt, base = 100) {
  return base * Math.pow(2, attempt);
}

const sentEmails = new Set();

function isEmailSent(id) {
  return sentEmails.has(id);
}

function markEmailSent(id) {
  sentEmails.add(id);
}

class RateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  allow() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refill = Math.floor(elapsed * this.refillRate);

    if (refill > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refill);
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 3, cooldownTime = 10000) {
    this.failureThreshold = failureThreshold;
    this.cooldownTime = cooldownTime;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  canAttempt() {
    if (this.state === 'CLOSED') return true;

    const now = Date.now();
    if (this.state === 'OPEN' && now - this.lastFailureTime >= this.cooldownTime) {
      this.state = 'HALF-OPEN';
      return true;
    }

    return false;
  }
}

module.exports = {
  sleep,
  getBackoffDelay,
  isEmailSent,
  markEmailSent,
  RateLimiter,
  CircuitBreaker,
};