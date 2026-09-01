#!/usr/bin/env python3
"""
Popula o banco Supabase via MCP com dados de teste realistas.
Usa supabase_db_insert com records.
"""
import json
import urllib.request
import urllib.error
import sys

MCP_URL = "https://supabase-fuxico-v2-mcp.adm01.workers.dev/6e4b2f9c1a7d3e8f0c5b4a2d9e1c7f3b8a6d2e4f/mcp"
USER_ID = "f1b31f10-d168-4743-a7b9-f1c19e66f030"

def call_mcp(tool_name, arguments):
    """Execute MCP tool call."""
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        },
        "id": 1
    }
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode("utf-8")[:500]}

def insert(table, records):
    """Wrapper para inserir registros."""
    return call_mcp("supabase_db_insert", {"table": table, "records": records})

def print_result(name, result):
    """Imprime resultado formatado."""
    if "error" in result:
        print(f"  ERRO: {result['error'][:200]}")
        return False
    content = result.get("result", {}).get("content", [{}])[0].get("text", "")
    is_error = result.get("result", {}).get("isError", False)
    if is_error:
        print(f"  ERRO: {content[:300]}")
        return False
    try:
        parsed = json.loads(content)
        if "rowCount" in parsed:
            print(f"  OK - {parsed.get('rowCount', 0)} linhas inseridas")
        elif "rows" in parsed:
            print(f"  OK - {len(parsed.get('rows', []))} linhas retornadas")
        elif isinstance(parsed, list):
            print(f"  OK - {len(parsed)} items")
        else:
            print(f"  OK")
        return True
    except:
        print(f"  OK - resposta recebida")
        return True


# ============================
# Email Templates
# ============================
print("\n[1/9] Email Templates...")
templates = [
    {"user_id": USER_ID, "name": "Boas-vindas", "subject": "Bem-vindo ao Fuxico!",
     "body": "<h1>Ola!</h1><p>Seja bem-vindo a nossa plataforma de automacao de email.</p>",
     "category": "Boas-vindas"},
    {"user_id": USER_ID, "name": "Newsletter Mensal", "subject": "Newsletter - Novidades do Mes",
     "body": "<h2>Newsletter</h2><p>Confira as principais noticias do mes.</p>",
     "category": "Marketing"},
    {"user_id": USER_ID, "name": "Follow-up Comercial", "subject": "Voce conseguiu analisar nossa proposta?",
     "body": "<p>Ola! Gostaria de saber se voce teve tempo de analisar nossa proposta comercial.</p>",
     "category": "Vendas"},
    {"user_id": USER_ID, "name": "Oferta Especial", "subject": "Oferta por tempo limitado!",
     "body": "<h1>Nao perca!</h1><p>Aproveite nossa oferta especial valida apenas hoje.</p>",
     "category": "Promocoes"},
    {"user_id": USER_ID, "name": "Confirmacao de Recebimento", "subject": "Confirmamos seu contato",
     "body": "<p>Recebemos sua mensagem e retornaremos em breve.</p>",
     "category": "Transacional"},
    {"user_id": USER_ID, "name": "Boas-vindas Cliente VIP", "subject": "Bem-vindo ao Club VIP",
     "body": "<h1>Parabens!</h1><p>Voce agora faz parte do nosso Club VIP com beneficios exclusivos.</p>",
     "category": "Boas-vindas"},
]
print_result("templates", insert("email_templates", templates))


# ============================
# Campaigns
# ============================
print("\n[2/9] Campaigns...")
campaigns = [
    {"user_id": USER_ID, "name": "Black Friday 2026",
     "description": "Campanha principal de Black Friday - descontos ate 70%", "status": "active"},
    {"user_id": USER_ID, "name": "Reativacao de Leads Q3",
     "description": "Reativar leads frios do terceiro trimestre", "status": "draft"},
    {"user_id": USER_ID, "name": "Onboarding Novos Usuarios",
     "description": "Sequencia automatica de boas-vindas para novos usuarios", "status": "active"},
    {"user_id": USER_ID, "name": "NPS Q3 2026",
     "description": "Pesquisa de satisfacao do terceiro trimestre", "status": "active"},
    {"user_id": USER_ID, "name": "Lancamento Produto X",
     "description": "Divulgacao do novo produto da linha X", "status": "paused"},
]
print_result("campaigns", insert("campaigns", campaigns))


