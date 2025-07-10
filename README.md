# Resilient Email Sending Service

## Features

- **Retry mechanism** with exponential backoff
- **Fallback** between two mock providers
- **Idempotency** to prevent duplicate sends
- **Rate limiting** (token bucket)
- **Status tracking** for each email
- **Simple logging**
- **Unit tests** with Jest

## Bonus

- Circuit breaker pattern (not implemented, but structure allows easy addition)
- Basic queue system (not implemented, but can be added)

## Tech Stack

- TypeScript
- Node.js
- Express (API)
- Jest (testing)

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the server:**

   ```sh
   npx ts-node src/server.ts
   ```

   The API will be available at `http://localhost:3000`.

3. **Run tests:**
   ```sh
   npx jest
   ```

## API Usage

### Send Email

```
POST /send-email
Content-Type: application/json
{
  "id": "unique-id-123",
  "to": "user@example.com",
  "subject": "Hello",
  "body": "Test message"
}
```

Returns status of the send attempt.

### Check Status

```
GET /status/:id
```

Returns the status of the email send attempt.

## Assumptions

- Providers are mocked and randomly fail to simulate real-world conditions.
- Idempotency is handled in-memory (not persistent across restarts).
- Rate limiting is per-process and in-memory.
- No persistent queue or circuit breaker (bonus features can be added).

## Project Structure

- `src/EmailService.ts` - Main service logic
- `src/providers.ts` - Mock providers
- `src/utils.ts` - Utilities (backoff, rate limiter, idempotency)
- `src/server.ts` - Express API
- `tests/EmailService.test.ts` - Unit tests

## Extending

- To add a circuit breaker, wrap provider calls and track failures/timeouts.
- To add a persistent queue, use a database or message broker.

## Author

- [Your Name]
