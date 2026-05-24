const { spawn } = require("node:child_process");
const path = require("node:path");

const n8nBin = path.join(
  __dirname,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "n8n.cmd" : "n8n"
);

const port = process.env.PORT || process.env.N8N_PORT || "5678";

const child = spawn(n8nBin, ["start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    N8N_PORT: port,
    PORT: port
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
