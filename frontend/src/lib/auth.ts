import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE_NAME = "session";

export const hasSessionCookie = createServerFn({ method: "GET" }).handler(() =>
	Boolean(getCookie(SESSION_COOKIE_NAME)),
);
