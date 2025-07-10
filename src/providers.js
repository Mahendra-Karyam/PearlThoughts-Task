class MockProviderA {
  constructor() {
    this.name = 'MockProviderA';
  }

  async send(email) {
    if (Math.random() < 0.7) {
      throw new Error('MockProviderA failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

class MockProviderB {
  constructor() {
    this.name = 'MockProviderB';
  }

  async send(email) {
    if (Math.random() < 0.5) {
      throw new Error('MockProviderB failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

module.exports = {
  MockProviderA,
  MockProviderB,
};