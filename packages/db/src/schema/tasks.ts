import {
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const TEAM_ROLES = ["MEMBER", "ADMIN"] as const;
export const INVITATION_STATUSES = [
	"PENDING",
	"ACCEPTED",
	"DECLINED",
	"CANCELLED",
	"EXPIRED",
] as const;
export const NOTIFICATION_TYPES = [
	"INVITATION_RECEIVED",
	"INVITATION_ACCEPTED",
	"INVITATION_DECLINED",
	"INVITATION_CANCELLED",
	"MEMBER_JOINED",
	"MEMBER_LEFT",
	"ROLE_CHANGED",
] as const;
export const ACTIVITY_TYPES = [
	"INVITATION_SENT",
	"INVITATION_ACCEPTED",
	"INVITATION_DECLINED",
	"INVITATION_CANCELLED",
	"MEMBER_JOINED",
	"MEMBER_LEFT",
	"MEMBER_REMOVED",
	"ROLE_CHANGED",
	"TASK_CREATED",
	"TASK_UPDATED",
	"TASK_MOVED",
	"TASK_COMPLETED",
	"TASK_REOPENED",
	"TASK_ARCHIVED",
	"TASK_RESTORED",
] as const;
export const ATTACHMENT_STATUSES = ["PENDING", "READY"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const teamRole = pgEnum("team_role", TEAM_ROLES);
export const invitationStatus = pgEnum(
	"invitation_status",
	INVITATION_STATUSES,
);
export const notificationType = pgEnum("notification_type", NOTIFICATION_TYPES);
export const activityType = pgEnum("activity_type", ACTIVITY_TYPES);
export const attachmentStatus = pgEnum(
	"attachment_status",
	ATTACHMENT_STATUSES,
);
export const taskStatus = pgEnum("task_status", TASK_STATUSES);
export const taskPriority = pgEnum("task_priority", TASK_PRIORITIES);

export const team = pgTable(
	"team",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("team_created_by_id_idx").on(table.createdById)],
);

export const teamMember = pgTable(
	"team_member",
	{
		teamId: text("team_id")
			.notNull()
			.references(() => team.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: teamRole("role").default("MEMBER").notNull(),
		joinedAt: timestamp("joined_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.teamId, table.userId] }),
		index("team_member_user_id_idx").on(table.userId),
	],
);

export const teamInvitation = pgTable(
	"team_invitation",
	{
		id: text("id").primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => team.id, { onDelete: "cascade" }),
		invitedUserId: text("invited_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		invitedById: text("invited_by_id")
			.notNull()
			.references(() => user.id),
		status: invitationStatus("status").default("PENDING").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		respondedAt: timestamp("responded_at"),
	},
	(table) => [
		uniqueIndex("team_invitation_team_user_idx").on(
			table.teamId,
			table.invitedUserId,
		),
		index("team_invitation_user_status_idx").on(
			table.invitedUserId,
			table.status,
		),
	],
);

export const task = pgTable(
	"task",
	{
		id: text("id").primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => team.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description").default("").notNull(),
		status: taskStatus("status").default("TODO").notNull(),
		priority: taskPriority("priority").default("MEDIUM").notNull(),
		position: integer("position").default(1000).notNull(),
		version: integer("version").default(1).notNull(),
		completedAt: timestamp("completed_at"),
		archivedAt: timestamp("archived_at"),
		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id),
		dueDate: timestamp("due_date"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("task_team_id_idx").on(table.teamId),
		index("task_team_status_idx").on(table.teamId, table.status),
		index("task_team_status_position_idx").on(
			table.teamId,
			table.status,
			table.position,
		),
		index("task_team_archived_idx").on(table.teamId, table.archivedAt),
		uniqueIndex("task_team_id_id_idx").on(table.teamId, table.id),
	],
);

export const taskAssignee = pgTable(
	"task_assignee",
	{
		taskId: text("task_id").notNull(),
		teamId: text("team_id").notNull(),
		userId: text("user_id").notNull(),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.taskId, table.userId] }),
		foreignKey({
			columns: [table.taskId, table.teamId],
			foreignColumns: [task.id, task.teamId],
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId, table.userId],
			foreignColumns: [teamMember.teamId, teamMember.userId],
		}).onDelete("cascade"),
		index("task_assignee_team_user_idx").on(table.teamId, table.userId),
	],
);

export const notification = pgTable(
	"notification",
	{
		id: text("id").primaryKey(),
		recipientUserId: text("recipient_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		actorUserId: text("actor_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
		invitationId: text("invitation_id").references(() => teamInvitation.id, {
			onDelete: "set null",
		}),
		type: notificationType("type").notNull(),
		message: text("message").notNull(),
		readAt: timestamp("read_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("notification_recipient_created_idx").on(
			table.recipientUserId,
			table.createdAt,
		),
	],
);

export const teamActivity = pgTable(
	"team_activity",
	{
		id: text("id").primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => team.id, { onDelete: "cascade" }),
		actorUserId: text("actor_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		subjectUserId: text("subject_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		type: activityType("type").notNull(),
		details: jsonb("details")
			.$type<Record<string, string>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("team_activity_team_created_idx").on(table.teamId, table.createdAt),
	],
);

export const taskAttachment = pgTable(
	"task_attachment",
	{
		id: text("id").primaryKey(),
		taskId: text("task_id")
			.notNull()
			.references(() => task.id, { onDelete: "cascade" }),
		uploadedById: text("uploaded_by_id")
			.notNull()
			.references(() => user.id),
		objectKey: text("object_key").notNull().unique(),
		fileName: text("file_name").notNull(),
		contentType: text("content_type").notNull(),
		size: integer("size").notNull(),
		status: attachmentStatus("status").default("PENDING").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("task_attachment_task_idx").on(table.taskId)],
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
