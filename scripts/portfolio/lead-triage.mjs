export function buildLeadTriagePrompt(input) {
  return [
    "Clasifica este lead comercial y responde solo JSON valido.",
    "",
    "Schema:",
    "{",
    '  "intent": "buy|support|partnership|spam|unknown",',
    '  "urgency": "low|medium|high",',
    '  "fit_score": 0-100,',
    '  "summary": "1 frase",',
    '  "next_action": "accion recomendada",',
    '  "missing_info": ["dato faltante"]',
    "}",
    "",
    `Lead: ${JSON.stringify(input)}`
  ].join("\n");
}

export function normalizeLeadInput(raw) {
  return {
    name: raw.name || raw.nombre || "",
    email: raw.email || "",
    company: raw.company || raw.empresa || "",
    message: raw.message || raw.mensaje || raw.text || ""
  };
}
