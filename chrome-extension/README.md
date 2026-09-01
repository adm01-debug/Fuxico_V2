# FUXICO - Chrome Extension

Extensão do Chrome para rastreamento de emails no Gmail.

## Instalação (Modo Desenvolvedor)

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `chrome-extension`

## Configuração

Antes de usar, atualize as URLs nos arquivos:

### `content/gmail.js`
```javascript
const CONFIG = {
  API_URL: 'https://SEU-PROJETO.supabase.co/functions/v1',
  // ...
};
```

### `popup/popup.js`
```javascript
const DASHBOARD_URL = 'https://sua-url.lovable.app/';
```

### `background/service-worker.js`
```javascript
const CONFIG = {
  API_URL: 'https://SEU-PROJETO.supabase.co/functions/v1',
  // ...
};
```

## Criando os Ícones

Você precisa criar ícones nas seguintes dimensões e salvá-los na pasta `icons/`:

- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Você pode usar a imagem do logo do FUXICO e redimensioná-la.

## Funcionalidades

- ✅ Toggle de tracking por email
- ✅ Injeção automática de pixel de tracking
- ✅ Notificações de aberturas
- ✅ Popup com estatísticas
- ✅ Configurações persistentes

## Como Funciona

1. Quando você compõe um email no Gmail, a extensão detecta automaticamente
2. Um botão "FUXICO" aparece permitindo ativar/desativar o tracking
3. Ao enviar, um pixel de tracking é inserido automaticamente
4. Quando o destinatário abre o email, você recebe uma notificação

## Estrutura

```
chrome-extension/
├── manifest.json          # Configuração da extensão
├── content/
│   └── gmail.js          # Script injetado no Gmail
├── background/
│   └── service-worker.js # Worker em background
├── popup/
│   ├── popup.html        # Interface do popup
│   ├── popup.css         # Estilos do popup
│   └── popup.js          # Lógica do popup
├── styles/
│   └── gmail-inject.css  # Estilos injetados no Gmail
└── icons/                # Ícones da extensão
```

## Próximos Passos

- [ ] Adicionar ícones personalizados
- [ ] Publicar na Chrome Web Store
- [ ] Adicionar checkmarks na pasta enviados
- [ ] Integrar com Google OAuth
