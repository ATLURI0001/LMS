package dev.ascent;

import static dev.ascent.Validation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;

/** Parameterized relational repository. Table/column names come only from bundled schema. */
public class Store {

  private final JdbcTemplate jdbc;
  private final ObjectMapper json;
  private final Map<String, Map<String, String>> schema;

  public Store(JdbcTemplate jdbc, ObjectMapper json) {
    this.jdbc = jdbc;
    this.json = json;
    this.schema = resource("schema.json", new TypeReference<>() {});
  }

  private <T> T resource(String name, TypeReference<T> type) {
    try (var in = getClass().getResourceAsStream("/" + name)) {
      return json.readValue(in, type);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public void initialize() {
    Map<String, List<List<String>>> constraints = resource(
      "constraints.json",
      new TypeReference<>() {}
    );
    for (var table : schema.entrySet()) {
      List<String> columns = new ArrayList<>();
      table
        .getValue()
        .forEach((k, t) ->
          columns.add(
            k +
              " " +
              (t.equals("int")
                ? "INTEGER"
                : t.equals("bool")
                  ? "BOOLEAN"
                  : "VARCHAR(24000)") +
              (k.equals("id") ? " PRIMARY KEY" : "")
          )
        );
      for (var keys : constraints.getOrDefault(table.getKey(), List.of()))
        columns.add("UNIQUE (" + String.join(",", keys) + ")");
      jdbc.execute(
        "CREATE TABLE IF NOT EXISTS " +
          table.getKey() +
          " (" +
          String.join(",", columns) +
          ")"
      );
    }
    Map<String, String> refs = Map.of(
      "user_id",
      "users",
      "owner_id",
      "users",
      "author_id",
      "users",
      "captain_id",
      "users",
      "course_id",
      "courses",
      "lesson_id",
      "lessons",
      "assignment_id",
      "assignments",
      "team_id",
      "teams",
      "challenge_id",
      "challenges"
    );
    for (var table : schema.entrySet())
      for (var ref : refs.entrySet())
        if (
          table.getValue().containsKey(ref.getKey()) &&
          !(
            table.getKey().equals("announcements") &&
            ref.getKey().equals("course_id")
          )
        ) jdbc.execute(
          "ALTER TABLE " +
            table.getKey() +
            " ADD CONSTRAINT IF NOT EXISTS fk_" +
            table.getKey() +
            "_" +
            ref.getKey() +
            " FOREIGN KEY (" +
            ref.getKey() +
            ") REFERENCES " +
            ref.getValue() +
            "(id)"
        );
    jdbc.execute(
      "CREATE TABLE IF NOT EXISTS app_lock (id INTEGER PRIMARY KEY, revision INTEGER)"
    );
    jdbc.update("MERGE INTO app_lock (id,revision) KEY(id) VALUES (1,0)");
    if ("true".equals(System.getenv("DEMO_MODE")) && all("users").isEmpty()) {
      Map<String, List<Map<String, Object>>> seed = resource(
        "seed.json",
        new TypeReference<>() {}
      );
      for (var table : seed.entrySet())
        for (var row : table.getValue()) {
          if (table.getKey().equals("users")) row.put(
            "password_hash",
            Security.hashPassword(
              System.getenv().getOrDefault("DEMO_PASSWORD", "AscentDemo!2026")
            )
          );
          insert(table.getKey(), row);
        }
    }
  }

  public void lock() {
    jdbc.queryForObject(
      "SELECT revision FROM app_lock WHERE id=1 FOR UPDATE",
      Integer.class
    );
  }

  private Map<String, Object> decode(String table, Map<String, Object> row) {
    Map<String, Object> out = new LinkedHashMap<>();
    row.forEach((key, value) -> {
      String k = key.toLowerCase(Locale.ROOT);
      if ("json".equals(schema.get(table).get(k)) && value != null) {
        try {
          out.put(k, json.readValue(value.toString(), Object.class));
        } catch (Exception e) {
          throw new IllegalStateException(e);
        }
      } else out.put(k, value);
    });
    return out;
  }

  public List<Map<String, Object>> all(String table) {
    return jdbc
      .queryForList("SELECT * FROM " + table + " ORDER BY created_at,id")
      .stream()
      .map(r -> decode(table, r))
      .toList();
  }

  public Map<String, Object> get(String table, String id) {
    var rows = jdbc.queryForList("SELECT * FROM " + table + " WHERE id=?", id);
    return rows.isEmpty() ? null : decode(table, rows.get(0));
  }

  private Object value(String table, String k, Object v) {
    if ("json".equals(schema.get(table).get(k))) {
      try {
        return json.writeValueAsString(v);
      } catch (Exception e) {
        throw new IllegalStateException(e);
      }
    }
    return v;
  }

  public Map<String, Object> insert(String table, Map<String, Object> data) {
    var row = m("id", UUID.randomUUID().toString(), "created_at", now());
    row.putAll(data);
    var keys = new ArrayList<>(row.keySet());
    jdbc.update(
      "INSERT INTO " +
        table +
        " (" +
        String.join(",", keys) +
        ") VALUES (" +
        String.join(",", Collections.nCopies(keys.size(), "?")) +
        ")",
      keys
        .stream()
        .map(k -> value(table, k, row.get(k)))
        .toArray()
    );
    return get(table, s(row, "id"));
  }

  public Map<String, Object> update(
    String table,
    String id,
    Map<String, Object> data
  ) {
    if (data.isEmpty()) return get(table, id);
    var keys = new ArrayList<>(data.keySet());
    var args = new ArrayList<Object>();
    for (String k : keys) args.add(value(table, k, data.get(k)));
    args.add(id);
    jdbc.update(
      "UPDATE " +
        table +
        " SET " +
        String.join(
          ",",
          keys
            .stream()
            .map(k -> k + "=?")
            .toList()
        ) +
        " WHERE id=?",
      args.toArray()
    );
    return get(table, id);
  }

  public void delete(String table, String id) {
    jdbc.update("DELETE FROM " + table + " WHERE id=?", id);
  }
}
