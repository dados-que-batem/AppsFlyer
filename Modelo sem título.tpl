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

// Importações de APIs do Sandboxed JavaScript (sGTM)
var getAllEventData = require('getAllEventData');
var getRequestHeader = require('getRequestHeader');
var makeString = require('makeString');
var getType = require('getType');
var logToConsole = require('logToConsole');

// ===== Utilitários de normalização (SDLC-3 / SPEC-S2S-V3) =====
// Literais de regex são proibidos no Sandboxed JS: todas as validações
// usam String.prototype e algoritmos utilitários.

function isAllDigits(str) {
  var s = makeString(str || '');
  if (s.length === 0) {
    return false;
  }
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    if (code < 48 || code > 57) {
      return false;
    }
  }
  return true;
}

function isHexString(str) {
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    var isDigit = code >= 48 && code <= 57;
    var isHexLower = code >= 97 && code <= 102;
    if (!isDigit && !isHexLower) {
      return false;
    }
  }
  return true;
}

function isUuid(value) {
  var s = makeString(value || '').toLowerCase();
  var parts = s.split('-');
  if (parts.length !== 5) {
    return false;
  }
  var expectedLengths = [8, 4, 4, 4, 12];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].length !== expectedLengths[i]) {
      return false;
    }
    if (!isHexString(parts[i])) {
      return false;
    }
  }
  return true;
}

function isAndroidPackage(value) {
  var s = makeString(value || '');
  var parts = s.split('.');
  if (parts.length < 2) {
    return false;
  }
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part.length === 0) {
      return false;
    }
    var firstCode = part.charCodeAt(0);
    var isFirstLetter = (firstCode >= 65 && firstCode <= 90) || (firstCode >= 97 && firstCode <= 122);
    if (!isFirstLetter) {
      return false;
    }
    for (var j = 1; j < part.length; j++) {
      var c = part.charCodeAt(j);
      var isLetter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
      var isDigit = c >= 48 && c <= 57;
      if (!isLetter && !isDigit && c !== 95) {
        return false;
      }
    }
  }
  return true;
}

function isValidAppsFlyerId(id) {
  var s = makeString(id || '');
  var parts = s.split('-');
  if (parts.length !== 2) {
    return false;
  }
  if (parts[0].length !== 13 || !isAllDigits(parts[0])) {
    return false;
  }
  if (parts[1].length < 1 || parts[1].length > 19 || !isAllDigits(parts[1])) {
    return false;
  }
  return true;
}

function normalizeAppId(appId, platform) {
  var s = makeString(appId || '');
  if (platform === 'ios' && s.length > 0) {
    if (s.indexOf('id') === 0) {
      return s;
    }
    if (isAllDigits(s)) {
      return 'id' + s;
    }
  }
  return s;
}

function resolvePlatform(configuredPlatform, eventPlatform, userAgent) {
  var configured = makeString(configuredPlatform || '').toLowerCase();
  if (configured === 'ios' || configured === 'android') {
    return configured;
  }
  var ep = makeString(eventPlatform || '').toLowerCase();
  if (ep === 'ios' || ep === 'iphone' || ep === 'ipad' || ep === 'ipod' || ep === 'apple') {
    return 'ios';
  }
  if (ep === 'android') {
    return 'android';
  }
  var ua = makeString(userAgent || '').toLowerCase();
  if (ua.indexOf('iphone') !== -1 || ua.indexOf('ipad') !== -1 || ua.indexOf('ipod') !== -1) {
    return 'ios';
  }
  if (ua.indexOf('android') !== -1) {
    return 'android';
  }
  return 'android';
}

function resolveAttConsent(eventData) {
  if (!eventData) {
    return false;
  }
  var attStatus = makeString(eventData.att_status).toLowerCase();
  if (attStatus === 'authorized' || attStatus === '3') {
    return true;
  }
  if (eventData.ad_tracking_enabled === true) {
    return true;
  }
  return false;
}

