import { z } from 'zod';

export const feedbackSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  categoria: z.enum(['elogio', 'sugestao', 'reclamacao', 'duvida']),
  anonimo: z.coerce.boolean().default(false),
  prioridade: z.enum(['baixa', 'media', 'alta']).default('media'),
  status: z.enum(['novo', 'em_analise', 'respondido', 'arquivado']).default('novo'),
  departamento_destino: z.string().optional(),
});

export const enqueteSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  data_inicio: z.string(),
  data_fim: z.string(),
  ativa: z.coerce.boolean().default(true),
  anonima: z.coerce.boolean().default(true),
});

export const fuxicoImportTemplates = {
  feedbacks: [
    { key: 'titulo', label: 'Título', example: 'Sugestão de melhoria' },
    { key: 'categoria', label: 'Categoria', example: 'sugestao' },
    { key: 'prioridade', label: 'Prioridade', example: 'media' },
    { key: 'descricao', label: 'Descrição', example: 'Descrição do feedback' },
  ],
};

export const fuxicoFilterConfigs = {
  feedbacks: [
    { key: 'categoria', label: 'Categoria', type: 'select' as const, options: [
      { value: 'elogio', label: 'Elogio' },
      { value: 'sugestao', label: 'Sugestão' },
      { value: 'reclamacao', label: 'Reclamação' },
      { value: 'duvida', label: 'Dúvida' },
    ]},
    { key: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'novo', label: 'Novo' },
      { value: 'em_analise', label: 'Em Análise' },
      { value: 'respondido', label: 'Respondido' },
      { value: 'arquivado', label: 'Arquivado' },
    ]},
  ],
};
