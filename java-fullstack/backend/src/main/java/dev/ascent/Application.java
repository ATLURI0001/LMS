package dev.ascent;

import static dev.ascent.Validation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.*;
import java.time.*;
import java.util.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@RestController
public class Application {

  private final Store db;
  private final ObjectMapper json;
  private final TransactionTemplate transactions;
  private final Set<String> allowed = new HashSet<>(
    Arrays.asList(
      System.getenv()
        .getOrDefault(
          "ALLOWED_ORIGINS",
          "http://localhost:5173,http://localhost:8080,http://localhost:3000"
        )
        .split(",")
    )
  );
  private final Map<String, long[]> rate = new HashMap<>();

  public Application(
    JdbcTemplate jdbc,
    ObjectMapper json,
    TransactionTemplate transactions
  ) {
    this.db = new Store(jdbc, json);
    this.json = json;
    this.transactions = transactions;
  }

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

  @PostConstruct
  public void initialize() {
    Deployment.validate(System.getenv());
    db.initialize();
    // Optional one-time bootstrap for an empty, non-demo installation.
    String email = System.getenv("BOOTSTRAP_ADMIN_EMAIL"),
      pw = System.getenv("BOOTSTRAP_ADMIN_PASSWORD");
    if (db.all("users").isEmpty() && email != null && pw != null) {
      need(
        email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"),
        "Invalid bootstrap email",
        422
      );
      db.insert(
        "users",
        m(
          "name",
          "Campus Admin",
          "email",
          email.toLowerCase(Locale.ROOT),
          "password_hash",
          Security.hashPassword(password(m("password", pw))),
          "role",
          "admin",
          "active",
          true
        )
      );
    }
  }

  private synchronized void throttle(String ip) {
    long time = System.currentTimeMillis();
    rate.entrySet().removeIf(e -> time - e.getValue()[0] > 900000);
    long[] bucket = rate.computeIfAbsent(ip, k -> new long[] { time, 0 });
    need(bucket[1]++ < 40, "Too many attempts. Try again in 15 minutes.", 429);
  }

