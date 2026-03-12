import os
import json
import re
import asyncio
from typing import Callable, Awaitable
from dotenv import load_dotenv
import anthropic

from apify_scraper import search_linkedin_people, get_contact_details

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

TOOL_NODE_MAP = {
    "search_linkedin_profiles": "search",
    "extract_contact_info": "extract",
    "validate_contact": "validate",
}

TOOLS = [
    {
        "name": "search_linkedin_profiles",
        "description": "Busca perfis no LinkedIn baseado em cargo e cidade. Retorna uma lista de perfis encontrados em formato JSON.",
        "input_schema": {
            "type": "object",
            "properties": {
                "cargo": {
                    "type": "string",
                    "description": "O cargo ou título profissional para buscar (ex: CEO, Diretor de Marketing)",
                },
                "cidade": {
                    "type": "string",
                    "description": "A cidade para filtrar os resultados (ex: São Paulo, Rio de Janeiro)",
                },
            },
            "required": ["cargo", "cidade"],
        },
    },
    {
        "name": "extract_contact_info",
        "description": "Extrai informações de contato detalhadas de um perfil do LinkedIn, incluindo email e telefone.",
        "input_schema": {
            "type": "object",
            "properties": {
                "profile_url": {
                    "type": "string",
                    "description": "A URL do perfil LinkedIn",
                },
                "profile_name": {
                    "type": "string",
                    "description": "O nome da pessoa no perfil",
                },
            },
            "required": ["profile_url", "profile_name"],
        },
    },
    {
        "name": "validate_contact",
        "description": "Valida o formato do email e telefone de um contato.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Nome do contato",
                },
                "email": {
                    "type": "string",
                    "description": "Endereço de email a ser validado",
                },
                "phone": {
                    "type": "string",
                    "description": "Número de telefone a ser validado",
                },
            },
            "required": ["name", "email", "phone"],
        },
    },
]

SYSTEM_PROMPT = (
    "Você é um agente especializado em buscar dados de contato profissional no LinkedIn. "
    "Use as ferramentas disponíveis para encontrar perfis baseados no cargo e cidade fornecidos. "
    "Siga esta estratégia:\n"
    "1. Use search_linkedin_profiles com o cargo e cidade fornecidos pelo usuário.\n"
    "2. Para TODOS os perfis retornados, use extract_contact_info para obter os dados de contato.\n"
    "3. Use validate_contact para validar cada contato (mesmo que email ou telefone estejam vazios).\n"
    "4. Retorne todos os contatos encontrados com seus dados (nome, cargo, empresa, localização, "
    "email e telefone — campos vazios são aceitáveis).\n"
    "IMPORTANTE: Processe TODOS os perfis retornados pela busca sem pular nenhum."
)


def _validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def _validate_phone(phone: str) -> bool:
    digits = re.sub(r"[^\d]", "", phone)
    return len(digits) >= 10


async def _execute_tool(tool_name: str, tool_input: dict) -> str:
    if tool_name == "search_linkedin_profiles":
        cargo = tool_input.get("cargo", "")
        cidade = tool_input.get("cidade", "")
        profiles = await search_linkedin_people(cargo, cidade)
        return json.dumps(profiles, ensure_ascii=False)

    elif tool_name == "extract_contact_info":
        profile_url = tool_input.get("profile_url", "")
        profile_name = tool_input.get("profile_name", "")
        contact = await get_contact_details(profile_url)
        if not contact.get("name"):
            contact["name"] = profile_name
        return json.dumps(contact, ensure_ascii=False)

    elif tool_name == "validate_contact":
        name = tool_input.get("name", "")
        email = tool_input.get("email", "")
        phone = tool_input.get("phone", "")
        email_valid = _validate_email(email) if email else False
        phone_valid = _validate_phone(phone) if phone else False
        # Contato é válido se tiver ao menos nome
        has_name = bool(name.strip())
        result = {
            "name": name,
            "email": email,
            "phone": phone,
            "email_valid": email_valid,
            "phone_valid": phone_valid,
            "valid": has_name,
            "message": "Contato encontrado" if has_name else "Nome inválido",
        }
        return json.dumps(result, ensure_ascii=False)

    return json.dumps({"error": f"Ferramenta desconhecida: {tool_name}"})


