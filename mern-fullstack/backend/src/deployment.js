/** Reject known unsafe settings before opening the production database. */
export function validateEnvironment(env = process.env) {
  if ((env.APP_ENV || "development").toLowerCase() !== "production") return;
  const valid =
    (env.DEMO_MODE || "false").toLowerCase() === "false" &&
    (env.COOKIE_SECURE || "false").toLowerCase() === "true" &&
    (env.ALLOWED_ORIGINS || "")
      .split(",")
      .every((origin) =>
        /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(origin),
      );
  if (!valid)
    throw new Error(
      "Unsafe production configuration: disable DEMO_MODE, enable COOKIE_SECURE, and set exact HTTPS ALLOWED_ORIGINS (DNS hostnames, no paths or wildcards)",
    );
}
