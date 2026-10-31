"""Small relational repository. Every request uses one SQLite transaction."""

import json, os, sqlite3
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
from security import hash_password

ROOT = Path(__file__).parent
SCHEMA = json.loads((ROOT / "schema.json").read_text())
CONSTRAINTS = json.loads((ROOT / "constraints.json").read_text())


def now():
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


class Store:
    def __init__(self):
        path = os.getenv("DATABASE_PATH", "data/ascent.db")
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path, timeout=30)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.execute("PRAGMA journal_mode=WAL")

    def initialize(self):
        for table, fields in SCHEMA.items():
            columns = [
                f"{k} "
                + ("INTEGER" if t in ("int", "bool") else "TEXT")
                + (" PRIMARY KEY" if k == "id" else "")
                for k, t in fields.items()
            ]
            columns += [
                "UNIQUE (" + ", ".join(keys) + ")"
                for keys in CONSTRAINTS.get(table, [])
            ]
            references = {
                "user_id": "users",
                "owner_id": "users",
                "author_id": "users",
                "captain_id": "users",
                "course_id": "courses",
                "lesson_id": "lessons",
                "assignment_id": "assignments",
                "team_id": "teams",
                "challenge_id": "challenges",
            }
            for field, target in references.items():
                if field in fields and not (
                    table == "announcements" and field == "course_id"
                ):
                    columns.append(f"FOREIGN KEY ({field}) REFERENCES {target}(id)")
            self.conn.execute(
                f"CREATE TABLE IF NOT EXISTS {table} (" + ", ".join(columns) + ")"
            )
        if os.getenv("DEMO_MODE", "false").lower() == "true" and not self.all("users"):
            seed = json.loads((ROOT / "seed.json").read_text())
            for table, rows in seed.items():
                for row in rows:
                    if table == "users":
                        row["password_hash"] = hash_password(
                            os.getenv("DEMO_PASSWORD", "AscentDemo!2026")
                        )
                    self.insert(table, row)
        self.conn.commit()

    def decode(self, table, row):
        if row is None:
            return None
        result = dict(row)
        for key, typ in SCHEMA[table].items():
            if typ == "json" and result.get(key) is not None:
                result[key] = json.loads(result[key])
            if typ == "bool":
                result[key] = bool(result.get(key))
        return result

    def all(self, table):
        return [
            self.decode(table, r)
            for r in self.conn.execute(f"SELECT * FROM {table} ORDER BY created_at, id")
        ]

    def get(self, table, id):
        return self.decode(
            table,
            self.conn.execute(f"SELECT * FROM {table} WHERE id=?", (id,)).fetchone(),
        )

    def insert(self, table, data):
        row = {"id": str(uuid4()), "created_at": now(), **data}
        keys = list(row)
        vals = [
            json.dumps(row[k]) if SCHEMA[table][k] == "json" else row[k] for k in keys
        ]
        self.conn.execute(
            f"INSERT INTO {table} ("
            + ", ".join(keys)
            + ") VALUES ("
            + ",".join("?" for _ in keys)
            + ")",
            vals,
        )
        return self.get(table, row["id"])

    def update(self, table, id, data):
        if not data:
            return self.get(table, id)
        keys = list(data)
        vals = [
            json.dumps(data[k]) if SCHEMA[table][k] == "json" else data[k] for k in keys
        ]
        self.conn.execute(
            f"UPDATE {table} SET " + ",".join(k + "=?" for k in keys) + " WHERE id=?",
            [*vals, id],
        )
        return self.get(table, id)

    def delete(self, table, id):
        self.conn.execute(f"DELETE FROM {table} WHERE id=?", (id,))
