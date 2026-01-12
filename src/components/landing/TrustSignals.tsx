import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle2, Award, Globe, Clock } from "lucide-react";

const trustItems = [
  {
    icon: Shield,
    title: "Dados Protegidos",
    description: "Criptografia SSL/TLS 256-bit",
  },
  {
    icon: Lock,
    title: "LGPD Compliant",
    description: "Seus dados estão seguros",
  },
  {
    icon: CheckCircle2,
    title: "99.9% Uptime",
    description: "SLA garantido",
  },
  {
    icon: Award,
    title: "Suporte Dedicado",
    description: "Resposta em até 24h",
  },
];

const companyLogos = [
  "TechCorp",
  "StartupX", 
  "AgênciaDigital",
  "Vendas Pro",
  "Marketing Plus",
];

export const TrustBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-y border-border/50 bg-muted/30 py-8"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const CompanyLogos = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-12 border-b border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Empresas que confiam no FUXICO
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {companyLogos.map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {company}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Security badges
export const SecurityBadges = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-wrap items-center justify-center gap-4 py-6"
    >
      {[
        { icon: Shield, label: "SSL Secured" },
        { icon: Lock, label: "LGPD" },
        { icon: Globe, label: "Global CDN" },
        { icon: Clock, label: "24/7 Monitoring" },
      ].map((badge, index) => (
        <motion.div
          key={badge.label}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground"
        >
          <badge.icon className="h-3.5 w-3.5" />
          {badge.label}
        </motion.div>
      ))}
    </motion.div>
  );
};
