import { getWorkflow, updateWorkflow, listWorkflows } from "../lib/n8n-api.mjs";
import {
  CASE_SUMMARY_TOOL_CODE,
  CLEAN_RESPONSE_CODE,
  HANDOFF_TOOL_CODE,
  MODEL,
  SERVICE_CATALOG_TOOL_CODE,
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
const workflow = await getWorkflow(workflowId);

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
  {
    ...aiAgent,
    position: [260, 0],
    parameters: {
      ...aiAgent.parameters,
      options: {
        ...(aiAgent.parameters?.options || {}),
        systemMessage: SYSTEM_MESSAGE
      }
    }
  },
  upsertNode("Clean AI Response", {
    id: "30f82089-e8ea-46d1-9b01-fd41ffb8bb31",
    name: "Clean AI Response",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [560, 0],
    parameters: {
      mode: "runOnceForAllItems",
      jsCode: CLEAN_RESPONSE_CODE
    }
  }),
  upsertNode("Simple Conversation Memory", {
    id: "d3118b80-86c5-4a04-9937-c7d42e6eb50f",
    name: "Simple Conversation Memory",
    type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    typeVersion: 1.1,
    position: [80, 450],
    parameters: {
      sessionKey: "={{ $json.sessionId || 'laind-demo-session' }}",
      contextWindowLength: 8
    }
  }),
  {
    ...groqModel,
    position: [80, 230],
    parameters: {
      ...groqModel.parameters,
      model: MODEL,
      options: {
        ...(groqModel.parameters?.options || {}),
        temperature: 0.2
      }
    }
  },
  upsertNode("consultar_servicios_laind", {
    id: "98f8f940-92dc-45a2-bdf4-1630a4a5e9d5",
    name: "consultar_servicios_laind",
    type: "@n8n/n8n-nodes-langchain.toolCode",
    typeVersion: 1.3,
    position: [260, 260],
    parameters: {
      name: "consultar_servicios_laind",
      description: "Consulta el catalogo de servicios de Laind y recomienda el workflow mas adecuado segun el mensaje del usuario. Input: consulta o contexto del usuario.",
      language: "javaScript",
      jsCode: SERVICE_CATALOG_TOOL_CODE,
      specifyInputSchema: false
    }
  }),
  upsertNode("evaluar_handoff", {
    id: "44733d2a-75d7-4c94-8e73-2217f5dd2e36",
    name: "evaluar_handoff",
    type: "@n8n/n8n-nodes-langchain.toolCode",
    typeVersion: 1.3,
    position: [470, 260],
    parameters: {
      name: "evaluar_handoff",
      description: "Evalua si la conversacion requiere derivacion humana, por precio final, urgencia, datos sensibles, incidente productivo o reclamo. Input: mensaje o contexto.",
      language: "javaScript",
      jsCode: HANDOFF_TOOL_CODE,
      specifyInputSchema: false
    }
  }),
  upsertNode("resumir_caso_cliente", {
    id: "87cbf923-1fe8-4433-af59-549556375f36",
    name: "resumir_caso_cliente",
    type: "@n8n/n8n-nodes-langchain.toolCode",
    typeVersion: 1.3,
    position: [680, 260],
    parameters: {
      name: "resumir_caso_cliente",
      description: "Resume la consulta del cliente, extrae email/telefono si existen, detecta servicio probable y lista datos faltantes para seguimiento. Input: conversacion o mensaje del usuario.",
      language: "javaScript",
      jsCode: CASE_SUMMARY_TOOL_CODE,
      specifyInputSchema: false
    }
  })
];

const nextWorkflow = {
  name: WORKFLOW_NAME,
  nodes: nextNodes,
  connections: {
    "When chat message received": {
      main: [[{ node: "AI Agent", type: "main", index: 0 }]]
    },
    "AI Agent": {
      main: [[{ node: "Clean AI Response", type: "main", index: 0 }]]
    },
    "Groq Chat Model": {
      ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
    },
    "Simple Conversation Memory": {
      ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
    },
    "consultar_servicios_laind": {
      ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
    },
    "evaluar_handoff": {
      ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
    },
    "resumir_caso_cliente": {
      ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
    }
  },
  settings: {}
};

await updateWorkflow(workflowId, nextWorkflow);

console.log(`Updated ${WORKFLOW_NAME} (${workflowId})`);
console.log(`Groq model: ${MODEL}`);
