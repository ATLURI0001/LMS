package dev.ascent;

import java.util.Arrays;
import java.util.Map;

final class Deployment {

  static void validate(Map<String, String> env) {
    if (
      !"production".equalsIgnoreCase(env.getOrDefault("APP_ENV", "development"))
    ) return;
    boolean valid =
      "false".equalsIgnoreCase(env.getOrDefault("DEMO_MODE", "false")) &&
      "true".equalsIgnoreCase(env.getOrDefault("COOKIE_SECURE", "false")) &&
      Arrays.stream(
        env.getOrDefault("ALLOWED_ORIGINS", "").split(",", -1)
      ).allMatch(origin ->
        origin.matches("https://[A-Za-z0-9.-]+(?::[0-9]{1,5})?")
      );
    if (!valid) throw new IllegalStateException(
      "Unsafe production configuration: disable DEMO_MODE, enable COOKIE_SECURE, and set exact HTTPS ALLOWED_ORIGINS (DNS hostnames, no paths or wildcards)"
    );
  }
}
