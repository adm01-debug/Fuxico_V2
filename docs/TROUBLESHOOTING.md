# Guia de Troubleshooting

## Problemas Comuns

### Erro de Autenticação
```
Solução: Limpar cookies e fazer login novamente
```

### Emails não rastreando
1. Verificar se tracking está ativo
2. Confirmar pixel inserido no email
3. Checar logs no dashboard

### Performance lenta
- Limpar cache do navegador
- Verificar conexão de rede
- Reduzir intervalo de refetch

### Erro de CORS
- Verificar domínio está na whitelist
- Confirmar headers corretos

## Logs

```bash
# Ver logs das Edge Functions
supabase functions logs [function-name]
```

## Suporte

- Docs: https://docs.fuxico.app
- Email: support@fuxico.app
