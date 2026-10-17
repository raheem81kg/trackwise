import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const ATTACHMENT_STATUSES = ["PENDING", "READY"] as const;

export const attachmentStatus = pgEnum(
	"attachment_status",
	ATTACHMENT_STATUSES,
);

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

export const storageDeletion = pgTable(
	"storage_deletion",
	{
		id: text("id").primaryKey(),
		objectKey: text("object_key").notNull().unique(),
		attempts: integer("attempts").default(0).notNull(),
		lastError: text("last_error"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		processedAt: timestamp("processed_at"),
	},
	(table) => [
		index("storage_deletion_pending_idx").on(
			table.processedAt,
			table.createdAt,
		),
	],
);
