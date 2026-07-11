# FUXICO — Infrastructure as Code (Terraform)

**Status:** template pronto. Requer tokens para `terraform apply`.

## Escopo
- Projeto Supabase (staging + prod)
- Buckets de storage privados
- Cloudflare (DNS + WAF + CDN de assets)
- GitHub Actions secrets

## Pré-requisitos
1. `SUPABASE_ACCESS_TOKEN` (personal token)
2. `CLOUDFLARE_API_TOKEN` (permission: Zone.DNS, Zone.WAF)
3. `GITHUB_TOKEN` com escopo `repo`
4. Terraform ≥ 1.7

## Uso
```bash
cd infra/terraform
terraform init
terraform workspace new staging
terraform plan -var-file=envs/staging.tfvars
terraform apply -var-file=envs/staging.tfvars
```

Arquivos: `main.tf`, `variables.tf`, `outputs.tf`, `envs/{staging,prod}.tfvars`.
Nunca commitar `*.tfstate` — armazenado em bucket S3 remoto (`backend.tf`).
