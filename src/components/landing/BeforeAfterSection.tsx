import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import { Eye, EyeOff, Zap, Clock, Send, TrendingUp, Sparkles } from "lucide-react";
import { fadeInUp, slideInLeft, slideInRight } from "./animations";

const beforeItems = [
  { icon: EyeOff, text: "Enviar email e torcer para ser lido" },
  { icon: Clock, text: "Esperar dias sem saber o status" },
  { icon: Send, text: "Follow-up no escuro, sem timing" },
];

const afterItems = [
  { icon: Eye, text: "Saber em segundos quando foi aberto" },
  { icon: Zap, text: "Notificação instantânea de leitura" },
  { icon: TrendingUp, text: "Follow-up no momento exato" },
];

export const BeforeAfterSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
      <motion.div
        className="text-center mb-12 sm:mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
          <Sparkles className="h-3 w-3 mr-1 text-primary" />
          Transformação
        </Badge>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
          Antes vs. <span className="gradient-text">Depois</span> do FUXICO
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
          Veja como o FUXICO transforma sua comunicação por email
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* Before */}
        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={slideInLeft}>
          <Card className="relative overflow-hidden border-2 border-destructive/20 bg-card/60 backdrop-blur-sm h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <EyeOff className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-destructive">Sem FUXICO</h3>
                  <p className="text-xs text-muted-foreground">O dia-a-dia de quem envia emails no escuro</p>
                </div>
              </div>
              <div className="space-y-4">
                {beforeItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <item.icon className="h-5 w-5 text-destructive/60 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-destructive/10">
                <div className="flex items-center gap-2 text-destructive/70">
                  <TrendingUp className="h-4 w-4 rotate-180" />
                  <span className="text-sm font-medium">Taxa de conversão baixa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* After */}
        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={slideInRight}>
          <Card className="relative overflow-hidden border-2 border-primary/30 bg-card/60 backdrop-blur-sm h-full shadow-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-transparent" />
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display gradient-text">Com FUXICO</h3>
                  <p className="text-xs text-muted-foreground">Controle total sobre suas comunicações</p>
                </div>
              </div>
              <div className="space-y-4">
                {afterItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15"
                  >
                    <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-primary/15">
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
