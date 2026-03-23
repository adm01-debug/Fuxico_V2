import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useScroll } from "framer-motion";
import {
  HeaderSection, HeroSection, StatsSection, FeaturesSection,
  BeforeAfterSection, HowItWorksSection, BenefitsSection,
  TestimonialsSection, CTASection, FooterSection, OrbBackground, DemoModal,
} from "@/components/landing";
import { TrustBar, SecurityBadges } from "@/components/landing/TrustSignals";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const goAuth = () => navigate("/auth");
  const goPricing = () => navigate("/pricing");

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <OrbBackground />

      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 gradient-primary z-[60] origin-left"
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