function firstNonEmpty() {
  for (var i = 0; i < arguments.length; i++) {
    var val = arguments[i];
    if (val === undefined || val === null) {
      continue;
    }
    var type = getType(val);
    if (type === 'string' || type === 'number') {
      var s = makeString(val);
      if (s.length > 0) {
        return s;
      }
    }
  }
  return null;
}

// ===== Fluxo principal do Core Engine (SDLC-3) =====
var eventData = getAllEventData() || {};
var resolvedPlatform = null;
var appIdNormalized = null;
var appsflyerId = null;
var eventName = null;
var customerUserId = null;
var advertisingId = null;
var idfa = null;
var idfv = null;
var attAuthorized = true;

if (!data.s2sToken) {
  logToConsole('AppsFlyer Tag Error: S2S Token e obrigatorio.');
  data.gtmOnFailure();
} else if (!data.appId) {
  logToConsole('AppsFlyer Tag Error: Application ID e obrigatorio.');
  data.gtmOnFailure();
} else {
  eventName = firstNonEmpty(data.eventName, eventData.event_name);
  if (!eventName) {
    logToConsole('AppsFlyer Tag Error: eventName e obrigatorio (informe na UI).');
    data.gtmOnFailure();
  } else {
    var configuredPlatform = makeString(data.platform || 'auto').toLowerCase();
    var requestUserAgent = getRequestHeader('user-agent');

    resolvedPlatform = resolvePlatform(configuredPlatform, eventData.platform, requestUserAgent);
    appIdNormalized = normalizeAppId(data.appId, resolvedPlatform);

    if (resolvedPlatform === 'android' && !isAndroidPackage(appIdNormalized)) {
      logToConsole('AppsFlyer Tag Error: App ID Android invalido ("' + appIdNormalized + '"). Esperado namespace de pacote (ex: com.empresa.app).');
      data.gtmOnFailure();
    } else {
      appsflyerId = firstNonEmpty(data.appsflyerId, eventData.appsflyer_id, eventData.af_id);
      if (!appsflyerId || !isValidAppsFlyerId(appsflyerId)) {
        logToConsole('AppsFlyer Tag Error: appsflyer_id ausente ou invalido ("' + (appsflyerId || '') + '"). Formato esperado: \\d{13}-\\d{1,19}. Despacho bloqueado.');
        data.gtmOnFailure();
      } else {
        customerUserId = firstNonEmpty(data.customerUserId, eventData.user_id);

        advertisingId = firstNonEmpty(data.advertisingId, eventData.advertising_id, eventData.gaid);
        if (advertisingId && !isUuid(advertisingId)) {
          advertisingId = null;
        }

        idfa = firstNonEmpty(data.idfa, eventData.idfa);
        attAuthorized = true;
        if (data.validateAtt !== false) {
          attAuthorized = resolveAttConsent(eventData);
        }
        if (!attAuthorized) {
          idfa = null;
        } else if (idfa && !isUuid(idfa)) {
          idfa = null;
        }

        idfv = firstNonEmpty(data.idfv, eventData.idfv);
        if (idfv && !isUuid(idfv)) {
          idfv = null;
        }

        var eventNameFinal = makeString(eventName);
        if (eventNameFinal.length > 255) {
          eventNameFinal = eventNameFinal.substring(0, 255);
        }

        // Estrutura de contexto normalizado para as fases seguintes (SDLC-4, SDLC-5)
        var context = {
          platform: resolvedPlatform,
          appId: appIdNormalized,
          eventName: eventNameFinal,
          appsflyerId: appsflyerId,
          customerUserId: customerUserId,
          advertisingId: advertisingId,
          idfa: idfa,
          idfv: idfv
        };

        if (data.enableLogging) {
          logToConsole('AppsFlyer Tag: normalizacao concluida (platform=' + resolvedPlatform + ', appId=' + appIdNormalized + ', appsflyer_id=' + appsflyerId + ').');
        }
        data.gtmOnSuccess();
      }
    }
  }
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