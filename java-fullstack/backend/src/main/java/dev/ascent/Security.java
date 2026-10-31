package dev.ascent;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class Security {

  private static final SecureRandom RANDOM = new SecureRandom();

  public static String token() {
    byte[] b = new byte[32];
    RANDOM.nextBytes(b);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
  }

  public static String tokenHash(String token) {
    try {
      return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(
          token.getBytes(StandardCharsets.UTF_8)
        )
      );
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private static byte[] derive(String password, String salt, int iterations) {
    try {
      var spec = new PBEKeySpec(
        password.toCharArray(),
        salt.getBytes(StandardCharsets.UTF_8),
        iterations,
        256
      );
      try {
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
          .generateSecret(spec)
          .getEncoded();
      } finally {
        spec.clearPassword();
      }
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public static String hashPassword(String password) {
    byte[] b = new byte[16];
    RANDOM.nextBytes(b);
    String salt = HexFormat.of().formatHex(b);
    return (
      "600000$" +
      salt +
      "$" +
      HexFormat.of().formatHex(derive(password, salt, 600000))
    );
  }

  public static boolean verify(String password, String encoded) {
    try {
      String[] p = encoded.split("\\$");
      return MessageDigest.isEqual(
        derive(password, p[1], Integer.parseInt(p[0])),
        HexFormat.of().parseHex(p[2])
      );
    } catch (Exception e) {
      return false;
    }
  }
}
