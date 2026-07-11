/**
 * Seed sintético para ambiente de staging.
 * Uso: STAGING_SERVICE_ROLE=... bun run scripts/seed-staging.ts
 * Nunca executar contra prod — checagem explícita abaixo.
 */
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

const url = process.env.STAGING_SUPABASE_URL;
const key = process.env.STAGING_SERVICE_ROLE;

if (!url?.includes("staging")) {
  console.error("❌ Recusando executar: URL não parece ser staging.");
  process.exit(1);
}
if (!key) {
  console.error("❌ STAGING_SERVICE_ROLE ausente.");
  process.exit(1);
}

const supabase = createClient(url, key);

const USERS = 100;
const EMAILS_PER_USER = 500;

async function main() {
  console.log(`Seeding ${USERS} users × ${EMAILS_PER_USER} emails...`);
  for (let u = 0; u < USERS; u++) {
    const email = faker.internet.email();
    const { data: user } = await supabase.auth.admin.createUser({
      email, password: "StagingPass123!", email_confirm: true,
    });
    if (!user?.user) continue;

    const emails = Array.from({ length: EMAILS_PER_USER }, () => ({
      user_id: user.user.id,
      tracking_id: faker.string.alphanumeric(32),
      recipient_email: faker.internet.email(),
      sender_email: email,
      subject: faker.lorem.sentence(),
      delivery_status: faker.helpers.arrayElement(["sent", "delivered", "bounced"]),
    }));
    await supabase.from("tracked_emails").insert(emails);
    if (u % 10 === 0) console.log(`  ${u}/${USERS}`);
  }
  console.log("✅ Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
