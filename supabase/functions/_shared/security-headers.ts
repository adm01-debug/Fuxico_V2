// =============================================================================
// FUXICO - Security Headers (CSP, XSS, etc)
// Arquivo: supabase/functions/_shared/security-headers.ts
// Descrição: Headers de segurança para proteção contra XSS, Clickjacking, etc
// =============================================================================

/**
 * Configuração de Content Security Policy
 */
export interface CSPConfig {
  /** Diretivas CSP customizadas */
  directives?: Partial<CSPDirectives>;
  /** Se deve incluir 'report-uri' */
  reportUri?: string;
  /** Se deve usar 'Content-Security-Policy-Report-Only' */
  reportOnly?: boolean;
}

/**
 * Diretivas CSP disponíveis
 */
export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'frame-ancestors': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'media-src': string[];
  'worker-src': string[];
  'manifest-src': string[];
  'upgrade-insecure-requests': boolean;
  'block-all-mixed-content': boolean;
}

// =============================================================================
// CONFIGURAÇÃO PADRÃO
// =============================================================================

/**
 * CSP padrão para o FUXICO
 */
const DEFAULT_CSP_DIRECTIVES: Partial<CSPDirectives> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Necessário para alguns frameworks
    "https://cdn.jsdelivr.net", // CDN comum
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Tailwind inline styles
    "https://fonts.googleapis.com",
  ],
  'img-src': [
    "'self'",
    "data:", // Base64 images
    "https:", // Imagens externas HTTPS
    "blob:", // Blob URLs
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  'connect-src': [
    "'self'",
    "https://*.supabase.co", // Supabase
    "https://*.supabase.in",
    "wss://*.supabase.co", // WebSocket Supabase
    "https://api.ipify.org", // IP lookup
  ],
  'frame-ancestors': ["'none'"], // Previne clickjacking
  'object-src': ["'none'"], // Previne Flash/plugins
  'base-uri': ["'self'"], // Previne base tag injection
  'form-action': ["'self'"], // Limita destinos de forms
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};

/**
 * CSP para endpoints de tracking (mais permissivo)
 */
const TRACKING_CSP_DIRECTIVES: Partial<CSPDirectives> = {
  'default-src': ["'none'"],
  'img-src': ["'self'"],
  'frame-ancestors': ["*"], // Pixels podem ser carregados de qualquer lugar
};

// =============================================================================
// FUNÇÕES DE GERAÇÃO
// =============================================================================

/**
 * Gera string CSP a partir de diretivas
 */
