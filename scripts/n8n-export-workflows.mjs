import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getWorkflow, listWorkflows } from "./lib/n8n-api.mjs";

const outDir = process.env.N8N_EXPORT_DIR || "exports/workflows";

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "workflow";
}

await mkdir(outDir, { recursive: true });

const list = await listWorkflows({ limit: Number(process.env.N8N_LIST_LIMIT || 100) });
const workflows = list.data || [];

for (const item of workflows) {
  const workflow = await getWorkflow(item.id);
  const fileName = `${slugify(workflow.name)}.${workflow.id}.json`;
  const filePath = path.join(outDir, fileName);
  await writeFile(filePath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
  console.log(`Exported ${workflow.name} -> ${filePath}`);
}

if (!workflows.length) {
  console.log("No workflows found.");
}
