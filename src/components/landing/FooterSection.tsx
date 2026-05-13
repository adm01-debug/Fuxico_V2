import { Lock, ExternalLink } from "lucide-react";
import logoImg from "@/assets/logo.webp";

interface FooterSectionProps {
  onNavigatePricing: () => void;
  onOpenDemo: () => void;
}

export const FooterSection = ({ onNavigatePricing, onOpenDemo }: FooterSectionProps) => (
  <footer className="border-t border-border/40 py-10 sm:py-14 relative bg-card/20 backdrop-blur-sm">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            <div>
              <span className="font-bold font-display text-lg">FUXICO</span>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Email Tracking Profissional</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            A solução mais completa para rastreamento de emails empresariais.
            Saiba exatamente quando seus emails são lidos e aumente suas conversões.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Produto</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              <button onClick={onNavigatePricing} className="hover:text-primary transition-colors">Preços</button>
            </li>
            <li>
              <button onClick={onOpenDemo} className="hover:text-primary transition-colors">Ver Demo</button>
            </li>
            <li>
              <a href="#features-section" className="hover:text-primary transition-colors">Funcionalidades</a>
            </li>
            <li>
              <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                Extensão Chrome <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
            <li><button onClick={() => window.location.href='/privacy'} className="hover:text-primary transition-colors">Política de Privacidade</button></li>
            <li><button onClick={() => window.location.href='/privacy'} className="hover:text-primary transition-colors">LGPD</button></li>
            <li><a href="mailto:contato@fuxico.app" className="hover:text-primary transition-colors">Contato</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Dados protegidos com criptografia de ponta-a-ponta</span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} FUXICO by Promo Brindes. Todos os direitos reservados.
        </div>
      </div>
    </div>
  </footer>
);
