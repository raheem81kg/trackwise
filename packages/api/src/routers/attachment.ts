import { randomUUID } from "node:crypto";
import { attachment } from "@trackwise/db/schema/attachment";
import { user } from "@trackwise/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	processStorageDeletions,
	queueStorageDeletions,
} from "../storage-cleanup";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_USER = 10;
const ALLOWED_TYPES = new Set([
	"application/pdf",
	"application/zip",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/msword",
	"application/vnd.ms-excel",
	"application/vnd.ms-powerpoint",
	"text/plain",
]);

function validateContentType(contentType: string) {
	if (!contentType.startsWith("image/") && !ALLOWED_TYPES.has(contentType)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This file type is not allowed",
		});
	}
}

export const attachmentRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select({
				id: attachment.id,
				fileName: attachment.fileName,
				contentType: attachment.contentType,
				size: attachment.size,
				status: attachment.status,
				uploadedById: attachment.userId,
				uploadedByName: user.name,
				createdAt: attachment.createdAt,
			})
			.from(attachment)
			.innerJoin(user, eq(user.id, attachment.userId))
			.where(eq(attachment.status, "READY"))
			.orderBy(desc(attachment.createdAt));
	}),

	createUpload: protectedProcedure
		.input(
			z.object({
				fileName: z.string().trim().min(1).max(255),
				contentType: z.string().trim().min(1).max(150),
				size: z.number().int().positive().max(MAX_FILE_SIZE),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			validateContentType(input.contentType);
			const [attachmentCount] = await ctx.db
				.select({ value: count() })
				.from(attachment)
				.where(eq(attachment.userId, ctx.session.user.id));
			if ((attachmentCount?.value ?? 0) >= MAX_ATTACHMENTS_PER_USER) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `You can have at most ${MAX_ATTACHMENTS_PER_USER} attachments`,
				});
			}
			const id = randomUUID();
			const objectKey = `users/${ctx.session.user.id}/${id}`;
			await ctx.db.insert(attachment).values({
				id,
				userId: ctx.session.user.id,
				objectKey,
				fileName: input.fileName,
				contentType: input.contentType,
				size: input.size,
			});
			try {
				const uploadUrl = await ctx.storage.createUploadUrl(
					objectKey,
					input.contentType,
					input.size,
				);
				return { id, uploadUrl };
			} catch {
				await ctx.db.delete(attachment).where(eq(attachment.id, id));
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "File storage is not configured",
				});
			}
		}),

	completeUpload: protectedProcedure
		.input(z.object({ attachmentId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [record] = await ctx.db
				.select()
				.from(attachment)
				.where(
					and(
						eq(attachment.id, input.attachmentId),
						eq(attachment.userId, ctx.session.user.id),
					),
				)
				.limit(1);
			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment upload not found",
				});
			}
			if (!(await ctx.storage.objectExists(record.objectKey, record.size))) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The uploaded file could not be verified",
				});
			}
			await ctx.db
				.update(attachment)
				.set({ status: "READY" })
				.where(eq(attachment.id, record.id));
			return { id: record.id };
		}),

	download: protectedProcedure
		.input(z.object({ attachmentId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [record] = await ctx.db
				.select()
				.from(attachment)
				.where(
					and(
						eq(attachment.id, input.attachmentId),
						eq(attachment.status, "READY"),
					),
				)
				.limit(1);
			if (!record)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			return {
				url: await ctx.storage.createDownloadUrl(
					record.objectKey,
					record.fileName,
				),
			};
		}),

	delete: protectedProcedure
		.input(z.object({ attachmentId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [record] = await ctx.db
				.select()
				.from(attachment)
				.where(
					and(
						eq(attachment.id, input.attachmentId),
						eq(attachment.userId, ctx.session.user.id),
					),
				)
				.limit(1);
			if (!record)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			await queueStorageDeletions(ctx.db, [record.objectKey]);
			await ctx.db.delete(attachment).where(eq(attachment.id, record.id));
			await processStorageDeletions(ctx.db, ctx.storage, [record.objectKey]);
			return { id: record.id };
		}),
});
