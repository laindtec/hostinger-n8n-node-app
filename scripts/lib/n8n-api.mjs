const DEFAULT_BASE_URL = "https://n8n.laind.io/api/v1";

export class N8nApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "N8nApiError";
    this.status = status;
    this.body = body;
  }
}

export function getN8nConfig() {
  const baseUrl = (process.env.N8N_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const apiKey = process.env.N8N_API_KEY;

  if (!apiKey) {
    throw new N8nApiError("Missing N8N_API_KEY. Put it in your shell env or .env.local, never in Git.");
  }

  return { baseUrl, apiKey };
}

export async function n8nRequest(path, options = {}) {
  const { baseUrl, apiKey } = getN8nConfig();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new N8nApiError(`n8n API request failed: ${response.status}`, {
      status: response.status,
      body
    });
  }

  return body;
}

export async function listWorkflows({ limit = 100, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return n8nRequest(`/workflows?${params.toString()}`);
}

export async function getWorkflow(id) {
  return n8nRequest(`/workflows/${encodeURIComponent(id)}`);
}

export async function createWorkflow(workflow) {
  return n8nRequest("/workflows", {
    method: "POST",
    body: JSON.stringify(workflow)
  });
}

export async function updateWorkflow(id, workflow) {
  return n8nRequest(`/workflows/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(workflow)
  });
}

export async function activateWorkflow(id) {
  return n8nRequest(`/workflows/${encodeURIComponent(id)}/activate`, {
    method: "POST"
  });
}

export async function deactivateWorkflow(id) {
  return n8nRequest(`/workflows/${encodeURIComponent(id)}/deactivate`, {
    method: "POST"
  });
}
