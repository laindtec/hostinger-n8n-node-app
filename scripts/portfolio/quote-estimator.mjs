export function buildQuotePrompt(brief) {
  return [
    "Genera una cotizacion preliminar para este brief. Responde solo JSON valido.",
    "",
    "Schema:",
    "{",
    '  "scope_summary": "resumen del alcance",',
    '  "complexity": "low|medium|high",',
    '  "estimated_hours": {"min": 0, "max": 0},',
    '  "suggested_price_usd": {"min": 0, "max": 0},',
    '  "assumptions": ["supuesto"],',
    '  "questions": ["pregunta para cerrar alcance"],',
    '  "proposal_email": "email breve en espanol"',
    "}",
    "",
    `Brief: ${JSON.stringify(brief)}`
  ].join("\n");
}
