import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { attachmentStatus } from "./tasks";

export const attachment = pgTable(
   "attachment",
   {
      id: text("id").primaryKey(),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      objectKey: text("object_key").notNull().unique(),
      fileName: text("file_name").notNull(),
      contentType: text("content_type").notNull(),
      size: integer("size").notNull(),
      status: attachmentStatus("status").default("PENDING").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [index("attachment_user_idx").on(table.userId)],
);
