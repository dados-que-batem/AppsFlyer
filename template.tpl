___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "AppsFlyer In-App Events",
  "brand": {
    "id": "github.com_dados-que-batem",
    "displayName": "dados-que-batem"
  },
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
    "displayName": "Autenticação \u0026 Destino",
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
        "help": "Identificador da aplicação. No iOS o prefixo \u0027id\u0027 é obrigatório (ex: id123456789); no Android, o nome de pacote em reverse-domain (ex: com.empresa.app).",
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
    "displayName": "Dados do Evento \u0026 Receita",
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
    "displayName": "Privacidade, ATT \u0026 Governança",
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
        "help": "Informe \u0027all\u0027 para suprimir postbacks de todas as redes, ou lista de redes separadas por vírgula."
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
var JSON = require('JSON');
var Object = require('Object');
var encodeUriComponent = require('encodeUriComponent');
var getAllEventData = require('getAllEventData');
var getRequestHeader = require('getRequestHeader');
var getType = require('getType');
var logToConsole = require('logToConsole');
var makeNumber = require('makeNumber');
var makeString = require('makeString');
var makeTableMap = require('makeTableMap');
var sendHttpRequest = require('sendHttpRequest');

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

function firstNonEmpty(a, b, c, d) {
  if (a !== undefined && a !== null) {
    var sa = makeString(a);
    if (sa.length > 0) {
      return sa;
    }
  }
  if (b !== undefined && b !== null) {
    var sb = makeString(b);
    if (sb.length > 0) {
      return sb;
    }
  }
  if (c !== undefined && c !== null) {
    var sc = makeString(c);
    if (sc.length > 0) {
      return sc;
    }
  }
  if (d !== undefined && d !== null) {
    var sd = makeString(d);
    if (sd.length > 0) {
      return sd;
    }
  }
  return null;
}

// ===== Construtor de payload, serialização de eventValue e régua de 1KB (SDLC-4) =====
var PAYLOAD_SIZE_LIMIT = 1024;

