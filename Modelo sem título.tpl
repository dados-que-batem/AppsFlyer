___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "AppsFlyer In-App Events (Server-Side)",
  "description": "Envia eventos in-app do lado do servidor para a API Server-to-Server (S2S v3) do AppsFlyer via contêiner sGTM com governança de privacidade e ATT.",
  "containerContexts": [
    "SERVER"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "GROUP",
    "name": "groupAuthDestination",
    "displayName": "Autenticação & Destino",
    "groupStyle": "ZIPPY_OPEN",
    "subParams": [
      {
        "type": "TEXT",
        "name": "s2sToken",
        "displayName": "AppsFlyer S2S Token",
        "simpleValueType": true,
        "valueHint": "Token S2S do Security Center",
        "help": "Token criptográfico S2S emitido no AppsFlyer Security Center (AppsFlyer API and S2S tokens). Não utilize a Dev Key legada.",
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          }
        ]
      },
      {
        "type": "SELECT",
        "name": "platform",
        "displayName": "Plataforma do Aplicativo",
        "defaultValue": "auto",
        "simpleValueType": true,
        "selectItems": [
          {
            "value": "auto",
            "displayValue": "Automático (Detectar via Event Data / User-Agent)"
          },
          {
            "value": "ios",
            "displayValue": "iOS (Apple App Store)"
          },
          {
            "value": "android",
            "displayValue": "Android (Google Play Store)"
          }
        ],
        "help": "Define a plataforma de destino para formatação adequada do App ID."
      },
      {
        "type": "TEXT",
        "name": "appId",
        "displayName": "Application ID",
        "simpleValueType": true,
        "valueHint": "id123456789 ou com.empresa.app",
        "help": "Identificador da aplicação. No iOS o prefixo 'id' é obrigatório (ex: id123456789); no Android, o nome de pacote em reverse-domain (ex: com.empresa.app).",
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          }
        ]
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "groupIdentifiers",
    "displayName": "Identificadores de Usuário e Dispositivo",
    "groupStyle": "ZIPPY_OPEN",
    "subParams": [
      {
        "type": "TEXT",
        "name": "appsflyerId",
        "displayName": "AppsFlyer ID",
        "simpleValueType": true,
        "valueHint": "{{EDV - appsflyer_id}}",
        "help": "Chave primária mandatória do AppsFlyer (formato \\d{13}-\\d{1,19}). Obtida via getAppsFlyerUID() no SDK móvel."
      },
      {
        "type": "TEXT",
        "name": "customerUserId",
        "displayName": "Customer User ID",
        "simpleValueType": true,
        "valueHint": "{{EDV - user_id}}",
        "help": "Identificador de usuário autenticado no seu backend (customer_user_id)."
      },
      {
        "type": "TEXT",
        "name": "advertisingId",
        "displayName": "Advertising ID (GAID - Android)",
        "simpleValueType": true,
        "help": "Google Advertising ID (GAID) em formato UUID para dispositivos Android."
      },
      {
        "type": "TEXT",
        "name": "idfa",
        "displayName": "IDFA (iOS)",
        "simpleValueType": true,
        "help": "Identifier for Advertisers (iOS) em formato UUID. Enviado apenas com consentimento ATT autorizado."
      },
      {
        "type": "TEXT",
        "name": "idfv",
        "displayName": "IDFV (iOS)",
        "simpleValueType": true,
        "help": "Identifier for Vendors (iOS) em formato UUID."
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "groupEventData",
    "displayName": "Dados do Evento & Receita",
    "groupStyle": "ZIPPY_OPEN",
    "subParams": [
      {
        "type": "TEXT",
        "name": "eventName",
        "displayName": "Nome do Evento",
        "simpleValueType": true,
        "valueHint": "af_purchase, af_login, af_start_trial",
        "help": "Nome do evento no AppsFlyer (ex: af_purchase, af_start_trial).",
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          }
        ]
      },
      {
        "type": "TEXT",
        "name": "currency",
        "displayName": "Código da Moeda (ISO 4217)",
        "simpleValueType": true,
        "valueHint": "BRL, USD, EUR",
        "help": "Código de 3 letras ISO 4217 (ex: BRL, USD, EUR). Requerido em eventos com receita."
      },
      {
        "type": "TEXT",
        "name": "revenue",
        "displayName": "Receita do Evento",
        "simpleValueType": true,
        "help": "Valor numérico da receita (af_revenue) para conversões monetárias."
      },
      {
        "type": "SIMPLE_TABLE",
        "name": "customParameters",
        "displayName": "Parâmetros Adicionais (eventValue)",
        "simpleTableColumns": [
          {
            "defaultValue": "",
            "displayName": "Chave",
            "name": "name",
            "type": "TEXT"
          },
          {
            "defaultValue": "",
            "displayName": "Valor",
            "name": "value",
            "type": "TEXT"
          }
        ],
        "help": "Pares chave/valor adicionais serializados dentro do objeto JSON stringificado eventValue."
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "groupPrivacyAtt",
    "displayName": "Privacidade, ATT & Governança",
    "groupStyle": "ZIPPY_CLOSED",
    "subParams": [
      {
        "type": "CHECKBOX",
        "name": "validateAtt",
        "checkboxText": "Validar consentimento ATT (iOS)",
        "simpleValueType": true,
        "defaultValue": true,
        "help": "Quando habilitado, suprime o envio de IDFA caso o status de App Tracking Transparency não seja autorizado."
      },
      {
        "type": "TEXT",
        "name": "attStatus",
        "displayName": "Status ATT",
        "simpleValueType": true,
        "valueHint": "authorized, denied, restricted, not_determined",
        "help": "Status de App Tracking Transparency extraído do Event Data."
      },
      {
        "type": "TEXT",
        "name": "sharingFilter",
        "displayName": "Filtro de Compartilhamento (sharing_filter)",
        "simpleValueType": true,
        "valueHint": "all ou facebook,google_ads",
        "help": "Informe 'all' para suprimir postbacks de todas as redes, ou lista de redes separadas por vírgula."
      },
      {
        "type": "CHECKBOX",
        "name": "enableLogging",
        "checkboxText": "Habilitar logs de depuração no Cloud Logging",
        "simpleValueType": true,
        "defaultValue": false,
        "help": "Quando habilitado, registra mensagens de depuração controladas no Cloud Logging."
      }
    ]
  }
]