  @RequestMapping(
    value = "/api/**",
    method = {
      RequestMethod.GET,
      RequestMethod.POST,
      RequestMethod.PATCH,
      RequestMethod.DELETE,
    }
  )
  public ResponseEntity<?> endpoint(HttpServletRequest request) {
    try {
      String method = request.getMethod(),
        path = request.getRequestURI().substring(5);
      if (!method.equals("GET")) {
        String origin = request.getHeader("Origin");
        need(
          (origin == null || allowed.contains(origin)) &&
            !"cross-site".equals(request.getHeader("Sec-Fetch-Site")),
          "Untrusted origin",
          403
        );
      }
      byte[] bytes = request.getInputStream().readNBytes(65537);
      need(bytes.length <= 65536, "Request too large", 413);
      need(
        bytes.length == 0 ||
          (request.getContentType() != null &&
            request
              .getContentType()
              .split(";", 2)[0]
              .trim()
              .equalsIgnoreCase("application/json")),
        "Content-Type must be application/json",
        415
      );
      Map<String, Object> data;
      try {
        data =
          bytes.length == 0
            ? m()
            : json.readValue(
                bytes,
                new TypeReference<Map<String, Object>>() {}
              );
        need(data != null, "JSON object required", 422);
      } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        throw new ApiError(400, "Invalid JSON object");
      }
      if (path.equals("health") && method.equals("GET")) return response(
        200,
        m("status", "ok", "stack", "java"),
        null
      );
      if (
        Set.of("auth/login", "auth/register").contains(path) &&
        method.equals("POST")
      ) throttle(request.getRemoteAddr());
      return transactions.execute(status -> {
        if (!method.equals("GET")) db.lock();
        return handle(request, path, method, data);
      });
    } catch (ApiError e) {
      return response(e.status, m("error", e.getMessage()), null);
    } catch (DataIntegrityViolationException e) {
      return response(
        409,
        m("error", "This record already exists or references unavailable data"),
        null
      );
    } catch (Exception e) {
      org.slf4j.LoggerFactory.getLogger(Application.class).error(
        "Request failed",
        e
      );
      return response(500, m("error", "Unexpected server error"), null);
    }
  }

  private ResponseEntity<?> handle(
    HttpServletRequest request,
    String path,
    String method,
    Map<String, Object> d
  ) {
    var svc = new LmsService(db, null);
    if (
      Set.of("auth/login", "auth/register").contains(path) &&
      method.equals("POST")
    ) {
      String email = text(d, "email", 3, 254).toLowerCase(Locale.ROOT);
      need(email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"), "Invalid email", 422);
      var users = svc.rows("users", m("email", email));
      Map<String, Object> user;
      if (path.equals("auth/register")) {
        need(users.isEmpty(), "Email already registered", 409);
        user = db.insert(
          "users",
          m(
            "name",
            text(d, "name", 2, 80),
            "email",
            email,
            "password_hash",
            Security.hashPassword(password(d)),
            "role",
            "student",
            "active",
            true
          )
        );
      } else {
        need(
          d.get("password") instanceof String &&
            s(d, "password").length() >= 1 &&
            s(d, "password").length() <= 128,
          "Invalid password",
          422
        );
        String supplied = s(d, "password");
        need(
          !users.isEmpty() &&
            Boolean.TRUE.equals(users.get(0).get("active")) &&
            Security.verify(supplied, s(users.get(0), "password_hash")),
          "Incorrect email or password",
          401
        );
        user = users.get(0);
      }
      for (var session : db.all("sessions"))
        if (s(session, "expires_at").compareTo(now()) <= 0) db.delete(
          "sessions",
          s(session, "id")
        );
      String token = Security.token();
      db.insert(
        "sessions",
        m(
          "id",
          Security.tokenHash(token),
          "user_id",
          user.get("id"),
          "expires_at",
          Instant.now()
            .plusSeconds(86400)
            .truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
            .toString()
        )
      );
      return response(
        path.equals("auth/register") ? 201 : 200,
        m("user", publicUser(user)),
        cookie(token, 86400)
      );
    }
    String token = "";
    if (request.getCookies() != null) for (Cookie cookie : request.getCookies())
      if (cookie.getName().equals("ascent_session")) token = cookie.getValue();
    var session = db.get("sessions", Security.tokenHash(token));
    need(
      session != null && s(session, "expires_at").compareTo(now()) > 0,
      "Sign in to continue",
      401
    );
    var user = db.get("users", s(session, "user_id"));
    need(
      user != null && Boolean.TRUE.equals(user.get("active")),
      "Account unavailable",
      401
    );
    svc.user = user;
    if (path.equals("auth/logout") && method.equals("POST")) {
      db.delete("sessions", s(session, "id"));
      return response(200, m("message", "Signed out"), cookie("", 0));
    }
    if (path.equals("auth/me") && method.equals("GET")) return response(
      200,
      m("user", publicUser(user)),
      null
    );
    return response(200, svc.dispatch(method, path, d), null);
  }

  private String cookie(String token, long age) {
    return ResponseCookie.from("ascent_session", token)
      .httpOnly(true)
      .secure("true".equalsIgnoreCase(System.getenv("COOKIE_SECURE")))
      .sameSite("Strict")
      .path("/api")
      .maxAge(Duration.ofSeconds(age))
      .build()
      .toString();
  }

  private ResponseEntity<?> response(int status, Object body, String cookie) {
    var response = ResponseEntity.status(status)
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("X-Frame-Options", "DENY")
      .header("Referrer-Policy", "same-origin");
    if (cookie != null) response.header(HttpHeaders.SET_COOKIE, cookie);
    return response.body(body);
  }
}
