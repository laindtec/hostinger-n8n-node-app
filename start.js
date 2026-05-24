const { spawn } = require("node:child_process");
const path = require("node:path");

const n8nBin = path.join(
  __dirname,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "n8n.cmd" : "n8n"
);

const port = process.env.PORT || process.env.N8N_PORT || "5678";
const listenAddress = process.env.N8N_LISTEN_ADDRESS || "0.0.0.0";

console.log(`Starting n8n on ${listenAddress}:${port}`);

const child = spawn(n8nBin, ["start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    N8N_LISTEN_ADDRESS: listenAddress,
    N8N_PORT: port,
    PORT: port
  }
});

child.on("error", (error) => {
  console.error("Failed to start n8n:", error);
  process.exit(1);
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
