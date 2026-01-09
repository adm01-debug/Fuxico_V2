# Exemplos de Integração

## API REST

### Criar Tracking
```bash
curl -X POST https://api.fuxico.app/create-tracking \
  -H "Authorization: Bearer TOKEN" \
  -d '{"recipientEmail":"user@example.com","subject":"Test"}'
```

### Obter Estatísticas
```bash
curl https://api.fuxico.app/get-tracking-stats \
  -H "Authorization: Bearer TOKEN"
```

## Webhook

```javascript
// Receber eventos
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  console.log(`Email ${data.trackingId} foi ${event}`);
  res.status(200).send('OK');
});
```

## Bitrix24

```javascript
// Sincronizar contato
await bitrix24.syncContact({
  email: 'user@example.com',
  trackingId: 'abc123'
});
```

## Zapier

Trigger: Email Opened
Action: Create CRM Task
