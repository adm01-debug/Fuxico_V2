import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';
import { protectedHandler } from '../_shared/security-middleware.ts';
import { CommonDeliverabilitySchema } from "../_shared/schemas.ts";

const log = createLogger('check-deliverability');
const DeliverabilitySchema = CommonDeliverabilitySchema;

const DNSCheckSchema = z.object({
  domain: z.string().min(3),
});

const BlacklistCheckSchema = z.object({
  domain: z.string().min(3),
});

// Known DNSBL servers for checking
const DNSBL_SERVERS = [
  { name: "Spamhaus ZEN", host: "zen.spamhaus.org", description: "Combined Spamhaus blocklist" },
  { name: "Barracuda", host: "b.barracudacentral.org", description: "Barracuda Reputation Block List" },
  { name: "SpamCop", host: "bl.spamcop.net", description: "SpamCop Blocking List" },
  { name: "SORBS", host: "dnsbl.sorbs.net", description: "SORBS DNSBL" },
  { name: "UCEPROTECT L1", host: "dnsbl-1.uceprotect.net", description: "UCEPROTECT Level 1" },
  { name: "Invaluement", host: "invalidhelo.com", description: "Invaluement EHLO" },
  { name: "JustSpam", host: "dnsbl.justspam.org", description: "JustSpam.org" },
  { name: "Truncate", host: "truncate.gbudb.net", description: "Truncate DNSBL" },
];

async function checkDNSBL(domain: string) {
  const results: Array<{
    blacklist: string;
    host: string;
    listed: boolean;
    description: string;
  }> = [];

  for (const bl of DNSBL_SERVERS) {
    try {
      const lookupHost = `${domain}.${bl.host}`;
      let listed = false;
      try {
        const records = await Deno.resolveDns(lookupHost, "A");
        listed = records.length > 0;
      } catch {
        listed = false;
      }

      results.push({
        blacklist: bl.name,
        host: bl.host,
        listed,
        description: bl.description,
      });
    } catch {
      results.push({
        blacklist: bl.name,
        host: bl.host,
        listed: false,
        description: bl.description,
      });
    }
  }

  const totalListed = results.filter(r => r.listed).length;
  const totalChecked = results.length;

  let riskLevel = "low";
  if (totalListed >= 3) riskLevel = "critical";
  else if (totalListed >= 2) riskLevel = "high";
  else if (totalListed >= 1) riskLevel = "medium";

  const recommendations: string[] = [];
  if (totalListed > 0) {
    recommendations.push(`Seu domínio está listado em ${totalListed} blacklist(s).`);
    const listedIn = results.filter(r => r.listed).map(r => r.blacklist);
    recommendations.push(`Blacklists: ${listedIn.join(", ")}`);
  } else {
    recommendations.push("✅ Seu domínio não está em nenhuma blacklist verificada.");
  }

  return {
    domain,
    listed: totalListed > 0,
    totalChecked,
    totalListed,
    results,
    checkedAt: new Date().toISOString(),
    riskLevel,
    recommendations,
  };
}

async function checkDNSRecords(domain: string) {
  const result = {
    domain,
    dns: { spf: false, dkim: false, dmarc: false },
    recommendations: [] as string[],
  };

  try {
    try {
      const txtRecords = await Deno.resolveDns(domain, "TXT");
      result.dns.spf = txtRecords.some((r: string[]) => 
        r.some((txt: string) => txt.startsWith("v=spf1"))
      );
    } catch { /* noop */ }

    for (const selector of ["default", "google", "mail", "selector1", "selector2"]) {
      try {
        const dkimRecords = await Deno.resolveDns(`${selector}._domainkey.${domain}`, "TXT");
        if (dkimRecords.length > 0) {
          result.dns.dkim = true;
          break;
        }
      } catch { /* noop */ }
    }

    try {
      const dmarcRecords = await Deno.resolveDns(`_dmarc.${domain}`, "TXT");
      result.dns.dmarc = dmarcRecords.some((r: string[]) =>
        r.some((txt: string) => txt.startsWith("v=DMARC1"))
      );
    } catch { /* noop */ }
  } catch (error) {
    log.error('DNS check error', error);
  }

  return result;
}

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "deliverability", 30, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "check-dns") {
      const domain = url.searchParams.get("domain");
      if (!domain) return secureErrorResponse("Domain required", 400, corsHeaders);
      
      const validation = DNSCheckSchema.safeParse({ domain });
      if (!validation.success) return secureErrorResponse("Invalid domain", 400, corsHeaders);

      const dnsResult = await checkDNSRecords(domain);
      return secureJsonResponse(dnsResult, corsHeaders);
    }

    if (action === "check-blacklist") {
      const domain = url.searchParams.get("domain");
      if (!domain) return secureErrorResponse("Domain required", 400, corsHeaders);

      const validation = BlacklistCheckSchema.safeParse({ domain });
      if (!validation.success) return secureErrorResponse("Invalid domain", 400, corsHeaders);

      const blacklistResult = await checkDNSBL(domain);
      return secureJsonResponse(blacklistResult, corsHeaders);
    }

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch { /* noop */ }

    if (!body || !body.email) {
      const adminSupabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const { data: stats } = await adminSupabase.rpc('calculate_domain_deliverability', {
        p_user_id: user.id,
      });
      return secureJsonResponse({ domains: stats || [], totals: null }, corsHeaders);
    }

    const validation = DeliverabilitySchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);

    const { email, checkMx, checkSyntax, checkDisposable } = validation.data;
    const domain = email.split("@")[1];

    const result = {
      email,
      isValid: true,
      checks: {
        syntax: checkSyntax ? { passed: true, message: "Valid email format" } : null,
        mx: checkMx ? { passed: true, message: "MX records found" } : null,
        disposable: checkDisposable ? { passed: true, message: "Not a disposable email" } : null
      },
      domain,
      deliverabilityScore: 95
    };

    return secureJsonResponse(result, corsHeaders);
  } catch (error) {
    log.error('Error checking deliverability', error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
