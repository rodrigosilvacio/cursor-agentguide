import os
import re
import random
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Garante que .env seja carregado do diretório backend (override=True para sobrescrever env do sistema)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path, override=True)

APIFY_API_TOKEN = (os.getenv("APIFY_API_TOKEN") or "").strip()
APIFY_ACTOR_ID = os.getenv("APIFY_ACTOR_ID", "harvestapi/linkedin-profile-search").strip()


def _is_mock_mode() -> bool:
    """Usa mock APENAS quando MOCK_MODE=true E não há token. Se há token, SEMPRE usa Apify real."""
    token = (os.getenv("APIFY_API_TOKEN") or "").strip()
    if token:
        return False  # Token presente → sempre Apify real, ignora MOCK_MODE
    mock_env = (os.getenv("MOCK_MODE") or "").lower().strip()
    return mock_env == "true"


# Para log de startup
MOCK_MODE = False

if MOCK_MODE:
    print("[Apify] MOCK_MODE ativo - dados fictícios. Para usar Apify real: MOCK_MODE=false e APIFY_API_TOKEN configurado.")
else:
    print(f"[Apify] Modo real - usando actor {APIFY_ACTOR_ID}")

FIRST_NAMES = [
    "Ana Paula", "Carlos Eduardo", "Fernanda", "Ricardo", "Mariana",
    "João Paulo", "Camila", "Bruno", "Luciana", "Rafael",
    "Patrícia", "Thiago", "Gabriela", "Marcos", "Juliana",
]
LAST_NAMES = [
    "Ferreira", "Mendes", "Costa", "Souza", "Santos",
    "Barbosa", "Neves", "Maia", "Lima", "Oliveira",
    "Rodrigues", "Alves", "Pereira", "Gomes", "Araújo",
]
COMPANIES = [
    "TechBrasil Soluções", "Grupo Inovação Digital", "StartupBR",
    "DevHub Brasil", "Logística Express", "Comercial Brasil LTDA",
    "Fintech Soluções", "Sistemas Integrados SA", "Agência Digital SP",
    "Consultoria Estratégica", "Indústrias Reunidas BR", "Varejo Online",
]
DOMAINS = [
    "techbrasil.com.br", "grupoinovacao.com.br", "startupbr.io",
    "devhub.com.br", "logisticaexpress.com.br", "comercialbrasil.com.br",
    "fintechsolucoes.com.br", "sistemasintegrados.com.br", "agenciadigital.com.br",
    "consultoria.com.br", "industriasbr.com.br", "varejodigital.com.br",
]


def _slug(name: str) -> str:
    s = name.lower()
    s = s.replace("ã", "a").replace("â", "a").replace("á", "a").replace("à", "a")
    s = s.replace("ê", "e").replace("é", "e").replace("è", "e")
    s = s.replace("í", "i").replace("î", "i")
    s = s.replace("õ", "o").replace("ô", "o").replace("ó", "o")
    s = s.replace("ú", "u").replace("û", "u")
    s = s.replace("ç", "c")
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return s.strip().replace(" ", "-")


def _generate_mock_profiles(cargo: str, cidade: str, count: int = 6) -> list[dict]:
    """Gera perfis mock dinamicamente com o cargo e cidade exatos fornecidos."""
    random.seed(f"{cargo}-{cidade}")
    used_names = set()
    profiles = []
    attempts = 0
    while len(profiles) < count and attempts < 50:
        attempts += 1
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        full_name = f"{first} {last}"
        if full_name in used_names:
            continue
        used_names.add(full_name)
        slug = _slug(full_name)
        profiles.append({
            "name": full_name,
            "profile_url": f"https://www.linkedin.com/in/{slug}",
            "title": cargo,
            "location": cidade,
            "company": random.choice(COMPANIES),
        })
    return profiles


def _generate_mock_contact(name: str, profile_url: str, cargo: str, cidade: str, company: str) -> dict:
    """Gera dados de contato mock para um perfil, coerentes com cargo/cidade."""
    random.seed(profile_url)
    slug = _slug(name)
    parts = slug.split("-")
    first_part = parts[0] if parts else slug
    last_part = parts[-1] if len(parts) > 1 else slug
    company_idx = COMPANIES.index(company) if company in COMPANIES else random.randint(0, len(DOMAINS) - 1)
    domain = DOMAINS[company_idx % len(DOMAINS)]
    email = f"{first_part}.{last_part}@{domain}"
    phone = f"+55 {random.choice(['11', '21', '31', '41', '51', '61', '71', '81'])} 9{random.randint(6000, 9999)}-{random.randint(1000, 9999)}"
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "title": cargo,
        "company": company,
        "location": cidade,
    }


def _parse_name(item: dict) -> str:
    """Extrai nome completo do item Apify (harvestapi retorna firstName/lastName)."""
    full = item.get("fullName") or item.get("name") or ""
    if full:
        return full.strip()
    first = (item.get("firstName") or "").strip()
    last = (item.get("lastName") or "").strip()
    return f"{first} {last}".strip()


