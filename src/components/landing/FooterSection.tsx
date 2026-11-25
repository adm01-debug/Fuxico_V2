import { Lock, ExternalLink } from 'lucide-react';
import logoImg from '@/assets/logo.webp';

interface FooterSectionProps {
  onNavigatePricing: () => void;
  onOpenDemo: () => void;
}

export const FooterSection = ({ onNavigatePricing, onOpenDemo }: FooterSectionProps) => (
  <footer className="relative border-t border-border/40 bg-card/20 py-10 backdrop-blur-sm sm:py-14">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <img
              src={logoImg}
              alt="FUXICO"
              className="h-10 w-10 rounded-xl object-cover shadow-lg"
            />
            <div>
              <span className="font-display text-lg font-bold">FUXICO</span>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Email Tracking Profissional
              </p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            A solução mais completa para rastreamento de emails empresariais. Saiba exatamente
            quando seus emails são lidos e aumente suas conversões.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Produto</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              <button onClick={onNavigatePricing} className="transition-colors hover:text-primary">
                Preços
              </button>
            </li>
            <li>
              <button onClick={onOpenDemo} className="transition-colors hover:text-primary">
                Ver Demo
              </button>
            </li>
            <li>
              <a href="#features-section" className="transition-colors hover:text-primary">
                Funcionalidades
              </a>
            </li>
            <li>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-primary"
              >
                Extensão Chrome <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              <a href="#" className="transition-colors hover:text-primary">
                Termos de Uso
              </a>
            </li>
            <li>
              <button
                onClick={() => (window.location.href = '/privacy')}
                className="transition-colors hover:text-primary"
              >
                Política de Privacidade
              </button>
            </li>
            <li>
              <button
                onClick={() => (window.location.href = '/privacy')}
                className="transition-colors hover:text-primary"
              >
                LGPD
              </button>
            </li>
            <li>
              <a href="mailto:contato@fuxico.app" className="transition-colors hover:text-primary">
                Contato
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Dados protegidos com criptografia de ponta-a-ponta</span>
        </div>
        <div className="text-xs text-muted-foreground sm:text-sm">
          © {new Date().getFullYear()} FUXICO by Promo Brindes. Todos os direitos reservados.
        </div>
      </div>
    </div>
  </footer>
);
