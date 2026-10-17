import type { Context as ApiContext } from "@trackwise/api/context";
import type { NextRequest } from "next/server";

import { storage } from "./lib/storage";
import { auth, db } from "./services";

export async function createContext(req: NextRequest): Promise<ApiContext> {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return {
		db,
		session,
		storage,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