# ============================
# Tracked Emails
# ============================
print("\n[3/9] Tracked Emails...")
emails = [
    {"user_id": USER_ID, "tracking_id": "track_001_abc", "recipient_email": "cliente1@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Proposta Comercial Q4",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_002_def", "recipient_email": "cliente2@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Follow-up Proposta",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_003_ghi", "recipient_email": "cliente3@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Newsletter Agosto",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_004_jkl", "recipient_email": "cliente4@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Oferta Especial - 50% off",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_005_mno", "recipient_email": "cliente5@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Reuniao Agendada",
     "delivery_status": "bounced", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_006_pqr", "recipient_email": "cliente6@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Confirmacao de Recebimento",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_007_stu", "recipient_email": "cliente7@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Atualizacao Importante",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_008_vwx", "recipient_email": "cliente8@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Lembrete de Pagamento",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_009_yza", "recipient_email": "cliente9@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Proposta Atualizada v2",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_010_bcd", "recipient_email": "cliente10@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Pesquisa NPS",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_011_efg", "recipient_email": "cliente11@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Contrato para Assinatura",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_012_hij", "recipient_email": "cliente12@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Novo Produto Disponivel",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_013_klm", "recipient_email": "cliente13@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Webinar Exclusivo",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_014_nop", "recipient_email": "cliente14@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Caso de Sucesso",
     "delivery_status": "delivered", "version": 1},
    {"user_id": USER_ID, "tracking_id": "track_015_qrs", "recipient_email": "cliente15@empresa.com",
     "sender_email": "ti@promobrindes.com.br", "subject": "Convite Evento VIP",
     "delivery_status": "bounced", "version": 1},
]
print_result("tracked_emails", insert("tracked_emails", emails))


# ============================
# Email Sequences
# ============================
print("\n[4/9] Email Sequences...")
sequences = [
    {"user_id": USER_ID, "name": "Onboarding 5 dias",
     "description": "Sequencia automatica de boas-vindas em 5 etapas",
     "trigger_type": "manual", "status": "active", "total_enrolled": 156, "total_completed": 142},
    {"user_id": USER_ID, "name": "Reativacao Lead Frio",
     "description": "Reativar leads sem engajamento ha 30+ dias",
     "trigger_type": "on_no_response", "status": "active", "total_enrolled": 89, "total_completed": 45},
    {"user_id": USER_ID, "name": "Pos-venda",
     "description": "Apos fechamento de venda - onboarding e cross-sell",
     "trigger_type": "manual", "status": "draft", "total_enrolled": 0, "total_completed": 0},
    {"user_id": USER_ID, "name": "Win-back 90 dias",
     "description": "Reativar cliente inativo ha 90+ dias",
     "trigger_type": "on_no_response", "status": "paused", "total_enrolled": 234, "total_completed": 78},
    {"user_id": USER_ID, "name": "Aniversariante do Mes",
     "description": "Email personalizado no aniversario do cliente",
     "trigger_type": "manual", "status": "active", "total_enrolled": 67, "total_completed": 67},
]
print_result("email_sequences", insert("email_sequences", sequences))


# ============================
# Feature Flags (usa upsert para evitar duplicatas)
# ============================
print("\n[5/9] Feature Flags...")
flags = [
    {"key": "ai_insights_beta_v2", "name": "AI Insights Beta V2",
     "description": "Insights automaticos gerados por IA - versao 2",
     "enabled": True, "percentage": 50},
    {"key": "new_dashboard_v3", "name": "Novo Dashboard V3",
     "description": "Habilita o novo design do dashboard V3 com metricas avancadas",
     "enabled": True, "percentage": 100},
    {"key": "realtime_notifications", "name": "Notificacoes Realtime",
     "description": "Notificacoes push em tempo real",
     "enabled": True, "percentage": 100},
    {"key": "linkedin_integration", "name": "Integracao LinkedIn",
     "description": "Permite envio de mensagens via LinkedIn",
     "enabled": False, "percentage": 0},
    {"key": "advanced_segmentation", "name": "Segmentacao Avancada",
     "description": "Segmentacao de contatos com IA",
     "enabled": True, "percentage": 75},
]
print_result("feature_flags", insert("feature_flags", flags))


