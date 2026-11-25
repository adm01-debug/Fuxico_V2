import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion, useScroll } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
// VARIANTS and TRANSITIONS imports removed to fix unused import error
import {
  HeaderSection,
  HeroSection,
  StatsSection,
  FeaturesSection,
  BeforeAfterSection,
  HowItWorksSection,
  BenefitsSection,
  TestimonialsSection,
  CTASection,
  FooterSection,
  OrbBackground,
  DemoModal,
} from '@/components/landing';
import { TrustBar, SecurityBadges } from '@/components/landing/TrustSignals';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const goAuth = () => navigate('/auth');
  const goPricing = () => navigate('/pricing');

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <Helmet>
        <title>FUXICO | Rastreamento de Emails Profissional</title>
        <meta
          name="description"
          content="Saiba exatamente quando seus emails são lidos com a plataforma FUXICO. Inteligência para seu comercial."
        />
      </Helmet>

      <OrbBackground />

      {/* Progress bar */}
      <motion.div
        className="gradient-primary fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <HeaderSection onNavigateAuth={goAuth} />
      <HeroSection onNavigateAuth={goAuth} onOpenDemo={() => setDemoOpen(true)} />
      <StatsSection />
      <TrustBar />
      <FeaturesSection />
      <BeforeAfterSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <CTASection onNavigateAuth={goAuth} />
      <SecurityBadges />
      <FooterSection onNavigatePricing={goPricing} onOpenDemo={() => setDemoOpen(true)} />

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default Index;