def _parse_position(item: dict) -> tuple[str, str]:
    """Extrai cargo e empresa do item. currentPositions é uma lista de posições."""
    positions = item.get("currentPositions") or []
    if positions and isinstance(positions, list):
        pos = positions[0]
        title = pos.get("title") or pos.get("jobTitle") or ""
        company = pos.get("companyName") or pos.get("company") or ""
        return title.strip(), company.strip()
    # Fallback para campos diretos
    title = item.get("headline") or item.get("title") or item.get("jobTitle") or ""
    company_raw = item.get("currentCompany") or item.get("company") or {}
    company = (
        company_raw.get("name", "") if isinstance(company_raw, dict) else str(company_raw or "")
    )
    return title.strip(), company.strip()


def _parse_location(item: dict) -> str:
    """Extrai localização. location pode ser string ou dict com linkedinText."""
    loc = item.get("location") or item.get("addressWithCountry") or ""
    if isinstance(loc, dict):
        return loc.get("linkedinText") or loc.get("text") or loc.get("name") or ""
    return str(loc).strip()


# Cache para manter consistência entre search e get_contact_details
_mock_cache: dict[str, dict] = {}


async def search_linkedin_people(cargo: str, cidade: str, max_results: int = 8) -> list[dict]:
    mock = _is_mock_mode()
    print(f"[Apify] search_linkedin_people | MOCK_MODE={mock} | cargo={cargo} | cidade={cidade}", flush=True)
    if mock:
        await asyncio.sleep(1.5)
        count = min(max_results, 6)
        profiles = _generate_mock_profiles(cargo, cidade, count)
        # Pré-popula cache de contatos para manter consistência
        for p in profiles:
            if p["profile_url"] not in _mock_cache:
                _mock_cache[p["profile_url"]] = _generate_mock_contact(
                    p["name"], p["profile_url"], cargo, cidade, p["company"]
                )
        return profiles

    try:
        from apify_client import ApifyClient
        client = ApifyClient(APIFY_API_TOKEN)

        # harvestapi/linkedin-profile-search:
        # searchQuery = palavras-chave de busca
        # locations   = lista de locais para filtrar
        # currentJobTitles = lista de cargos exatos
        # profileScraperMode = "Full + email search" para obter email já na busca
        run_input = {
            "searchQuery": f"{cargo} {cidade}",
            "currentJobTitles": [cargo],
            "locations": [cidade],
            "profileScraperMode": "Full + email search",
            "startPage": 1,
            "takePages": max(1, max_results // 25 + 1),
            "maxItems": max_results,
        }

        run = await asyncio.to_thread(
            lambda: client.actor(APIFY_ACTOR_ID).call(run_input=run_input)
        )

        dataset_items = await asyncio.to_thread(
            lambda: list(client.dataset(run["defaultDatasetId"]).iterate_items())
        )

        items = []
        for item in dataset_items:
            name = _parse_name(item)
            profile_url_item = item.get("linkedinUrl") or item.get("profileUrl") or item.get("url") or ""
            title, company = _parse_position(item)
            location = _parse_location(item)

            if name and profile_url_item:
                email = item.get("email") or item.get("emailAddress") or ""
                phone = item.get("phone") or item.get("phoneNumber") or ""
                # Cacheia TODOS os perfis (com ou sem email/phone) para evitar
                # chamadas adicionais à Apify em get_contact_details
                _mock_cache[profile_url_item] = {
                    "name": name, "email": email, "phone": phone,
                    "title": title, "company": company, "location": location,
                }
                items.append({
                    "name": name, "profile_url": profile_url_item,
                    "title": title, "location": location, "company": company,
                })

        print(f"Apify search returned {len(items)} profiles for '{cargo}' in '{cidade}'", flush=True)
        return items

    except Exception as e:
        print(f"Apify search error: {e}", flush=True)
        raise RuntimeError(f"Erro ao buscar no Apify: {e}") from e


async def get_contact_details(profile_url: str) -> dict:
    mock = _is_mock_mode()
    print(f"[Apify] get_contact_details | MOCK_MODE={mock} | url={profile_url[:60]}...", flush=True)
    if mock:
        await asyncio.sleep(0.8)
        if profile_url in _mock_cache:
            return _mock_cache[profile_url]
        slug = profile_url.rstrip("/").split("/")[-1]
        name = slug.replace("-", " ").title()
        contact = _generate_mock_contact(name, profile_url, "Profissional", "Brasil", "Empresa BR")
        _mock_cache[profile_url] = contact
        return contact

    # Retorna do cache populado pela busca — sem segunda chamada à Apify
    if profile_url in _mock_cache:
        print(f"[Apify] get_contact_details | cache hit para {profile_url[:60]}", flush=True)
        return _mock_cache[profile_url]

    # Perfil não encontrado no cache (não veio da busca): retorna dict vazio
    print(f"[Apify] get_contact_details | sem cache para {profile_url[:60]}", flush=True)
    return {}
