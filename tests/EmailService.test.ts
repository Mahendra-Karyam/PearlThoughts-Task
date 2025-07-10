import { EmailService, Email, EmailProvider } from '../src/EmailService';

class AlwaysFailProvider implements EmailProvider {
  name = 'AlwaysFail';
  async send(email: Email): Promise<void> {
    throw new Error('Always fails');
  }
}

class AlwaysSucceedProvider implements EmailProvider {
  name = 'AlwaysSucceed';
  async send(email: Email): Promise<void> {
    return;
  }
}

describe('EmailService', () => {
  it('sends email successfully with first provider', async () => {
    const service = new EmailService([
      new AlwaysSucceedProvider(),
      new AlwaysFailProvider(),
    ]);
    const email = { id: '1', to: 'a@b.com', subject: 'Test', body: 'Body' };
    const status = await service.sendEmail(email);
    expect(status.status).toBe('sent');
    expect(status.provider).toBe('AlwaysSucceed');
    expect(status.attempts).toBe(1);
  });

  it('falls back to second provider on failure', async () => {
    const service = new EmailService([
      new AlwaysFailProvider(),
      new AlwaysSucceedProvider(),
    ]);
    const email = { id: '2', to: 'a@b.com', subject: 'Test', body: 'Body' };
    const status = await service.sendEmail(email);
    expect(status.status).toBe('sent');
    expect(status.provider).toBe('AlwaysSucceed');
  });

  it('returns failed status if all providers fail', async () => {
    const service = new EmailService([
      new AlwaysFailProvider(),
      new AlwaysFailProvider(),
    ]);
    const email = { id: '3', to: 'a@b.com', subject: 'Test', body: 'Body' };
    const status = await service.sendEmail(email);
    expect(status.status).toBe('failed');
    expect(status.provider).toBe('');
    expect(status.lastError).toBeDefined();
  });

  it('is idempotent and does not send duplicate emails', async () => {
    const service = new EmailService([
      new AlwaysSucceedProvider(),
    ]);
    const email = { id: '4', to: 'a@b.com', subject: 'Test', body: 'Body' };
    const status1 = await service.sendEmail(email);
    const status2 = await service.sendEmail(email);
    expect(status1.status).toBe('sent');
    expect(status2.status).toBe('sent');
    expect(status2.attempts).toBe(1);
  });

  it('rate limits excessive requests', async () => {
    const service = new EmailService([
      new AlwaysSucceedProvider(),
    ]);
    const emails = Array.from({ length: 20 }, (_, i) => ({
      id: `rate${i}`,
      to: 'a@b.com',
      subject: 'Test',
      body: 'Body',
    }));
    const results = await Promise.all(emails.map(e => service.sendEmail(e)));
    const failed = results.filter(r => r.status === 'failed');
    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0].lastError).toBe('Rate limit exceeded');
  });

  it('tracks status for each email', async () => {
    const service = new EmailService([
      new AlwaysSucceedProvider(),
    ]);
    const email = { id: 'status1', to: 'a@b.com', subject: 'Test', body: 'Body' };
    await service.sendEmail(email);
    const status = service.getStatus('status1');
    expect(status).toBeDefined();
    expect(status?.status).toBe('sent');
  });
}); 