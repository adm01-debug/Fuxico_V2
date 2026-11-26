import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { fadeInUp, staggerContainer } from './animations';

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Diretor Comercial',
    company: 'TechCorp',
    content:
      'O FUXICO revolucionou nossa estratégia de follow-up. Agora sabemos exatamente quando ligar.',
    avatar: 'CS',
    rating: 5,
  },
  {
    name: 'Ana Santos',
    role: 'Gerente de Vendas',
    company: 'StartupX',
    content: 'Aumentamos nossa taxa de conversão em 40% usando os insights do FUXICO.',
    avatar: 'AS',
    rating: 5,
  },
  {
    name: 'Pedro Oliveira',
    role: 'CEO',
    company: 'AgênciaDigital',
    content: 'Ferramenta essencial para qualquer profissional que trabalha com emails.',
    avatar: 'PO',
    rating: 5,
  },
];

export const TestimonialsSection = () => (
  <section className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24">
    <div className="via-primary/3 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

    <motion.div
      className="relative mb-12 text-center sm:mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
        Depoimentos
      </Badge>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        O que dizem nossos <span className="gradient-text">usuários</span>
      </h2>
    </motion.div>

    <motion.div
      className="relative mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {testimonials.map((testimonial, index) => (
        <motion.div key={index} variants={fadeInUp}>
          <Card className="group h-full border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <div className="mb-4 flex items-center gap-0.5">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="mb-6 text-sm italic leading-relaxed text-muted-foreground sm:text-base">
              "{testimonial.content}"
            </p>
            <div className="mt-auto flex items-center gap-3">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md transition-shadow group-hover:shadow-lg">
                {testimonial.avatar}
              </div>
              <div>
                <div className="text-sm font-semibold">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">
                  {testimonial.role} • {testimonial.company}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
