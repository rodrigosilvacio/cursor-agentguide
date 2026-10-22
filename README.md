# LinkedIn Intelligence Agent

Agente de IA para busca e extração de contatos profissionais no LinkedIn, com interface visual em tempo real do fluxo de processamento.

## O que faz

Este projeto automatiza a busca de perfis profissionais no LinkedIn utilizando um agente de IA (Claude) que orquestra chamadas a ferramentas de scraping. O usuário informa um cargo e uma cidade, e o sistema:

1. Busca perfis correspondentes no LinkedIn via Apify
2. Extrai informações de contato (email, telefone) de cada perfil
3. Valida os dados extraídos
4. Exibe os resultados em uma tabela interativa

Todo o processo é visualizado em tempo real através de um canvas de fluxo que mostra o estado de cada etapa.

## Funcionalidades

- Busca de perfis no LinkedIn por cargo e cidade
- Extração automática de dados de contato (nome, email, telefone, empresa, localização)
- Validação de formato de email e telefone
- Visualização em tempo real do fluxo do agente via WebSocket
- Interface gráfica com canvas de nós mostrando status de cada etapa
- Modo mock para desenvolvimento sem consumir API do Apify
- Exibição do "pensamento" do agente Claude durante o processamento

## Stack Tecnológica

### Backend
- **Python 3**
- **FastAPI** - Framework web assíncrono
- **Uvicorn** - Servidor ASGI
- **Anthropic SDK** - Integração com Claude (modelo claude-opus-4-6)
- **Apify Client** - Scraping de dados do LinkedIn
- **Pydantic** - Validação de dados
- **python-dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **React 18**
- **TypeScript**
- **Vite** - Build tool e dev server
- **@xyflow/react** - Biblioteca para canvas de fluxo de nós
- **Lucide React** - Ícones

## Estrutura de Pastas

```
.
├── backend/
│   ├── main.py              # API FastAPI (endpoints REST e WebSocket)
│   ├── agent.py             # Orquestração do agente Claude com tools
│   ├── apify_scraper.py     # Integração com Apify para scraping do LinkedIn
│   ├── requirements.txt     # Dependências Python
│   └── .env                 # Variáveis de ambiente (não versionado)
│
└── frontend/
    ├── src/
    │   ├── App.tsx          # Componente principal da aplicação
    │   ├── main.tsx         # Entry point React
    │   ├── types.ts         # Definições de tipos TypeScript
    │   ├── components/
    │   │   ├── AgentFlowCanvas.tsx   # Canvas de visualização do fluxo
    │   │   ├── FilterForm.tsx        # Formulário de busca
    │   │   ├── ResultsTable.tsx      # Tabela de resultados
    │   │   └── nodes/
    │   │       ├── StartNode.tsx     # Nó inicial do fluxo
    │   │       ├── ProcessNode.tsx   # Nó de processamento
    │   │       └── ResultNode.tsx    # Nó de resultado
    │   └── hooks/
    │       └── useAgentWebSocket.ts  # Hook para conexão WebSocket
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Instalação e Execução

### Requisitos

- Python 3.10+
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

O servidor iniciará em `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Variáveis de Ambiente

O backend requer um arquivo `.env` no diretório `backend/` com as seguintes variáveis:

| Variável | Descrição |
|----------|-----------|
| `ANTHROPIC_API_KEY` | Chave de API da Anthropic para o Claude |
| `APIFY_API_TOKEN` | Token de API do Apify para scraping |
| `APIFY_ACTOR_ID` | ID do actor Apify a ser utilizado |
| `MOCK_MODE` | Se `true` e sem token Apify, usa dados fictícios |

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/debug` | Diagnóstico de configuração |
| POST | `/api/search` | Inicia uma busca (body: `{ cargo, cidade }`) |
| WS | `/ws/{task_id}` | WebSocket para acompanhar execução em tempo real |
