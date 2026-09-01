terraform {
  required_version = ">= 1.7.0"
  required_providers {
    supabase   = { source = "supabase/supabase", version = "~> 1.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.0" }
    github     = { source = "integrations/github", version = "~> 6.0" }
  }
  backend "s3" {
    bucket         = "fuxico-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fuxico-tflock"
  }
}

# -----------------------------------------------------------------------------
# Supabase project (staging OR prod, selected per workspace)
# -----------------------------------------------------------------------------
resource "supabase_project" "this" {
  organization_id   = var.supabase_org_id
  name              = "fuxico-${terraform.workspace}"
  database_password = var.db_password
  region            = var.supabase_region
}

# -----------------------------------------------------------------------------
# Cloudflare — DNS + WAF + CDN
# -----------------------------------------------------------------------------
resource "cloudflare_zone_settings_override" "hardened" {
  zone_id = var.cloudflare_zone_id
  settings {
    always_use_https = "on"
    min_tls_version  = "1.2"
    security_level   = "high"
    browser_check    = "on"
    ssl              = "strict"
  }
}

resource "cloudflare_ruleset" "waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "fuxico-waf-${terraform.workspace}"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = "block"
    description = "Block known bad bots on tracking endpoints"
    expression  = "(http.request.uri.path contains \"/track-\" and cf.client.bot)"
    enabled     = true
  }

  rules {
    action      = "challenge"
    description = "Challenge suspicious IPs on auth"
    expression  = "(http.request.uri.path contains \"/auth\" and ip.src.country in {\"CN\" \"RU\" \"KP\"})"
    enabled     = true
  }
}

# -----------------------------------------------------------------------------
# GitHub Actions secrets (auto-populated from Supabase outputs)
# -----------------------------------------------------------------------------
resource "github_actions_secret" "supabase_url" {
  repository      = var.github_repo
  secret_name     = "SUPABASE_URL_${upper(terraform.workspace)}"
  plaintext_value = supabase_project.this.database_url
}
