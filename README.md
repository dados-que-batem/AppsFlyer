# AppsFlyer In-App Events (Server-Side) Tag for Google Tag Manager

[![CI](https://github.com/dados-que-batem/AppsFlyer/actions/workflows/ci.yml/badge.svg)](https://github.com/dados-que-batem/AppsFlyer/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![sGTM Context](https://img.shields.io/badge/sGTM-Server--Side-green.svg)](https://developers.google.com/tag-platform/tag-manager/server-side)

Tag personalizada para **Server-Side Google Tag Manager (sGTM)** desenvolvida sob a metodologia **Spec-Driven Development (SDD)** para envio de eventos *in-app* (`event_in_app`) à **API Server-to-Server (S2S v3)** do AppsFlyer.

---

## 📌 Visão Geral da Arquitetura

A coleta de eventos via contêiner de servidor transfere a responsabilidade da comunicação externa do cliente móvel para um ambiente em nuvem controlado (ex: Google Cloud Run):

```
┌─────────────────┐       HTTPS       ┌─────────────────────────┐       HTTPS       ┌─────────────────────────┐
│   Mobile App    │ ────────────────▶ │  Server-Side GTM        │ ────────────────▶ │   AppsFlyer S2S v3      │
│  (GA4 / Custom) │                   │  Client ▶ Trigger ▶ Tag │                   │   api3.appsflyer.com    │
└─────────────────┘                   └─────────────────────────┘                   └─────────────────────────┘
```

### Principais Benefícios:
- **Resolução Automática de Plataforma:** Injeção compulsória e idempotente do prefixo `id` no iOS (`123456789` $\rightarrow$ `id123456789`), eliminando o descarte silencioso na API v3.
- **Governança de Privacidade e ATT:** Supressão proativa do `idfa` quando o status ATT não for explicitamente autorizado (`authorized`).
- **Salvaguarda de 1 KB:** Verificação estrita de comprimento em bytes UTF-8 com poda seletiva defensiva e bloqueio prévio antes do envio.
- **Serialização Estrita:** `eventValue` sempre serializado como JSON stringificado (`"{\"af_revenue\":...}"`) ou string vazia `""`, prevenindo rejeições por objetos nativos.

---

## 🚀 Guia de Configuração Rápida (Menos de 5 minutos)

### 1. Pré-requisitos
1. Obtenha o seu **S2S Token** no painel do AppsFlyer: *Security Center* $\rightarrow$ *Server-to-server tokens*.
2. Assegure que os eventos móveis enviados ao contêiner sGTM contenham o parâmetro `appsflyer_id` (obtido no aplicativo via `getAppsFlyerUID`).

### 2. Importação do Modelo no sGTM
1. No painel do seu contêiner Server-Side, vá em **Modelos (Templates)** $\rightarrow$ **Novo**.
2. Clique no menu de três pontos no canto superior direito $\rightarrow$ **Importar**.
3. Selecione o arquivo [`template.tpl`](template.tpl) deste repositório e clique em **Salvar**.

### 3. Criação e Configuração da Tag
1. Vá em **Tags** $\rightarrow$ **Nova** $\rightarrow$ selecione **AppsFlyer In-App Events (Server-Side)**.
2. Preencha os campos nos 4 grupos organizados:
   - **Autenticação & Destino:** Insira seu `s2sToken`, defina `platform` (`auto`, `ios` ou `android`) e informe o `appId`.
   - **Identificadores:** Mantenha os defaults de Event Data (`{{EDV - appsflyer_id}}` e `{{EDV - user_id}}`).
   - **Dados do Evento & Receita:** Informe o `eventName` (ex: `af_purchase`), `currency` e `revenue` se aplicável.
   - **Privacidade & Governança:** Mantenha *Validar consentimento ATT* marcado para conformidade com iOS.
3. Configure o Acionador (Trigger) para disparar nos eventos de conversão desejados (ex: `purchase`, `af_purchase`).

---

## 📋 Mapeamento de Eventos (GA4 $\rightarrow$ AppsFlyer)

| Evento GA4 / sGTM | Evento Recomendado AppsFlyer | Parâmetros de Receita Esperados |
| :--- | :--- | :--- |
| `purchase` | `af_purchase` | `af_revenue`, `af_currency` |
| `sign_up` | `af_complete_registration` | `af_registration_method` |
| `login` | `af_login` | — |
| `view_item` | `af_content_view` | `af_content_id`, `af_content_type` |
| `add_to_cart` | `af_add_to_cart` | `af_price`, `af_content_id` |
| `begin_checkout` | `af_initiated_checkout` | `af_revenue`, `af_currency` |
| `subscribe` | `af_subscribe` | `af_revenue`, `af_currency` |

---

## 🔧 Diagnóstico e Resolução de Problemas (Troubleshooting)

| Código HTTP | Diagnóstico no Console | Causa Raiz | Ação Recomendada |
| :---: | :--- | :--- | :--- |
| **200 OK** | `resposta da API AppsFlyer recebida (status 200)` | Sucesso aparente | Se o evento não aparecer no painel, certifique-se de que o App ID iOS possui o prefixo `id` e aguarde até 1 hora para processamento. |
| **400 Bad Request** | `Falha de autenticacao ou payload malformado` | Token incorreto/expirado, `appsflyer_id` inválido ou payload > 1024 bytes | Verificar o S2S Token no Security Center e conferir se o `appsflyer_id` é gerado pelo SDK. |
| **401 Unauthorized** | `Acesso nao autorizado para este Application ID` | Token S2S sem acesso ao app | Conferir permissões da conta do AppsFlyer para o `app_id` configurado. |
| **403 Forbidden** | `Funcionalidade S2S nao habilitada no plano AppsFlyer` | Plano contratado sem suporte S2S | Entrar em contato com o suporte ou gestor de conta AppsFlyer para ativação do pacote S2S. |
| **5xx Server Error** | `Erro interno temporario nos servidores do AppsFlyer` | Indisponibilidade remota | Falha transitória nos servidores do AppsFlyer. |

---

## 🧪 Suíte de Testes Automatizados

O repositório inclui 136 testes automatizados cobrindo todas as etapas do SDLC:

```bash
# Executar a esteira completa de testes (136 testes)
npm test

# Executar suítes individuais
npm run test:schema       # Validação estrita do JSON Schema via AJV (19 testes)
npm run test:template     # Integridade estrutural e permissões do template.tpl (18 testes)
npm run test:core         # Normalização de IDs, plataforma e ATT (41 testes)
npm run test:payload      # Montagem do payload e salvaguarda de 1 KB (29 testes)
npm run test:networking   # Camada de transporte HTTP e erros (17 testes)
npm run test:gtm          # Cenários de teste nativos do sGTM Truth Engine (12 testes)
```

---

## 📄 Licença

Distribuído sob a licença **Apache 2.0**. Consulte o arquivo [`LICENSE`](LICENSE) para obter mais informações.
