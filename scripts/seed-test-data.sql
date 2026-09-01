-- Email Templates
INSERT INTO email_templates (user_id, name, subject, body, category) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Boas-vindas', 'Bem-vindo ao Fuxico!', '<h1>Ola!</h1><p>Seja bem-vindo a nossa plataforma de automacao de email.</p>', 'Boas-vindas'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Newsletter', 'Newsletter Mensal', '<h2>Newsletter</h2><p>Confira as novidades do mes.</p>', 'Marketing'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Follow-up', 'Voce viu nossa proposta?', '<p>Ola! Gostaria de saber se voce teve tempo de analisar nossa proposta.</p>', 'Vendas'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Oferta Especial', 'Oferta por tempo limitado!', '<h1>Nao perca!</h1><p>Aproveite nossa oferta especial valida apenas hoje.</p>', 'Promocoes');

-- Campaigns
INSERT INTO campaigns (user_id, name, description, status) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Black Friday 2026', 'Campanha principal de Black Friday', 'active'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Reativacao de Leads', 'Reativar leads frios do Q3', 'draft'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Onboarding Novos Usuarios', 'Sequencia de boas-vindas automatica', 'active');

-- Tracked Emails (com dados realistas para o dashboard mostrar metricas)
INSERT INTO tracked_emails (user_id, tracking_id, recipient_email, sender_email, subject, delivery_status, created_at) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_001_abc', 'cliente1@empresa.com', 'ti@promobrindes.com.br', 'Proposta Comercial Q4', 'delivered', NOW() - INTERVAL '5 days'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_002_def', 'cliente2@empresa.com', 'ti@promobrindes.com.br', 'Follow-up Proposta', 'opened', NOW() - INTERVAL '4 days'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_003_ghi', 'cliente3@empresa.com', 'ti@promobrindes.com.br', 'Newsletter Agosto', 'clicked', NOW() - INTERVAL '3 days'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_004_jkl', 'cliente4@empresa.com', 'ti@promobrindes.com.br', 'Oferta Especial', 'delivered', NOW() - INTERVAL '2 days'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_005_mno', 'cliente5@empresa.com', 'ti@promobrindes.com.br', 'Reuniao Agendada', 'bounced', NOW() - INTERVAL '1 day'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_006_pqr', 'cliente6@empresa.com', 'ti@promobrindes.com.br', 'Confirmacao de Recebimento', 'opened', NOW() - INTERVAL '12 hours'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_007_stu', 'cliente7@empresa.com', 'ti@promobrindes.com.br', 'Atualizacao Importante', 'clicked', NOW() - INTERVAL '6 hours'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'track_008_vwx', 'cliente8@empresa.com', 'ti@promobrindes.com.br', 'Lembrete de Pagamento', 'delivered', NOW() - INTERVAL '2 hours');

-- Email Sequences
INSERT INTO email_sequences (user_id, name, description, trigger_type, status) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Onboarding 5 dias', 'Sequencia automatica de boas-vindas', 'signup', 'active'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Reativacao Lead Frio', 'Reativar leads sem engajamento 30+ dias', 'inactivity', 'active'),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Pos-venda', 'Apos fechamento de venda', 'purchase', 'draft');

-- Feature Flags
INSERT INTO feature_flags (key, name, description, enabled, percentage) VALUES
('new_dashboard_v2', 'Novo Dashboard V2', 'Habilita o novo design do dashboard', true, 100),
('ai_insights_beta', 'AI Insights Beta', 'Insights automaticos com IA', true, 50),
('dark_mode', 'Modo Escuro', 'Tema escuro para a aplicacao', true, 100),
('whatsapp_integration', 'Integracao WhatsApp', 'Permite envio via WhatsApp', false, 0);

-- User Preferences
INSERT INTO user_preferences (user_id, theme, language, notifications_enabled, email_notifications) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'dark', 'pt-BR', true, true)
ON CONFLICT (user_id) DO NOTHING;

-- Webhook Configs
INSERT INTO webhook_configs (user_id, name, url, events, enabled) VALUES
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Slack Notificacoes', 'https://hooks.slack.com/services/T00/B00/xxxxx', ARRAY['email.opened', 'email.clicked'], true),
('f1b31f10-d168-4743-a7b9-f1c19e66f030', 'Zapier CRM', 'https://hooks.zapier.com/hooks/catch/xxxxx', ARRAY['email.bounced', 'document.viewed'], false);
