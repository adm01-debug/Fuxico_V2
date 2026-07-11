variable "supabase_org_id"     { type = string }
variable "supabase_region"     { type = string, default = "sa-east-1" }
variable "db_password"         { type = string, sensitive = true }
variable "cloudflare_zone_id"  { type = string }
variable "github_repo"         { type = string }
