import { HeaderSection } from "@/components/landing/HeaderSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  
  const onNavigateAuth = () => navigate("/auth");
  const onNavigatePricing = () => navigate("/pricing");
  const onOpenDemo = () => navigate("/auth"); // Fallback for demo in this context

  return (
    <div className="min-h-screen bg-background">
      <HeaderSection onNavigateAuth={onNavigateAuth} />
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade (LGPD)</h1>
        <section className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            O FUXICO está comprometido com a sua privacidade e a proteção de seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
          
          <h2 className="text-2xl font-semibold">1. Dados Coletados</h2>
          <p>
            Coletamos apenas os dados necessários para o funcionamento do rastreamento de e-mails, como endereço de e-mail do destinatário, data/hora de abertura e cliques em links.
          </p>
          
          <h2 className="text-2xl font-semibold">2. Uso dos Dados</h2>
          <p>
            Os dados são utilizados exclusivamente para fornecer relatórios de engajamento ao usuário que enviou o e-mail. Não vendemos ou compartilhamos dados com terceiros.
          </p>
          
          <h2 className="text-2xl font-semibold">3. Seus Direitos (LGPD)</h2>
          <p>
            Você tem direito a:
          </p>
          <ul className="list-disc pl-6">
            <li>Confirmar a existência de tratamento de seus dados.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos ou inexatos.</li>
            <li>Solicitar a exclusão de seus dados (Direito ao Esquecimento).</li>
          </ul>
          
          <h2 className="text-2xl font-semibold">4. Exclusão de Dados</h2>
          <p>
            Você pode solicitar a exclusão total de sua conta e dados associados através das configurações do seu painel de controle.
          </p>
        </section>
      </main>
      <FooterSection onNavigatePricing={onNavigatePricing} onOpenDemo={onOpenDemo} />
    </div>
  );
}
