import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function setupDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    const tmpDb = "/tmp/dev.db";
    try {
      if (!fs.existsSync(tmpDb)) {
        const candidates = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
          path.resolve("./prisma/dev.db"),
        ];

        let copied = false;
        for (const src of candidates) {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, tmpDb);
            copied = true;
            console.log(`[UD-Class] Copied SQLite database to ${tmpDb} from ${src}`);
            break;
          }
        }

        if (!copied) {
          console.warn("[UD-Class] Warning: Source SQLite dev.db not found for copying to /tmp");
        }
      }
      return `file:${tmpDb}`;
    } catch (err) {
      console.error("[UD-Class] Error preparing SQLite in /tmp:", err);
    }
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

process.env.DATABASE_URL = setupDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
