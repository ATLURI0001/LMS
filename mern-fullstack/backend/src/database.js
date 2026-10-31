import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./security.js";
export const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const read = (file) =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
export const schema = read("schema.json");
const constraints = read("constraints.json");
export const models = {};
for (const [name, fields] of Object.entries(schema)) {
  const definition = {};
  for (const [key, type] of Object.entries(fields))
    definition[key] = {
      type: {
        text: String,
        int: Number,
        bool: Boolean,
        json: mongoose.Schema.Types.Mixed,
      }[type],
    };
  const s = new mongoose.Schema(definition, {
    versionKey: false,
    strict: "throw",
    collection: name,
  });
  s.index({ id: 1 }, { unique: true });
  for (const fields of constraints[name] || [])
    s.index(Object.fromEntries(fields.map((f) => [f, 1])), { unique: true });
  models[name] = mongoose.model(name, s);
}
const Lock = mongoose.model(
  "AppLock",
  new mongoose.Schema({ _id: String, revision: Number }, { versionKey: false }),
);

// A transaction-local unit of work keeps business rules independent of Mongoose.
export class Store {
  constructor(rows) {
    this.data = rows;
    this.pending = [];
  }
  static async load(session) {
    const rows = {};
    for (const [name, model] of Object.entries(models)) {
      rows[name] = await model
        .find({}, { _id: 0 })
        .sort({ created_at: 1, id: 1 })
        .session(session)
        .lean();
    }
    return new Store(rows);
  }
  all(table) {
    return this.data[table];
  }
  get(table, id) {
    return this.data[table].find((r) => r.id === id);
  }
  insert(table, data) {
    const row = { id: randomUUID(), created_at: now(), ...data };
    this.data[table].push(row);
    this.pending.push(["insert", table, row]);
    return row;
  }
  update(table, id, data) {
    const row = this.get(table, id);
    Object.assign(row, data);
    this.pending.push(["update", table, { ...row }]);
    return row;
  }
  delete(table, id) {
    this.data[table] = this.data[table].filter((r) => r.id !== id);
    this.pending.push(["delete", table, { id }]);
  }
  async flush(session) {
    for (const [op, table, row] of this.pending) {
      if (op === "insert") await models[table].create([row], { session });
      if (op === "update")
        await models[table].updateOne(
          { id: row.id },
          { $set: row },
          { session, runValidators: true },
        );
      if (op === "delete")
        await models[table].deleteOne({ id: row.id }, { session });
    }
  }
}
export async function transaction(write, fn) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // Serialize multi-document invariants such as team capacity and curriculum locks.
      // Deliberately simple for a campus deployment; see docs/ARCHITECTURE.md.
      if (write)
        await Lock.updateOne(
          { _id: "mutations" },
          { $inc: { revision: 1 } },
          { session },
        );
      const db = await Store.load(session);
      const result = await fn(db);
      await db.flush(session);
      return result;
    });
  } finally {
    await session.endSession();
  }
}
export async function initialize() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ascent?replicaSet=rs0",
  );
  for (const model of Object.values(models)) await model.init();
  await Lock.updateOne(
    { _id: "mutations" },
    { $setOnInsert: { revision: 0 } },
    { upsert: true },
  );
  if (process.env.DEMO_MODE === "true")
    await transaction(true, (db) => {
      if (db.all("users").length) return;
      for (const [table, rows] of Object.entries(read("seed.json")))
        for (const row of rows) {
          if (table === "users")
            row.password_hash = hashPassword(
              process.env.DEMO_PASSWORD || "AscentDemo!2026",
            );
          db.insert(table, row);
        }
    });
}
