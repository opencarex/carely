import fs from "node:fs";

// Load environment variables (.env first, then .env.local to override)
for (const envFile of [".env", ".env.local"]) {
  if (fs.existsSync(envFile)) {
    try {
      process.loadEnvFile(envFile);
    } catch {
      // Ignore if loadEnvFile fails
    }
  }
}

async function seedAdmin() {
  const { seedAdminEnvSchema } = await import("../lib/schemas/env");
  const result = seedAdminEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      "Configuration error: Invalid or missing administrator seed credentials."
    );
    const formatted = result.error.format();
    if (formatted.ADMIN_EMAIL?._errors) {
      console.error(`  ADMIN_EMAIL: ${formatted.ADMIN_EMAIL._errors.join(", ")}`);
    }
    if (formatted.ADMIN_PASSWORD?._errors) {
      console.error(`  ADMIN_PASSWORD: ${formatted.ADMIN_PASSWORD._errors.join(", ")}`);
    }
    process.exit(1);
  }

  const { adminEmails, ADMIN_PASSWORD } = result.data;

  const { db } = await import("../lib/db");
  const { hashPassword } = await import("better-auth/crypto");
  const { eq } = await import("drizzle-orm");
  const { account, user } = await import("../lib/db/schema/auth");

  console.log(`Processing ${adminEmails.length} administrator account(s)...`);

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);
  let createdCount = 0;
  let existingCount = 0;

  for (const email of adminEmails) {
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  - [EXISTS] ${email} (id: ${existing[0].id})`);
      existingCount++;
      continue;
    }

    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: "System Administrator",
        email: email,
        emailVerified: true,
        role: "admin",
        banned: false,
      });

      await tx.insert(account).values({
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      });
    });

    console.log(`  - [CREATED] ${email} (id: ${userId})`);
    createdCount++;
  }

  console.log("\nSeeding Summary:");
  console.log(`  Total configured: ${adminEmails.length}`);
  console.log(`  Newly created:    ${createdCount}`);
  console.log(`  Already existed:  ${existingCount}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
