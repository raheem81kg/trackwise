export type AttachmentStorage = {
	createUploadUrl: (
		objectKey: string,
		contentType: string,
		size: number,
	) => Promise<string>;
	createDownloadUrl: (objectKey: string, fileName: string) => Promise<string>;
	deleteObjects: (objectKeys: string[]) => Promise<void>;
	objectExists: (objectKey: string, expectedSize: number) => Promise<boolean>;
};