class AgentRunner:
    def __init__(self, task_id: str, websocket_callback: Callable[[dict], Awaitable[None]]):
        self.task_id = task_id
        self.send = websocket_callback
        self.client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        self.contacts: list[dict] = []

    async def _send_node_update(self, node_id: str, status: str, message: str = "", data: dict = None):
        payload = {
            "type": "node_update",
            "node_id": node_id,
            "status": status,
            "message": message,
        }
        if data is not None:
            payload["data"] = data
        await self.send(payload)

    async def _send_thinking(self, text: str):
        await self.send({"type": "agent_thinking", "text": text})

    async def run(self, cargo: str, cidade: str) -> list[dict]:
        await self._send_node_update("agent", "running", "Agente Claude iniciado")

        messages = [
            {
                "role": "user",
                "content": f"Busque contatos profissionais no LinkedIn com o cargo '{cargo}' na cidade '{cidade}'. "
                           f"Extraia informações de contato completas e valide cada um.",
            }
        ]

        validated_contacts: dict[str, dict] = {}
        extracted_contacts: dict[str, dict] = {}

        max_iterations = 30
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            await self._send_thinking(f"Processando iteração {iteration}...")

            response = await self.client.messages.create(
                model="claude-opus-4-6",
                max_tokens=16000,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            thinking_text_parts = []
            for block in response.content:
                if block.type == "thinking":
                    thinking_text_parts.append(block.thinking)

            if thinking_text_parts:
                combined_thinking = " | ".join(thinking_text_parts)
                await self._send_thinking(combined_thinking)

            if response.stop_reason == "end_turn":
                await self._send_node_update("agent", "completed", "Agente concluiu a análise")
                break

            if response.stop_reason == "tool_use":
                tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

                messages.append({"role": "assistant", "content": response.content})

                tool_results = []

                for tool_use_block in tool_use_blocks:
                    tool_name = tool_use_block.name
                    tool_input = tool_use_block.input
                    tool_use_id = tool_use_block.id
                    node_id = TOOL_NODE_MAP.get(tool_name, "agent")

                    await self._send_node_update(
                        node_id, "running",
                        f"Executando: {tool_name}",
                        {"tool_input": tool_input}
                    )

                    try:
                        result_str = await _execute_tool(tool_name, tool_input)
                        result_data = json.loads(result_str)

                        if tool_name == "extract_contact_info":
                            profile_url = tool_input.get("profile_url", "")
                            if result_data and result_data.get("name"):
                                extracted_contacts[profile_url] = result_data

                        elif tool_name == "validate_contact":
                            name = tool_input.get("name", "")
                            if result_data.get("valid"):
                                for url, contact in extracted_contacts.items():
                                    if contact.get("name") == name:
                                        validated_contacts[url] = contact
                                        break

                        await self._send_node_update(
                            node_id, "completed",
                            f"Concluído: {tool_name}",
                            {"result": result_data if isinstance(result_data, dict) else {"count": len(result_data) if isinstance(result_data, list) else 0}}
                        )

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": result_str,
                        })

                    except Exception as e:
                        error_msg = str(e)
                        await self._send_node_update(node_id, "error", f"Erro: {error_msg}")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": json.dumps({"error": error_msg}),
                            "is_error": True,
                        })

                messages.append({"role": "user", "content": tool_results})
            else:
                await self._send_node_update("agent", "completed", "Agente finalizou")
                break

        if validated_contacts:
            self.contacts = list(validated_contacts.values())
        elif extracted_contacts:
            self.contacts = list(extracted_contacts.values())

        if self.contacts:
            await self._send_node_update("validate", "completed", f"{len(self.contacts)} contatos validados")
            await self._send_node_update("result", "completed", f"{len(self.contacts)} contatos encontrados")
        else:
            await self._send_node_update("result", "completed", "Nenhum contato encontrado")

        await self.send({"type": "results", "contacts": self.contacts})

        return self.contacts
