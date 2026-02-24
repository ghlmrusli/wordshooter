import "dotenv/config";
import { defineConfig } from "prisma/config";

// For local dev, TURSO_DATABASE_URL is "file:./prisma/dev.db" — works directly.
// For Turso cloud, Prisma CLI doesn't understand libsql://, so we skip it
// and use `turso db shell` + `prisma migrate diff` instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["TURSO_DATABASE_URL"],
  },
});
