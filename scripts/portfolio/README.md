# Portfolio automation modules

Estos scripts son la capa logica que va a alimentar los workflows del portfolio. n8n queda como runtime, UI, credenciales, webhooks y observabilidad; la logica repetible vive aca para poder versionarla, testearla y reutilizarla.

Workflows objetivo:

- `lead-triage`: clasificacion de leads por urgencia, intencion y proximo paso.
- `customer-agent`: agente de atencion al cliente con handoff humano.
- `quote-estimator`: cotizador automatico desde un brief.
- `data-normalizer`: extractor y normalizador de datos desordenados.

Workflow publicado en n8n:

- `AI Atencion Cliente`: Chat Trigger -> AI Agent con Groq/Qwen3, Simple Memory y tres Custom Code Tools. La limpieza de etiquetas `<think>` vive como script reusable, pero no se conecta como ultimo nodo del chat porque puede bloquear el runner interactivo de n8n.

Regla de oro: secretos en variables de entorno, nunca en estos archivos.
