"""Nyaya Sahayak — Hugging Face Gradio + FastAPI Space Entrypoint."""

import os
import gradio as gr
from api.server import app as fastapi_app


def consult_legal_ai(query: str):
    """Fallback interactive QA for direct testing via Gradio UI."""
    if not query.strip():
        return "Please enter an Indian legal question."
    from core.pipeline import ask
    try:
        res = ask(query)
        return res.get("answer", "No answer returned.")
    except Exception as e:
        return f"Error processing query: {e}"


with gr.Blocks(title="Nyaya Sahayak — Legal AI Assistant") as demo:
    gr.Markdown("# 🏛️ Nyaya Sahayak (न्याय सहायक)")
    gr.Markdown(
        "**Multi-Agent Statutory Intelligence Engine for Indian Citizens**\n\n"
        "Grounded in Indian Jurisprudence (BNS 2023, BNSS 2023, BSA 2023, Constitution of India). "
        "Powered by LangGraph multi-agent DAG, FastMCP statutory tools, and ChromaDB vector retrieval."
    )
    with gr.Row():
        query_input = gr.Textbox(
            placeholder="Ask about your rights under Indian Law (e.g. tenant rights, cyber fraud, consumer protection)...",
            label="Citizen Legal Query",
            lines=3,
        )
    with gr.Row():
        output = gr.Textbox(
            label="Legal Advice & Statutory References",
            lines=12,
            interactive=False,
        )
    submit_btn = gr.Button("Analyze Legal Query", variant="primary")
    submit_btn.click(fn=consult_legal_ai, inputs=query_input, outputs=output)

    gr.Markdown(
        "---\n"
        "### Production REST & Streaming Endpoints:\n"
        "- **Health Check:** `/api/health`\n"
        "- **Interactive Swagger Docs:** `/docs`\n"
        "- **Real-Time Token Streaming (SSE):** `/api/ask/stream`\n"
        "- **Conversation Sessions:** `/api/sessions`"
    )

# Mount Gradio interface onto the production FastAPI app
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
