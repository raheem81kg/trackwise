import {
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AttachmentStorage } from "@trackwise/api/storage";

import { ENV } from "../env.server";

function getConfig() {
	const accessKeyId = ENV.AWS_ACCESS_KEY_ID;
	const secretAccessKey = ENV.AWS_SECRET_ACCESS_KEY;
	const endpoint = ENV.AWS_ENDPOINT_URL_S3;
	const region = ENV.AWS_REGION;
	const bucket = ENV.AWS_S3_BUCKET ?? "task-attachments";
	if (!accessKeyId || !secretAccessKey || !endpoint || !region) {
		throw new Error("Object storage is not configured");
	}
	return { accessKeyId, secretAccessKey, endpoint, region, bucket };
}

function getClient() {
	const config = getConfig();
	return {
		bucket: config.bucket,
		client: new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: true,
		}),
	};
}

export const storage: AttachmentStorage = {
	async createUploadUrl(objectKey, contentType, size) {
		const { client, bucket } = getClient();
		return await getSignedUrl(
			client,
			new PutObjectCommand({
				Bucket: bucket,
				Key: objectKey,
				ContentType: contentType,
				ContentLength: size,
			}),
			{ expiresIn: 300 },
		);
	},
	async createDownloadUrl(objectKey, fileName) {
		const { client, bucket } = getClient();
		const safeName = fileName.replace(/["\r\n]/g, "_");
		return await getSignedUrl(
			client,
			new GetObjectCommand({
				Bucket: bucket,
				Key: objectKey,
				ResponseContentDisposition: `attachment; filename="${safeName}"`,
			}),
			{ expiresIn: 300 },
		);
	},
	async deleteObjects(objectKeys) {
		if (!objectKeys.length) return;
		const { client, bucket } = getClient();
		await client.send(
			new DeleteObjectsCommand({
				Bucket: bucket,
				Delete: { Objects: objectKeys.map((Key) => ({ Key })) },
			}),
		);
	},
	async objectExists(objectKey, expectedSize) {
		const { client, bucket } = getClient();
		try {
			const result = await client.send(
				new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
			);
			return result.ContentLength === expectedSize;
		} catch {
			return false;
		}
	},
};
