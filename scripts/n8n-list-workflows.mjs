import { listWorkflows } from "./lib/n8n-api.mjs";

const result = await listWorkflows({ limit: Number(process.env.N8N_LIST_LIMIT || 100) });
const workflows = result.data || [];

for (const workflow of workflows) {
  console.log(`${workflow.id}\t${workflow.active ? "active" : "inactive"}\t${workflow.name}`);
}

if (!workflows.length) {
  console.log("No workflows found.");
}
