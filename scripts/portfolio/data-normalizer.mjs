export function buildDataNormalizerPrompt(input) {
  return [
    "Extrae y normaliza datos desde texto desordenado. Responde solo JSON valido.",
    "",
    "Schema:",
    "{",
    '  "people": [{"name": "", "email": "", "phone": "", "role": ""}],',
    '  "companies": [{"name": "", "website": "", "industry": ""}],',
    '  "dates": [{"label": "", "iso": ""}],',
    '  "tasks": [{"description": "", "owner": "", "priority": "low|medium|high"}],',
    '  "notes": ["observacion"]',
    "}",
    "",
    `Input: ${JSON.stringify(input)}`
  ].join("\n");
}
