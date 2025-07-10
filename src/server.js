const express = require('express');
const { EmailService } = require('./EmailService');
const { MockProviderA, MockProviderB } = require('./providers');

const app = express();
app.use(express.json());

const emailService = new EmailService([
  new MockProviderA(),
  new MockProviderB(),
]);

app.post('/send-email', async (req, res) => {
  const { id, to, subject, body } = req.body;
  if (!id || !to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const status = await emailService.sendEmail({ id, to, subject, body });
  res.json(status);
});

app.get('/status/:id', (req, res) => {
  const status = emailService.getStatus(req.params.id);
  if (!status) return res.status(404).json({ error: 'Not found' });
  res.json(status);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EmailService API running on port ${PORT}`);
});
