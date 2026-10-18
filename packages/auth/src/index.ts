import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@trackwise/db";
import * as schema from "@trackwise/db/schema/auth";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

export type AuthConfig = {
   BETTER_AUTH_URL: string;
   BETTER_AUTH_SECRET: string;
   GOOGLE_CLIENT_ID?: string;
   GOOGLE_CLIENT_SECRET?: string;
};

export function createAuth(env: AuthConfig, database: Database) {
   return betterAuth({
      database: drizzleAdapter(database, {
         provider: "pg",
         schema,
      }),
      trustedOrigins: [env.BETTER_AUTH_URL],
      account: {
         encryptOAuthTokens: true,
      },
      socialProviders:
         env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                 google: {
                    clientId: env.GOOGLE_CLIENT_ID,
                    clientSecret: env.GOOGLE_CLIENT_SECRET,
                    hd: "intellibus.com",
                    prompt: "select_account",
                 },
              }
            : {},
      rateLimit: {
         enabled: true,
         storage: "database",
      },
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      databaseHooks: {
         user: {
            create: {
               before: async (user) => {
                  if (!user.email?.endsWith("@intellibus.com")) {
                     throw new APIError("FORBIDDEN", {
                        message: "Only @intellibus.com accounts are allowed",
                     });
                  }
               },
            },
         },
      },
      plugins: [nextCookies()],
   });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