___SANDBOXED_JS_FOR_SERVER___

/**
 * Tag AppsFlyer In-App Events (Server-Side) - API S2S v3
 * SDLC-2 (Design): Boilerplate estrutural da interface e permissões.
 * O motor de normalização de identificadores, serialização e egress
 * será implementado nas Issues #3, #4 e #5 (SDLC-3, SDLC-4, SDLC-5).
 */

// API do Sandboxed JavaScript (sGTM)
const logToConsole = require('logToConsole');

// Governança de logs: registra apenas quando habilitado na tag
if (data.enableLogging) {
  logToConsole('AppsFlyer S2S v3 - Parâmetros recebidos:', data);
}

// Validação estrutural mínima dos campos mandatórios (NON_EMPTY)
if (!data.s2sToken) {
  logToConsole('AppsFlyer Tag Error: S2S Token e obrigatorio.');
  data.gtmOnFailure();
} else if (!data.appId) {
  logToConsole('AppsFlyer Tag Error: Application ID e obrigatorio.');
  data.gtmOnFailure();
} else if (!data.eventName) {
  logToConsole('AppsFlyer Tag Error: Nome do evento e obrigatorio.');
  data.gtmOnFailure();
} else {
  // TODO(SDLC-3): motor de extração e normalização de identificadores.
  // TODO(SDLC-4): serialização estrita do eventValue e salvaguarda de 1 KB.
  // TODO(SDLC-5): egress HTTP via sendHttpRequest com S2S token.
  data.gtmOnSuccess();
}


___SERVER_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "send_http",
        "versionId": "1"
      },
      "param": [
        {
          "key": "allowedUrls",
          "value": {
            "type": 1,
            "string": "specific"
          }
        },
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://api3.appsflyer.com/*"
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "read_event_data",
        "versionId": "1"
      },
      "param": [
        {
          "key": "eventDataAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "read_request",
        "versionId": "1"
      },
      "param": [
        {
          "key": "requestAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "headerAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "queryParameterAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "versionId": "1"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios: []


___NOTES___

Criado em 12/09/2026.
SDLC-2 (Design): estrutura da interface do template (fields/parameters) e governança de permissões.
A implementação detalhada do motor Sandboxed JS pertence às Issues #3, #4 e #5.
A bateria de testes nativos da aba ___TESTS___ pertence à Issue #6.