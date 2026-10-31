/** Uses a real temporary MongoDB replica set, never the developer's database. */
const { createRequire } = require("node:module");
const { resolve, join } = require("node:path");
const { spawn } = require("node:child_process");
const {
  mkdtempSync,
  writeFileSync,
  appendFileSync,
  readFileSync,
  rmSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const root = resolve(__dirname, "..");
const { MongoMemoryReplSet } = createRequire(
  join(root, "backend/package.json"),
)("mongodb-memory-server");
(async () => {
  const tmp = mkdtempSync(join(tmpdir(), "ascent-mongo-test-"));
  const mongo = await MongoMemoryReplSet.create({
    binary: { version: "8.0.17" },
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
      args: [
        "--setParameter",
        "diagnosticDataCollectionEnabled=false",
        "--nounixsocket",
      ],
    },
  });
  const logfile = join(tmp, "server.log");
  writeFileSync(logfile, "");
  const server = spawn(process.execPath, ["src/server.js"], {
    cwd: join(root, "backend"),
    env: {
      ...process.env,
      MONGO_URI: mongo.getUri("ascent_test"),
      DEMO_MODE: "true",
      APP_ENV: "development",
      COOKIE_SECURE: "false",
      DEMO_PASSWORD: "AscentDemo!2026",
      PORT: "8012",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (b) => appendFileSync(logfile, b));
  server.stderr.on("data", (b) => appendFileSync(logfile, b));
  try {
    let ready = false;
    for (let i = 0; i < 150; i++) {
      if (server.exitCode !== null) throw Error("MERN server exited");
      try {
        if ((await fetch("http://127.0.0.1:8012/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!ready) throw Error("MERN server did not start");
    await new Promise((resolve, reject) => {
      const p = spawn(
        process.env.PYTHON || "python",
        [join(root, "tests/acceptance.py"), "http://127.0.0.1:8012"],
        { stdio: "inherit" },
      );
      p.on("error", reject);
      p.on("exit", (c) =>
        c === 0 ? resolve() : reject(Error("Acceptance suite failed")),
      );
    });
  } catch (e) {
    console.error(readFileSync(logfile, "utf8"));
    throw e;
  } finally {
    if (server.exitCode === null) {
      server.kill();
      await new Promise((r) => server.on("exit", r));
    }
    await mongo.stop();
    rmSync(tmp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
