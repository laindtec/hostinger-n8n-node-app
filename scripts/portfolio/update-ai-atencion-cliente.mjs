import { readFile } from "node:fs/promises";
import { getWorkflow, updateWorkflow, listWorkflows } from "../lib/n8n-api.mjs";
import {
  MODEL,
  PREPARE_CUSTOMER_CONTEXT_CODE,
  SYSTEM_MESSAGE,
  WORKFLOW_NAME
} from "./ai-atencion-cliente-definition.mjs";

async function findWorkflowByName(name) {
  const result = await listWorkflows({ limit: 100 });
  const workflow = (result.data || []).find((item) => item.name === name);

  if (!workflow) {
    throw new Error(`Workflow not found: ${name}`);
  }

  return workflow.id;
}

const workflowId = process.env.N8N_WORKFLOW_ID || await findWorkflowByName(WORKFLOW_NAME);
let workflow;

if (process.env.N8N_REPAIR_FROM_EXPORT) {
  const exportPath = process.env.N8N_REPAIR_FROM_EXPORT;
  workflow = JSON.parse(await readFile(exportPath, "utf8"));
} else {
  workflow = await getWorkflow(workflowId);
}

const existing = new Map(workflow.nodes.map((node) => [node.name, node]));
const chatTrigger = existing.get("When chat message received");
const aiAgent = existing.get("AI Agent");
const groqModel = existing.get("Groq Chat Model");

if (!chatTrigger || !aiAgent || !groqModel) {
  throw new Error("Expected base nodes not found: Chat Trigger, AI Agent and Groq Chat Model are required.");
}

function upsertNode(name, fallback) {
  const current = existing.get(name);

  if (!current) {
    return fallback;
  }

  return {
    ...fallback,
    id: current.id,
    name: current.name,
    disabled: current.disabled,
    notes: current.notes,
    credentials: current.credentials,
    webhookId: current.webhookId,
    parameters: {
      ...(current.parameters || {}),
      ...(fallback.parameters || {})
    }
  };
}

const nextNodes = [
  {
    ...chatTrigger,
    position: [0, 0]
  },
  upsertNode("Build Customer Context", {
    id: "9f5f86e8-b46e-4e13-af59-6ab951e6079a",
    name: "Build Customer Context",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [260, 0],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: PREPARE_CUSTOMER_CONTEXT_CODE
    }
  }),
  {
    ...aiAgent,
    position: [560, 0],
    parameters: {
      ...aiAgent.parameters,
      promptType: "define",
      text: "={{ $json.agentInput }}",
      options: {
        ...(aiAgent.parameters?.options || {}),
        systemMessage: SYSTEM_MESSAGE
      }
    }
  },
  upsertNode("Simple Conversation Memory", {
    id: "d3118b80-86c5-4a04-9937-c7d42e6eb50f",
    name: "Simple Conversation Memory",
    type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    typeVersion: 1.1,
    position: [400, 420],
    parameters: {
      sessionKey: "={{ $json.sessionId || 'laind-demo-session' }}",
      contextWindowLength: 8
    }
  }),
  {
    ...groqModel,
    position: [390, 230],
    parameters: {
      ...groqModel.parameters,
      model: MODEL,
      options: {
        ...(groqModel.parameters?.options || {}),
        temperature: 0.2
      }
    }
  }
];

const nextWorkflow = {
  name: WORKFLOW_NAME,
  nodes: nextNodes,
  connections: {
    "When chat message received": {
      main: [[{ node: "Build Customer Context", type: "main", index: 0 }]]
    },
    "Build Customer Context": {
      main: [[{ node: "AI Agent", type: "main", index: 0 }]]
    },
    "Groq Chat Model": {
      ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
    },
    "Simple Conversation Memory": {
      ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
    }
  },
  settings: {}
};

await updateWorkflow(workflowId, nextWorkflow);

console.log(`Updated ${WORKFLOW_NAME} (${workflowId})`);
console.log(`Groq model: ${MODEL}`);
