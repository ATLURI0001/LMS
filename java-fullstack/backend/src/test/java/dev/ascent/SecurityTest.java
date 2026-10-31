package dev.ascent;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SecurityTest {

  @Test
  void productionConfiguration() {
    var safe = Map.of(
      "APP_ENV",
      "production",
      "DEMO_MODE",
      "false",
      "COOKIE_SECURE",
      "true",
      "ALLOWED_ORIGINS",
      "https://lms.example.edu,https://staff.example.edu:8443"
    );
    Deployment.validate(Map.of());
    Deployment.validate(safe);
    for (var override : new String[][] {
      { "DEMO_MODE", "true" },
      { "COOKIE_SECURE", "false" },
      { "ALLOWED_ORIGINS", "" },
      { "ALLOWED_ORIGINS", "http://lms.example.edu" },
      { "ALLOWED_ORIGINS", "https://*.example.edu" },
      { "ALLOWED_ORIGINS", "https://user@lms.example.edu" },
      { "ALLOWED_ORIGINS", "https://lms.example.edu/path" },
    }) {
      var env = new HashMap<>(safe);
      env.put(override[0], override[1]);
      assertThrows(IllegalStateException.class, () -> Deployment.validate(env));
    }
  }

  @Test
  void passwordSaltAndVerification() {
    var first = Security.hashPassword(" whitespace password ");
    assertTrue(first.startsWith("600000$"));
    assertNotEquals(first, Security.hashPassword(" whitespace password "));
    assertTrue(Security.verify(" whitespace password ", first));
    assertFalse(Security.verify("whitespace password", first));
    assertFalse(Security.verify("anything", "malformed"));
  }
}