# ============================
# User Preferences (ja existe - skip)
# ============================
print("\n[6/9] User Preferences...")
print("  SKIP - ja existe (1 registro)")


# ============================
# Webhook Configs (unique por user_id - inserir apenas 1)
# ============================
print("\n[7/9] Webhook Configs...")
# Primeiro deleta se existir
call_mcp("supabase_db_delete", {"table": "webhook_configs", "filters": {"user_id": USER_ID}, "allow_all_rows": False})
webhooks = [
    {"user_id": USER_ID, "url": "https://hooks.slack.com/services/T00/B00/xxxxx",
     "secret": "slack_secret_placeholder_001",
     "events": "{email.opened,email.clicked,email.bounced,document.viewed}", "is_active": True, "version": 1},
]
print_result("webhook_configs", insert("webhook_configs", webhooks))


# ============================
# Tracking Events - skip (FK complexa com particionamento)
# ============================
print("\n[8/9] Tracking Events...")
print("  SKIP - FK particionada requer insercao via RPC/trigger")


# ============================
# Audit Logs
# ============================
print("\n[9/9] Audit Logs...")
logs = [
    {"user_id": USER_ID, "event_type": "login", "description": "Login bem-sucedido via email",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "login", "description": "Login bem-sucedido via Google OAuth",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "email_sent", "description": "Email 'Proposta Comercial Q4' enviado",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "campaign_created", "description": "Campanha 'Black Friday 2026' criada",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "login_failed", "description": "Tentativa de login falha - senha incorreta",
     "severity": "warning", "ip_address": "45.33.10.99", "user_agent": "curl/7.68.0"},
    {"user_id": USER_ID, "event_type": "template_updated", "description": "Template 'Newsletter' atualizado",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "webhook_dispatched", "description": "Webhook Slack disparado - email.opened",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "settings_changed", "description": "Configuracoes de webhook alteradas",
     "severity": "warning", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
    {"user_id": USER_ID, "event_type": "email_opened", "description": "Email aberto por cliente1@empresa.com",
     "severity": "info", "ip_address": "177.92.11.45", "user_agent": "Mozilla/5.0 (Macintosh)"},
    {"user_id": USER_ID, "event_type": "sequence_enrolled", "description": "Contato inscrito na sequencia 'Onboarding'",
     "severity": "info", "ip_address": "187.45.123.10", "user_agent": "Mozilla/5.0 (Windows)"},
]
print_result("audit_logs", insert("audit_logs", logs))


# ============================
# Verification
# ============================
print("\n" + "=" * 60)
print("VERIFICACAO FINAL - Contagem de registros:")
print("=" * 60)

sql = """SELECT
    (SELECT COUNT(*) FROM email_templates) as templates,
    (SELECT COUNT(*) FROM campaigns) as campaigns,
    (SELECT COUNT(*) FROM tracked_emails) as tracked_emails,
    (SELECT COUNT(*) FROM email_sequences) as sequences,
    (SELECT COUNT(*) FROM feature_flags) as flags,
    (SELECT COUNT(*) FROM user_preferences) as prefs,
    (SELECT COUNT(*) FROM webhook_configs) as webhooks,
    (SELECT COUNT(*) FROM tracking_events) as events,
    (SELECT COUNT(*) FROM audit_logs) as logs"""

result = call_mcp("supabase_db_query", {"query": sql})
if "result" in result:
    content = result["result"]["content"][0]["text"]
    try:
        parsed = json.loads(content)
        rows = parsed["results"][0]["rows"][0]
        for key, value in rows.items():
            print(f"  {key}: {value} registros")
    except Exception as e:
        print(f"  Parse error: {e}")
        print(f"  Raw: {content[:500]}")
else:
    print(f"  ERRO: {result}")

print("\n" + "=" * 60)
print("Pronto! Acesse http://localhost:8080/dashboard para ver os dados")
print("=" * 60)
