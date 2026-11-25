import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, useInView } from 'framer-motion';
import { Eye, EyeOff, Zap, Clock, Send, TrendingUp, Sparkles } from 'lucide-react';
import { fadeInUp, slideInLeft, slideInRight } from './animations';

const beforeItems = [
  { icon: EyeOff, text: 'Enviar email e torcer para ser lido' },
  { icon: Clock, text: 'Esperar dias sem saber o status' },
  { icon: Send, text: 'Follow-up no escuro, sem timing' },
];

const afterItems = [
  { icon: Eye, text: 'Saber em segundos quando foi aberto' },
  { icon: Zap, text: 'Notificação instantânea de leitura' },
  { icon: TrendingUp, text: 'Follow-up no momento exato' },
];

export const BeforeAfterSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        className="mb-12 text-center sm:mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
          <Sparkles className="mr-1 h-3 w-3 text-primary" />
          Transformação
        </Badge>
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Antes vs. <span className="gradient-text">Depois</span> do FUXICO
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
          Veja como o FUXICO transforma sua comunicação por email
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-2">
        {/* Before */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={slideInLeft}
        >
          <Card className="relative h-full overflow-hidden border-2 border-destructive/20 bg-card/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
            <CardContent className="relative p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <EyeOff className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-destructive">Sem FUXICO</h3>
                  <p className="text-xs text-muted-foreground">
                    O dia-a-dia de quem envia emails no escuro
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {beforeItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 rounded-lg border border-destructive/10 bg-destructive/5 p-3"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 text-destructive/60" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 border-t border-destructive/10 pt-4">
                <div className="flex items-center gap-2 text-destructive/70">
                  <TrendingUp className="h-4 w-4 rotate-180" />
                  <span className="text-sm font-medium">Taxa de conversão baixa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* After */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={slideInRight}
        >
          <Card className="relative h-full overflow-hidden border-2 border-primary/30 bg-card/60 shadow-glow backdrop-blur-sm">
            <div className="via-accent/3 absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
            <CardContent className="relative p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="gradient-text font-display text-lg font-bold">Com FUXICO</h3>
                  <p className="text-xs text-muted-foreground">
                    Controle total sobre suas comunicações
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {afterItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3"
                  >
                    <div className="gradient-primary flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg">
                      <item.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 border-t border-primary/15 pt-4">
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+300% na taxa de conversão</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
