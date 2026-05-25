const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const n8nCli = path.join(__dirname, "node_modules", "n8n", "bin", "n8n");
const publicPort = process.env.PORT || process.env.N8N_PUBLIC_PORT || "3000";
const n8nPort = process.env.N8N_PORT || "5678";
const listenAddress = process.env.N8N_LISTEN_ADDRESS || "0.0.0.0";
const n8nUrl = `http://127.0.0.1:${n8nPort}`;

console.log(`Starting Hostinger proxy on ${listenAddress}:${publicPort}`);
console.log(`Starting n8n internally on 127.0.0.1:${n8nPort}`);
console.log(`Hostinger PORT=${process.env.PORT || "not set"}, N8N_PORT=${process.env.N8N_PORT || "not set"}`);
console.log(`n8n CLI path=${n8nCli}`);

const child = spawn(process.execPath, [n8nCli, "start"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    N8N_LISTEN_ADDRESS: "127.0.0.1",
    N8N_PORT: n8nPort,
    PORT: n8nPort,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --trace-uncaught --unhandled-rejections=strict`.trim()
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
});

child.on("exit", (code, signal) => {
  console.log(`n8n process exited with code=${code ?? "null"} signal=${signal ?? "null"}`);
});

const server = http.createServer((req, res) => {
  const target = new URL(req.url || "/", n8nUrl);
  const proxyReq = http.request(
    target,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: process.env.N8N_HOST || req.headers.host || "n8n.laind.io"
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", () => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("n8n is starting. Refresh in a moment.\n");
  });

  req.pipe(proxyReq);
});

server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(Number(n8nPort), "127.0.0.1", () => {
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
    for (const [name, value] of Object.entries(req.headers)) {
      upstream.write(`${name}: ${value}\r\n`);
    }
    upstream.write("\r\n");
    upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  upstream.on("error", () => socket.destroy());
});

server.listen(Number(publicPort), listenAddress, () => {
  console.log(`Hostinger proxy listening on ${listenAddress}:${publicPort}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`Received ${signal}, stopping n8n and proxy`);
    child.kill(signal);
    server.close(() => process.exit(0));
  });
}
