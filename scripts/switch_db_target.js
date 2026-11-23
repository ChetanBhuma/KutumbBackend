const fs = require('fs');
const path = require('path');

const target = process.argv[2]?.toLowerCase();
if (!['local', 'cloud'].includes(target)) {
    console.log("Usage: node switch_db_target.js [local|cloud]");
    process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

const localUrl = "postgresql://postgres:root@127.0.0.1:5432/kutumb_local?sslmode=disable";
const cloudPooledUrl = "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const cloudDirectUrl = "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (target === 'local') {
    envContent = envContent
        .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${localUrl}"`)
        .replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${localUrl}"`);
    console.log("Active database switched to: LOCAL (kutumb_local on localhost:5432)");
} else {
    envContent = envContent
        .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${cloudPooledUrl}"`)
        .replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${cloudDirectUrl}"`);
    console.log("Active database switched to: CLOUD (Neon neondb)");
}

fs.writeFileSync(envPath, envContent);

