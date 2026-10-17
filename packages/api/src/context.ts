import type { Session } from "@trackwise/auth";
import type { Database } from "@trackwise/db";

import type { AttachmentStorage } from "./storage";

export type Context = {
	session: Session | null;
	db: Database;
	storage: AttachmentStorage;
};
