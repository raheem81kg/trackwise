import { randomUUID } from "node:crypto";
import type { Database } from "@trackwise/db";
import { storageDeletion } from "@trackwise/db/schema/tasks";
import { eq, inArray } from "drizzle-orm";

import type { AttachmentStorage } from "./storage";

export async function queueStorageDeletions(db: Database, objectKeys: string[]) {
   if (!objectKeys.length) return;
   await db
      .insert(storageDeletion)
      .values(objectKeys.map((objectKey) => ({ id: randomUUID(), objectKey })))
      .onConflictDoNothing({ target: storageDeletion.objectKey });
}

export async function processStorageDeletions(db: Database, storage: AttachmentStorage, objectKeys: string[]) {
   if (!objectKeys.length) return;
   try {
      await storage.deleteObjects(objectKeys);
      await db
         .update(storageDeletion)
         .set({ processedAt: new Date(), lastError: null })
         .where(inArray(storageDeletion.objectKey, objectKeys));
   } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Storage deletion failed";
      for (const objectKey of objectKeys) {
         const [record] = await db
            .select({ attempts: storageDeletion.attempts })
            .from(storageDeletion)
            .where(eq(storageDeletion.objectKey, objectKey))
            .limit(1);
         await db
            .update(storageDeletion)
            .set({ attempts: (record?.attempts ?? 0) + 1, lastError: message })
            .where(eq(storageDeletion.objectKey, objectKey));
      }
   }
}
