import "dotenv/config";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import { initialize, transaction } from "./database.js";
import { hashPassword } from "./security.js";
import { text, password, need } from "./service.js";
// Supply the password through stdin/env in automation; never put it on a command line.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
try {
  await initialize();
  const email = (await rl.question("Admin email: ")).trim().toLowerCase(),
    name = await rl.question("Admin name: ");
  need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Invalid email", 422);
  need(
    process.env.ADMIN_PASSWORD,
    "Set ADMIN_PASSWORD temporarily in your terminal environment",
    422,
  );
  await transaction(true, (db) =>
    db.insert("users", {
      email,
      name: text({ name }, "name", 2, 80),
      password_hash: hashPassword(
        password({ password: process.env.ADMIN_PASSWORD }),
      ),
      role: "admin",
      active: true,
    }),
  );
  console.log("Administrator created. Clear ADMIN_PASSWORD.");
} finally {
  rl.close();
  await mongoose.disconnect();
}
