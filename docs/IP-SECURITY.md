# 🔒 FUXICO - IP Whitelist Security

## Configuração de IPs Confiáveis

O FUXICO implementa uma camada de segurança baseada em IP whitelist para restringir o acesso às Edge Functions apenas a IPs autorizados.

## 🚀 Como Configurar

### Método 1: Variável de Ambiente (Recomendado)

Configure a variável `WHITELISTED_IPS` no Supabase Dashboard:

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets

WHITELISTED_IPS=203.0.113.50,198.51.100.25,192.0.2.100
```

### Método 2: Arquivo de Configuração

Edite o arquivo `supabase/functions/_shared/ip-whitelist.ts`:

```typescript
export const WHITELISTED_IPS: string[] = [
  '127.0.0.1',           // Localhost
  '203.0.113.50',        // IP do Escritório
  '198.51.100.25',       // VPN da Empresa
  '192.0.2.0/24',        // Range de IPs (CIDR)
];
```

## 📋 IPs para Adicionar

| Ambiente | IP | Descrição |
|----------|-----|-----------|
| Desenvolvimento | `127.0.0.1`, `::1` | Localhost |
| Escritório | `SEU_IP_AQUI` | IP fixo do escritório |
| VPN | `SEU_IP_VPN` | Servidor VPN |
| Produção | `SEU_IP_SERVIDOR` | Servidor de produção |
| CI/CD | `IPs_GITHUB_ACTIONS` | GitHub Actions runners |

## 🔓 Endpoints Públicos

Os seguintes endpoints **NÃO** são protegidos por IP (precisam ser acessíveis por clientes de email):

- `track-pixel` - Pixel de rastreamento
- `track-link` - Rastreamento de links
- `track-document` - Rastreamento de documentos
- `track-standalone-link` - Links standalone
- `track-beacon` - Beacon tracking
- `unsubscribe` - Cancelamento de inscrição

## 🛡️ Como Funciona

```
┌─────────────────┐
│  Request Entry  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Is Public      │ YES │  Allow Access   │
│  Endpoint?      │────▶│  (No IP Check)  │
└────────┬────────┘     └─────────────────┘
         │ NO
         ▼
┌─────────────────┐     ┌─────────────────┐
│  IP in          │ YES │  Allow Access   │
│  Whitelist?     │────▶│  (Log Access)   │
└────────┬────────┘     └─────────────────┘
         │ NO
         ▼
┌─────────────────┐
│  403 Forbidden  │
│  Log & Block    │
└─────────────────┘
```

## 📝 Logs de Segurança

Todas as tentativas de acesso são logadas:

```json
{
  "type": "security_event",
  "event": "access_denied",
  "ip": "192.168.1.100",
  "timestamp": "2025-12-25T10:30:00Z",
  "path": "/create-tracking"
}
```

## ⚠️ Importante

1. **Sempre teste** após adicionar novos IPs
2. **Mantenha backup** dos IPs configurados
3. **Monitore os logs** para detectar tentativas de acesso não autorizado
4. **Atualize regularmente** quando IPs mudarem

## 🔧 Comandos Úteis

### Descobrir seu IP público:
```bash
curl ifconfig.me
# ou
curl api.ipify.org
```

### Testar acesso:
```bash
curl -I https://seu-projeto.supabase.co/functions/v1/health-check
```

## 📞 Suporte

Se você for bloqueado acidentalmente:
1. Verifique seu IP atual
2. Adicione à whitelist via Supabase Dashboard
3. Aguarde ~1 minuto para propagação
