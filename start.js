const { spawn } = require("node:child_process");
const path = require("node:path");

const n8nCli = path.join(
  __dirname,
  "node_modules",
  "n8n",
  "bin",
  "n8n"
);

const port = process.env.PORT || process.env.N8N_PORT || "5678";
const listenAddress = process.env.N8N_LISTEN_ADDRESS || "0.0.0.0";

console.log(`Starting n8n on ${listenAddress}:${port}`);

const child = spawn(process.execPath, [n8nCli, "start"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    N8N_LISTEN_ADDRESS: listenAddress,
    N8N_PORT: port,
    PORT: port
  }
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(`[n8n stdout] ${chunk}`);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(`[n8n stderr] ${chunk}`);
});

child.on("error", (error) => {
  console.error("Failed to start n8n:", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  console.log(`n8n process exited with code=${code ?? "null"} signal=${signal ?? "null"}`);

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`Received ${signal}, stopping n8n`);
    child.kill(signal);
  });
}

setTimeout(() => {
  console.log("n8n startup watchdog: process is still running after 10 seconds");
}, 10000);
