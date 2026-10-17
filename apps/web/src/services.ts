import { createAuth } from "@trackwise/auth";
import { createDb } from "@trackwise/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