function buildCSPString(directives: Partial<CSPDirectives>): string {
  const parts: string[] = [];
  
  for (const [key, value] of Object.entries(directives)) {
    if (value === true) {
      parts.push(key);
    } else if (value === false) {
      continue;
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key} ${value.join(' ')}`);
    }
  }
  
  return parts.join('; ');
}

/**
 * Gera Content-Security-Policy header
 */
export function getCSPHeader(config: CSPConfig = {}): Record<string, string> {
  const directives = {
    ...DEFAULT_CSP_DIRECTIVES,
    ...config.directives,
  };
  
  let cspString = buildCSPString(directives);
  
  if (config.reportUri) {
    cspString += `; report-uri ${config.reportUri}`;
  }
  
  const headerName = config.reportOnly 
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
  
  return { [headerName]: cspString };
}

// =============================================================================
// SECURITY HEADERS COMPLETOS
// =============================================================================

/**
 * Todos os headers de segurança recomendados
 */
export function getSecurityHeaders(options: {
  csp?: CSPConfig;
  includeCSP?: boolean;
} = {}): Record<string, string> {
  const headers: Record<string, string> = {
    // Previne sniffing de MIME type
    'X-Content-Type-Options': 'nosniff',
    
    // Previne clickjacking (redundante com CSP frame-ancestors, mas compatibilidade)
    'X-Frame-Options': 'DENY',
    
    // Ativa filtro XSS do browser (legado, mas ainda útil)
    'X-XSS-Protection': '1; mode=block',
    
    // Controla informações enviadas no Referer
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (antigo Feature-Policy)
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
    ].join(', '),
    
    // Previne DNS prefetch de links maliciosos
    'X-DNS-Prefetch-Control': 'off',
    
    // Previne download em IE
    'X-Download-Options': 'noopen',
    
    // Desabilita cache para dados sensíveis
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  
  // Adicionar CSP se solicitado
  if (options.includeCSP !== false) {
    Object.assign(headers, getCSPHeader(options.csp));
  }
  
  return headers;
}

/**
 * Headers específicos para endpoints de tracking (pixel, link)
 */
export function getTrackingSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'ALLOWALL', // Pixels precisam carregar em qualquer lugar
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...getCSPHeader({ directives: TRACKING_CSP_DIRECTIVES }),
  };
}

/**
 * Headers para respostas de API JSON
 */
export function getAPISecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'private, no-cache',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

// =============================================================================
// HELPERS PARA EDGE FUNCTIONS
// =============================================================================

/**
 * Adiciona headers de segurança a uma Response existente
 */
export function addSecurityHeaders(
  response: Response,
  type: 'default' | 'tracking' | 'api' = 'default'
): Response {
  let securityHeaders: Record<string, string>;
  
  switch (type) {
    case 'tracking':
      securityHeaders = getTrackingSecurityHeaders();
      break;
    case 'api':
      securityHeaders = getAPISecurityHeaders();
      break;
    default:
      securityHeaders = getSecurityHeaders();
  }
  
  const newHeaders = new Headers(response.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Cria Response com headers de segurança incluídos
 */
export function secureResponse(
  body: BodyInit | null,
  init: ResponseInit = {},
  type: 'default' | 'tracking' | 'api' = 'api'
): Response {
  let securityHeaders: Record<string, string>;
  
  switch (type) {
    case 'tracking':
      securityHeaders = getTrackingSecurityHeaders();
      break;
    case 'api':
      securityHeaders = getAPISecurityHeaders();
      break;
    default:
      securityHeaders = getSecurityHeaders();
  }
  
  const headers = new Headers(init.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  
  return new Response(body, {
    ...init,
    headers,
  });
}

/**
 * Cria Response JSON segura
 */
export function secureJsonResponse(
  data: unknown,
  init: ResponseInit = {}
): Response {
  return secureResponse(
    JSON.stringify(data),
    {
      ...init,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...Object.fromEntries(new Headers(init.headers).entries()),
      },
    },
    'api'
  );
}

// =============================================================================
// STRICT TRANSPORT SECURITY (HSTS)
// =============================================================================

/**
 * Headers HSTS para forçar HTTPS
 * NOTA: Usar com cuidado, pode bloquear acesso se HTTPS não estiver configurado
 */
export function getHSTSHeaders(options: {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
} = {}): Record<string, string> {
  const {
    maxAge = 31536000, // 1 ano
    includeSubDomains = true,
    preload = false,
  } = options;
  
  let value = `max-age=${maxAge}`;
  
  if (includeSubDomains) {
    value += '; includeSubDomains';
  }
  
  if (preload) {
    value += '; preload';
  }
  
  return {
    'Strict-Transport-Security': value,
  };
}

// =============================================================================
// VALIDAÇÃO DE ORIGEM
// =============================================================================

/**
 * Valida se a origem da requisição é permitida
 */
export function isValidOrigin(
  origin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!origin) return false;
  
  for (const allowed of allowedOrigins) {
    if (allowed === '*') return true;
    if (origin === allowed) return true;
    
    // Wildcard subdomain
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      if (origin.endsWith(domain) || origin.endsWith('.' + domain)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Middleware de validação de origem
 */
export function validateOrigin(
  req: Request,
  allowedOrigins: string[]
): Response | null {
  const origin = req.headers.get('Origin');
  
  if (origin && !isValidOrigin(origin, allowedOrigins)) {
    return new Response(
      JSON.stringify({
        error: 'FORBIDDEN',
        message: 'Origin not allowed',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null;
}
