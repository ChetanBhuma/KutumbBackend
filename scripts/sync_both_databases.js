const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function syncBothDatabases() {
  console.log("=================================================");
  console.log(" KUTUMB DUAL DATABASE SCHEMA SYNCHRONIZATION");
  console.log("=================================================\n");

  const rootDir = path.join(__dirname, "..");
  const localUrl =
    "postgresql://postgres:root@127.0.0.1:5432/kutumb_local?sslmode=disable";
  const cloudUrl =
    "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

  // 1. Sync Local Database
  console.log(
    "--> [1/2] Syncing LOCAL Database (localhost:5432 / kutumb_local)...",
  );
  try {
    execSync(
      `npx cross-env DATABASE_URL="${localUrl}" DIRECT_URL="${localUrl}" npx prisma db push --skip-generate`,
      {
        cwd: rootDir,
        stdio: "inherit",
      },
    );
    console.log(
      "SUCCESS: Local Database is now 100% in sync with Prisma schema.\n",
    );
  } catch (err) {
    console.error("FAILED to sync Local Database:", err.message);
  }

  // 2. Sync Cloud Neon Database
  console.log("--> [2/2] Syncing CLOUD Database (Neon AWS / neondb)...");
  try {
    execSync(
      `npx cross-env DATABASE_URL="${cloudUrl}" DIRECT_URL="${cloudUrl}" npx prisma db push --skip-generate`,
      {
        cwd: rootDir,
        stdio: "inherit",
      },
    );
    console.log(
      "SUCCESS: Cloud Neon Database is now 100% in sync with Prisma schema.\n",
    );
  } catch (err) {
    console.error("FAILED to sync Cloud Database:", err.message);
  }

  // 3. Regenerate Prisma Client
  console.log("--> Regenerating Prisma Client TypeScript models...");
  try {
    execSync(`npx prisma generate`, {
      cwd: rootDir,
      stdio: "inherit",
    });
    console.log("\nALL DONE! Both Local and Cloud databases are synchronized.");
  } catch (err) {
    console.error("Failed to generate client:", err.message);
  }
}

syncBothDatabases();

