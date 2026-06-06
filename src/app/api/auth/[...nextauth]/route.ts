/**
 * Auth.js route handler — receives all /api/auth/* requests
 * (sign-in callbacks, sign-out, session, csrf, etc).
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
