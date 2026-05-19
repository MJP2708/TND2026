import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention for local secrets), then .env as fallback
config({ path: resolve(process.cwd(), ".env.local"), override: true });
config({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