// Cálculo determinístico de bytes UTF-8 compatível com a sandbox do GTM
// (Buffer.byteLength não está disponível no Sandboxed JS).
function utf8ByteLength(str) {
  var s = makeString(str || '');
  var bytes = 0;
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    if (code <= 127) {
      bytes += 1;
    } else if (code <= 2047) {
      bytes += 2;
    } else if (code >= 55296 && code <= 56319) {
      // Par de substitutos (surrogate pair) mapeia para 4 bytes
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

// Monta o objeto interno de valores e o serializa via JSON.stringify.
// Sem receita nem parâmetros customizados, retorna estritamente "".
function buildEventValue(revenue, currency, customParams) {
  var hasValues = false;
  var values = {};

  if (revenue !== undefined && revenue !== null && revenue !== '') {
    var revNum = makeNumber(revenue);
    if (revNum !== null && revNum === revNum) {
      values.af_revenue = revNum;
      hasValues = true;
    }
  }

  if (currency && values.af_revenue !== undefined) {
    values.af_currency = currency;
    hasValues = true;
  }

  if (customParams) {
    var cpType = getType(customParams);
    if (cpType === 'array') {
      for (var i = 0; i < customParams.length; i++) {
        var row = customParams[i];
        if (row && row.name !== undefined && row.name !== null && row.name !== '') {
          values[makeString(row.name)] = row.value;
          hasValues = true;
        }
      }
    } else if (cpType === 'object' || cpType === 'map') {
      var cpKeys = Object.keys(customParams);
      for (var j = 0; j < cpKeys.length; j++) {
        var key = cpKeys[j];
        if (key && customParams[key] !== undefined && customParams[key] !== null) {
          values[key] = customParams[key];
          hasValues = true;
        }
      }
    }
  }

  if (!hasValues) {
    return '';
  }
  return JSON.stringify(values);
}

// Valida código ISO 4217: exatamente 3 letras maiúsculas. Regex literal é
// proibido no Sandboxed JS, portanto a checagem usa faixas de char codes.
function resolveCurrency(value) {
  var s = makeString(value || '').toUpperCase();
  if (s.length !== 3) {
    return null;
  }
  for (var i = 0; i < 3; i++) {
    var code = s.charCodeAt(i);
    if (code < 65 || code > 90) {
      return null;
    }
  }
  return s;
}

// Mapeia sharing_filter: "all" ou lista de redes separadas por vírgula.
function resolveSharingFilter(value) {
  var s = makeString(value || '').trim();
  if (s === '') {
    return null;
  }
  if (s.toLowerCase() === 'all') {
    return 'all';
  }
  var networks = s.split(',');
  var result = [];
  for (var i = 0; i < networks.length; i++) {
    var network = networks[i].trim();
    if (network !== '') {
      result.push(network);
    }
  }
  if (result.length === 0) {
    return null;
  }
  return result;
}

// Valida o formato UTC estrito yyyy-MM-dd HH:mm:ss.SSS.
function isEventTimeUtc(value) {
  var s = makeString(value || '');
  if (s.length !== 23) {
    return false;
  }
  if (s.charAt(4) !== '-' || s.charAt(7) !== '-' || s.charAt(10) !== ' ' || s.charAt(13) !== ':' || s.charAt(16) !== ':' || s.charAt(19) !== '.') {
    return false;
  }
  var positions = [0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 22];
  for (var i = 0; i < positions.length; i++) {
    var code = s.charCodeAt(positions[i]);
    if (code < 48 || code > 57) {
      return false;
    }
  }
  return true;
}

function isPlainObject(value) {
  var type = getType(value);
  return type === 'object' || type === 'map';
}

// Compila o payload com SOMENTE as chaves canônicas do schema (additionalProperties: false).
function buildPayload(c) {
  var p = {};
  p.appsflyer_id = c.appsflyerId;
  if (c.customerUserId) {
    p.customer_user_id = c.customerUserId;
  }
  if (c.eventName) {
    p.eventName = c.eventName;
  }
  if (c.eventCurrency) {
    p.eventCurrency = c.eventCurrency;
  }
  p.eventValue = c.eventValue;
  if (c.eventTime) {
    p.eventTime = c.eventTime;
  }
  if (c.ip) {
    p.ip = c.ip;
  }
  if (c.ua) {
    p.ua = c.ua;
  }
  if (c.os) {
    p.os = c.os;
  }
  if (c.bundleIdentifier) {
    p.bundleIdentifier = c.bundleIdentifier;
  }
  if (c.appVersionName) {
    p.app_version_name = c.appVersionName;
  }
  if (c.advertisingId) {
    p.advertising_id = c.advertisingId;
  }
  if (c.idfa) {
    p.idfa = c.idfa;
  }
  if (c.idfv) {
    p.idfv = c.idfv;
  }
  if (c.sharingFilter !== undefined && c.sharingFilter !== null) {
    p.sharing_filter = c.sharingFilter;
  }
  return p;
}

function rebuildEventValueExcluding(ev, excludedKeys) {
  var result = {};
  var keys = Object.keys(ev);
  var count = 0;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var excluded = false;
    for (var j = 0; j < excludedKeys.length; j++) {
      if (excludedKeys[j] === k) {
        excluded = true;
        break;
      }
    }
    if (!excluded) {
      result[k] = ev[k];
      count++;
    }
  }
  return count > 0 ? result : null;
}

function eventValueHasKeys(ev) {
  if (!ev) {
    return false;
  }
  var keys = Object.keys(ev);
  return keys.length > 0;
}

// Salvaguarda de 1KB: se o payload serializado exceder 1024 bytes, executa poda
// seletiva dos parâmetros customizados supérfluos, preservando af_revenue e
// af_currency. Se ainda exceder o limite, retorna null para abortar o despacho.
function enforcePayloadLimit(payload) {
  if (utf8ByteLength(JSON.stringify(payload)) <= PAYLOAD_SIZE_LIMIT) {
    return payload;
  }
  var evRaw = payload.eventValue;
  if (getType(evRaw) === 'string' && evRaw !== '') {
    var ev = JSON.parse(evRaw);
    if (ev && isPlainObject(ev)) {
      var allKeys = Object.keys(ev);
      var removableKeys = [];
      for (var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        if (key !== 'af_revenue' && key !== 'af_currency') {
          removableKeys.push(key);
        }
      }
      var excluded = [];
      for (var j = 0; j < removableKeys.length; j++) {
        excluded.push(removableKeys[j]);
        var prunedEv = rebuildEventValueExcluding(ev, excluded);
        payload.eventValue = prunedEv ? JSON.stringify(prunedEv) : '';
        if (utf8ByteLength(JSON.stringify(payload)) <= PAYLOAD_SIZE_LIMIT) {
          return payload;
        }
      }
    }
  }
  return null;
}

// ===== Camada de egress de rede e tratamento de respostas S2S (SDLC-5) =====
// Guarda de idempotência: assegura que nem gtmOnSuccess() nem gtmOnFailure()
// sejam invocados mais de uma vez (runtime sGTM síncrono, callback ou Promise).
var dispatchCompleted = false;

function completeDispatch(success, isError, diagnostic) {
  if (dispatchCompleted) {
    return;
  }
  dispatchCompleted = true;
  if (diagnostic && (isError || data.enableLogging)) {
    logToConsole((isError ? 'AppsFlyer Tag Error: ' : 'AppsFlyer Tag: ') + diagnostic);
  }
  if (success) {
    data.gtmOnSuccess();
  } else {
    data.gtmOnFailure();
  }
}

function handleNetworkError() {
  completeDispatch(false, true, 'Timeout de rede (4000ms excedidos sem resposta remota) ou falha de conexao.');
}

function handleResponse(statusCode, headers, body) {
  if (statusCode === undefined || statusCode === null) {
    completeDispatch(false, true, 'Resposta de rede vazia ou invalida (statusCode ausente).');
    return;
  }
  var status = makeNumber(statusCode);
  if (status === null || status !== status) {
    completeDispatch(false, true, 'Resposta de rede vazia ou invalida (statusCode invalido).');
    return;
  }
  if (status >= 200 && status <= 299) {
    completeDispatch(true, false, 'resposta da API AppsFlyer recebida (status ' + status + ').');
    return;
  }
  if (status === 400) {
    completeDispatch(false, true, 'Falha de autenticacao ou payload malformado (verifique S2S Token e formato do payload) - status 400.');
  } else if (status === 401) {
    completeDispatch(false, true, 'Acesso nao autorizado para este Application ID - status 401.');
  } else if (status === 403) {
    completeDispatch(false, true, 'Funcionalidade S2S nao habilitada no plano AppsFlyer - status 403.');
  } else {
    completeDispatch(false, true, 'Erro interno temporario nos servidores do AppsFlyer - status ' + status + '.');
  }
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

        // ===== Compilação do payload S2S v3 (SDLC-4) =====
        var customParams = null;
        if (data.customParameters && getType(data.customParameters) === 'array') {
          customParams = makeTableMap(data.customParameters, 'name', 'value');
        }
        var revenue = firstNonEmpty(data.revenue, eventData.revenue, eventData.value);
        var currency = resolveCurrency(firstNonEmpty(data.currency, eventData.currency));
        var eventValue = buildEventValue(revenue, currency, customParams);
        var sharingFilter = resolveSharingFilter(firstNonEmpty(data.sharingFilter, eventData.sharing_filter));

        var eventTime = firstNonEmpty(data.eventTime, eventData.event_time);
        if (eventTime && !isEventTimeUtc(eventTime)) {
          eventTime = null;
        }
        var bundleIdentifier = null;
        var bundleCandidate = firstNonEmpty(eventData.bundle_identifier, eventData.bundleIdentifier);
        if (bundleCandidate && isAndroidPackage(bundleCandidate)) {
          bundleIdentifier = bundleCandidate;
        }

        var payload = buildPayload({
          appsflyerId: appsflyerId,
          customerUserId: customerUserId,
          eventName: eventNameFinal,
          eventCurrency: currency,
          eventValue: eventValue,
          eventTime: eventTime,
          ip: firstNonEmpty(eventData.ip_override, eventData.client_ip_address, getRequestHeader('x-forwarded-for')),
          ua: getRequestHeader('user-agent'),
          os: firstNonEmpty(eventData.os_version, eventData.os),
          bundleIdentifier: bundleIdentifier,
          appVersionName: firstNonEmpty(eventData.app_version_name, eventData.app_ver_name),
          advertisingId: advertisingId,
          idfa: idfa,
          idfv: idfv,
          sharingFilter: sharingFilter
        });

        payload = enforcePayloadLimit(payload);
        if (!payload) {
          logToConsole('AppsFlyer Tag Error: payload serializado excede 1024 bytes mesmo apos poda seletiva. Despacho abortado para prevenir erro 400 da API remota.');
          data.gtmOnFailure();
        } else {
          context.payload = payload;
          context.payloadBytes = utf8ByteLength(JSON.stringify(payload));
          if (data.enableLogging) {
            logToConsole('AppsFlyer Tag: normalizacao concluida (platform=' + resolvedPlatform + ', appId=' + appIdNormalized + ', appsflyer_id=' + appsflyerId + ').');
            logToConsole('AppsFlyer Tag: payload compilado (' + context.payloadBytes + ' bytes).');
          }

          // ===== Despacho HTTP assíncrono para a API S2S v3 (SDLC-5) =====
          var dispatchUrl = 'https://api3.appsflyer.com/inappevent/' + encodeUriComponent(appIdNormalized);
          var requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'authentication': makeString(data.s2sToken)
            },
            timeout: 4000
          };
          var postBody = JSON.stringify(payload);
          if (data.enableLogging) {
            logToConsole('AppsFlyer Tag: despachando POST ' + dispatchUrl + ' (' + context.payloadBytes + ' bytes).');
          }

          var responsePromise = sendHttpRequest(dispatchUrl, function (statusCode, headers, body) {
            handleResponse(statusCode, headers, body);
          }, requestOptions, postBody);

          if (responsePromise && getType(responsePromise.then) === 'function') {
            responsePromise.then(function (result) {
              if (result && getType(result.statusCode) === 'number') {
                handleResponse(result.statusCode, result.headers, result.body);
              } else {
                handleNetworkError();
              }
            }, function () {
              handleNetworkError();
            });
          }
        }
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
                "string": "https://api3.appsflyer.com/"
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

Created on 12/09/2026, 21:47:59


