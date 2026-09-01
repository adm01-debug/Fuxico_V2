import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Diretor Comercial",
    company: "TechCorp",
    content: "O FUXICO revolucionou nossa estratégia de follow-up. Agora sabemos exatamente quando ligar.",
    avatar: "CS",
    rating: 5,
  },
  {
    name: "Ana Santos",
    role: "Gerente de Vendas",
    company: "StartupX",
    content: "Aumentamos nossa taxa de conversão em 40% usando os insights do FUXICO.",
    avatar: "AS",
    rating: 5,
  },
  {
    name: "Pedro Oliveira",
    role: "CEO",
    company: "AgênciaDigital",
    content: "Ferramenta essencial para qualquer profissional que trabalha com emails.",
    avatar: "PO",
    rating: 5,
  }
];

export const TestimonialsSection = () => (
  <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

    <motion.div
      className="text-center mb-12 sm:mb-16 relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">Depoimentos</Badge>
      <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
        O que dizem nossos <span className="gradient-text">usuários</span>
      </h2>
    </motion.div>

    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {testimonials.map((testimonial, index) => (
        <motion.div key={index} variants={fadeInUp}>
          <Card className="p-6 h-full bg-card/60 backdrop-blur-sm border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
            <div className="flex items-center gap-0.5 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.content}"</p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:shadow-lg transition-shadow">
                {testimonial.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.company}</div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
