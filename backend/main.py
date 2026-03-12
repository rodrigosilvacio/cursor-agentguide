import os
import uuid
import json
import asyncio
from pathlib import Path
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Carrega .env do diretório backend (override para sobrescrever variáveis do sistema)
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from agent import AgentRunner

app = FastAPI(title="LinkedIn Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tasks: Dict[str, dict] = {}

INITIAL_NODE_IDS = ["start", "agent", "search", "extract", "validate", "result"]


class SearchRequest(BaseModel):
    cargo: str
    cidade: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "LinkedIn Agent API is running"}


@app.get("/api/debug")
async def debug_env():
    """Diagnóstico: verifica se MOCK_MODE e token estão corretos."""
    from apify_scraper import _is_mock_mode, APIFY_ACTOR_ID
    token = (os.getenv("APIFY_API_TOKEN") or "").strip()
    return {
        "has_token": bool(token),
        "token_length": len(token),
        "mock_mode": _is_mock_mode(),
        "actor_id": APIFY_ACTOR_ID,
    }


@app.post("/api/search")
async def create_search(request: SearchRequest):
    print(f"[API] POST /api/search recebido | cargo={request.cargo} | cidade={request.cidade}", flush=True)
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "cargo": request.cargo,
        "cidade": request.cidade,
        "contacts": [],
    }
    return {"task_id": task_id}


@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()

    if task_id not in tasks:
        await websocket.send_json({"type": "error", "message": f"Task {task_id} not found"})
        await websocket.close()
        return

    task = tasks[task_id]
    task["status"] = "running"
    print(f"[API] WebSocket conectado | task_id={task_id} | iniciando agente...", flush=True)

    for node_id in INITIAL_NODE_IDS:
        await websocket.send_json({
            "type": "node_update",
            "node_id": node_id,
            "status": "idle",
            "message": "",
        })

    await websocket.send_json({
        "type": "node_update",
        "node_id": "start",
        "status": "completed",
        "message": f"Buscando: {task['cargo']} em {task['cidade']}",
    })

    async def send_ws_message(message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"WebSocket send error: {e}")

    try:
        runner = AgentRunner(task_id=task_id, websocket_callback=send_ws_message)
        contacts = await runner.run(cargo=task["cargo"], cidade=task["cidade"])
        task["status"] = "completed"
        task["contacts"] = contacts

    except WebSocketDisconnect:
        task["status"] = "disconnected"
        print(f"WebSocket disconnected for task {task_id}")

    except Exception as e:
        task["status"] = "error"
        error_msg = str(e)
        print(f"Agent error for task {task_id}: {error_msg}")
        try:
            await websocket.send_json({"type": "error", "message": error_msg})
            await websocket.send_json({
                "type": "node_update",
                "node_id": "agent",
                "status": "error",
                "message": f"Erro: {error_msg}",
            })
        except Exception:
            pass

    finally:
        try:
            await websocket.close()
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
