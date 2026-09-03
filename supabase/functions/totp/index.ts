import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts";
import { createLogger } from '../_shared/logger.ts';
import { protectedHandler } from '../_shared/security-middleware.ts';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const log = createLogger('totp');

const TotpActionSchema = z.object({
  action: z.enum(["setup", "verify", "verify-backup", "disable", "regenerate-backup", "status"]),
  code: z.string().optional(),
  recoveryEmail: z.string().email().optional(),
});

/**
 * Onda 109 — Comparação em tempo constante entre duas strings.
 * XOR acumulado byte a byte; sempre percorre o maior comprimento
 * para que falhas por tamanho também não vazem timing.
 */
function constantTimeEq(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    const x = i < ab.length ? ab[i] : 0;
    const y = i < bb.length ? bb[i] : 0;
    diff |= x ^ y;
  }
  return diff === 0;
}

// Simple TOTP implementation using HMAC-SHA1
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  // eslint-disable-next-line sonarjs/slow-regex -- trailing-only anchored pattern; O(n)
  const cleanedInput = base32.replace(/=+$/, "").toUpperCase();
  const bits: number[] = [];
  
  for (const char of cleanedInput) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }
  
  return bytes;
}

function bytesToBase32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  
  return result;
}

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return bytesToBase32(bytes);
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data as unknown as ArrayBuffer);
  return new Uint8Array(signature);
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const timeStep = 30;
  
  for (let i = -window; i <= window; i++) {
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const timeBytes = new Uint8Array(8);
    let t = time;
    for (let j = 7; j >= 0; j--) {
      timeBytes[j] = t & 0xff;
      t = Math.floor(t / 256);
    }
    
    const key = base32ToBytes(secret);
    const hmac = await hmacSha1(key, timeBytes);
    const offset = hmac[19] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    
    const expectedToken = (code % 1000000).toString().padStart(6, "0");
    
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12)}`);
  }
  return codes;
}



// eslint-disable-next-line sonarjs/cognitive-complexity -- TOTP verify with time-drift windows
Deno.serve(protectedHandler(async (req, corsHeaders) => {
  // Rate limiting - TOTP is security-critical, limit to 5 attempts per minute
  const clientIP = getClientIP(req.headers);
  const rateLimitResult = await checkRateLimit(clientIP, "totp", 5, 60);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ 
        error: "Too many attempts. Please try again later.",
        retryAfter
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter)
        } 
      }
    );
  }


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const validation = TotpActionSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid parameters", details: validation.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { action, code, recoveryEmail } = validation.data;

    switch (action) {
      case "setup": {
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        
        const { error: updateError } = await supabase
          .from("mfa_settings")
          .upsert({
            user_id: user.id,
            totp_secret: secret,
            backup_codes: backupCodes,
            is_enabled: false,
            recovery_email: recoveryEmail || user.email,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (updateError) {
          throw updateError;
        }

        const issuer = "Fuxico";
        const accountName = user.email || user.id;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        return new Response(
          JSON.stringify({
            success: true,
            secret,
            otpauthUrl,
            backupCodes,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: settings, error: fetchError } = await supabase
          .from("mfa_settings")
          .select("totp_secret, is_enabled")
          .eq("user_id", user.id)
          .single();

        if (fetchError || !settings?.totp_secret) {
          return new Response(
            JSON.stringify({ error: "MFA not set up" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid code", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!settings.is_enabled) {
          await supabase
            .from("mfa_settings")
            .update({
              is_enabled: true,
              enrolled_at: new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("mfa_settings")
            .update({
              last_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);
        }

        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "mfa_verified",
          severity: "info",
          description: "MFA code verified successfully",
          ip_address: clientIP,
          user_agent: req.headers.get("user-agent"),
        });

        return new Response(
          JSON.stringify({ success: true, valid: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-backup": {
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Backup code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: settings, error: fetchError } = await supabase
          .from("mfa_settings")
          .select("backup_codes")
          .eq("user_id", user.id)
          .single();

        if (fetchError || !settings?.backup_codes) {
          return new Response(
            JSON.stringify({ error: "No backup codes found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const normalizedCode = code.toUpperCase().replace(/[\s-]/g, "");

        // Onda 109 — Constant-time comparison across ALL backup codes.
        // Always iterates the full list; XOR-accumulated byte diffs prevent
        // early-exit timing signals. Only the first matching index is kept.
        let codeIndex = -1;
        for (let i = 0; i < settings.backup_codes.length; i++) {
          const candidate = (settings.backup_codes[i] as string).replace(/-/g, "");
          const equal = constantTimeEq(candidate, normalizedCode);
          if (equal && codeIndex === -1) codeIndex = i;
        }

        if (codeIndex === -1) {
          // Uniform 50-150ms delay so failure timing does not leak length/position.
          const jitter = 50 + Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000) * 100);
          await new Promise((r) => setTimeout(r, jitter));
          return new Response(
            JSON.stringify({ error: "Invalid backup code", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const newBackupCodes = [...settings.backup_codes];
        newBackupCodes.splice(codeIndex, 1);

        await supabase
          .from("mfa_settings")
          .update({
            backup_codes: newBackupCodes,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "mfa_backup_used",
          severity: "warning",
          description: `Backup code used. ${newBackupCodes.length} codes remaining.`,
          ip_address: clientIP,
          user_agent: req.headers.get("user-agent"),
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            valid: true,
            remainingCodes: newBackupCodes.length 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disable": {
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Code is required to disable MFA" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: settings, error: fetchError } = await supabase
          .from("mfa_settings")
          .select("totp_secret")
          .eq("user_id", user.id)
          .single();

        if (fetchError || !settings?.totp_secret) {
          return new Response(
            JSON.stringify({ error: "MFA not enabled" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("mfa_settings")
          .update({
            is_enabled: false,
            totp_secret: null,
            backup_codes: null,
            enrolled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "mfa_disabled",
          severity: "warning",
          description: "MFA has been disabled",
          ip_address: clientIP,
          user_agent: req.headers.get("user-agent"),
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "regenerate-backup": {
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: settings, error: fetchError } = await supabase
          .from("mfa_settings")
          .select("totp_secret, is_enabled")
          .eq("user_id", user.id)
          .single();

        if (fetchError || !settings?.is_enabled || !settings?.totp_secret) {
          return new Response(
            JSON.stringify({ error: "MFA not enabled" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const newBackupCodes = generateBackupCodes();

        await supabase
          .from("mfa_settings")
          .update({
            backup_codes: newBackupCodes,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "mfa_backup_regenerated",
          severity: "info",
          description: "New backup codes generated",
          ip_address: clientIP,
          user_agent: req.headers.get("user-agent"),
        });

        return new Response(
          JSON.stringify({ success: true, backupCodes: newBackupCodes }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        const { data: settings } = await supabase
          .from("mfa_settings")
          .select("is_enabled, enrolled_at, last_verified_at, recovery_email, backup_codes")
          .eq("user_id", user.id)
          .single();

        return new Response(
          JSON.stringify({
            enabled: settings?.is_enabled ?? false,
            enrolledAt: settings?.enrolled_at,
            lastVerifiedAt: settings?.last_verified_at,
            recoveryEmail: settings?.recovery_email,
            backupCodesRemaining: settings?.backup_codes?.length ?? 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    log.error('TOTP error', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}));
