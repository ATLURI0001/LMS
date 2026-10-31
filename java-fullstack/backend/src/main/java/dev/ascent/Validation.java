package dev.ascent;

import java.net.URI;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public final class Validation {

  public static class ApiError extends RuntimeException {

    public final int status;

    public ApiError(int status, String message) {
      super(message);
      this.status = status;
    }
  }

  public static void need(boolean ok, String message, int status) {
    if (!ok) throw new ApiError(status, message);
  }

  public static void need(boolean ok) {
    need(ok, "Forbidden", 403);
  }

  public static Map<String, Object> m(Object... pairs) {
    Map<String, Object> out = new LinkedHashMap<>();
    for (int i = 0; i < pairs.length; i += 2) out.put(
      (String) pairs[i],
      pairs[i + 1]
    );
    return out;
  }

  public static String s(Map<String, Object> row, String key) {
    return Objects.toString(row.get(key), "");
  }

  public static int n(Map<String, Object> row, String key) {
    return ((Number) row.get(key)).intValue();
  }

  public static String text(Map<String, Object> d, String k, int min, int max) {
    Object raw = d.getOrDefault(k, "");
    need(raw instanceof String, k + " must be text", 422);
    String v = ((String) raw).strip();
    need(
      v.length() >= min && v.length() <= max,
      k + " must be " + min + "–" + max + " characters",
      422
    );
    return v;
  }

  public static int integer(Map<String, Object> d, String k, int min, int max) {
    Object v = d.get(k);
    need(
      v instanceof Integer || v instanceof Long,
      k + " must be an integer",
      422
    );
    long number = ((Number) v).longValue();
    need(
      number >= min && number <= max,
      k + " must be from " + min + " to " + max,
      422
    );
    return (int) number;
  }

  public static String choice(
    Map<String, Object> d,
    String k,
    String... options
  ) {
    String v = text(d, k, 1, 200);
    need(Arrays.asList(options).contains(v), "Invalid " + k, 422);
    return v;
  }

  public static String url(Map<String, Object> d, String k, boolean required) {
    String v = text(d, k, required ? 1 : 0, 2000);
    if (!v.isEmpty()) {
      try {
        URI u = URI.create(v);
        need(
          Set.of("http", "https").contains(u.getScheme()) &&
            u.getHost() != null &&
            u.getUserInfo() == null,
          k + " must be an HTTP(S) URL",
          422
        );
      } catch (IllegalArgumentException e) {
        throw new ApiError(422, k + " must be an HTTP(S) URL");
      }
    }
    return v;
  }

  public static String date(Map<String, Object> d, String k) {
    try {
      return OffsetDateTime.parse(text(d, k, 1, 40))
        .toInstant()
        .truncatedTo(ChronoUnit.SECONDS)
        .toString();
    } catch (java.time.format.DateTimeParseException e) {
      throw new ApiError(422, "Invalid " + k + "; include a timezone");
    }
  }

  public static String password(Map<String, Object> d) {
    Object v = d.get("password");
    need(
      v instanceof String &&
        ((String) v).length() >= 12 &&
        ((String) v).length() <= 128,
      "Password must be 12–128 characters",
      422
    );
    return (String) v;
  }

  public static Map<String, Object> publicUser(Map<String, Object> u) {
    var copy = new LinkedHashMap<>(u);
    copy.remove("password_hash");
    return copy;
  }

  public static String now() {
    return Instant.now().truncatedTo(ChronoUnit.SECONDS).toString();
  }
}
