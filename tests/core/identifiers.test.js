/**
 * Suite de testes unitários do Core Engine (SDLC-3 - Issue #3).
 * Extrai o bloco ___SANDBOXED_JS_FOR_SERVER___ do template e o executa
 * em um sandbox Node.js (vm) com as APIs do sGTM mockadas, cobrindo:
 *  - Normalização do App ID (injeção do prefixo 'id' no iOS e preservação
 *    do namespace reverse-domain no Android).
 *  - Resolução de plataforma (config explícita → Event Data → User-Agent).
 *  - Cascata do appsflyer_id (data.appsflyerId → event_data.appsflyer_id → event_data.af_id)
 *    com validação de formato (13 dígitos - 1 a 19 dígitos).
 *  - Cascata do customer_user_id (data.customerUserId → event_data.user_id).
 *  - Conformidade ATT (supressão do idfa quando o consentimento não foi autorizado).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const TEMPLATE_PATH = fs.existsSync(path.resolve(__dirname, '../../template.tpl'))
  ? path.resolve(__dirname, '../../template.tpl')
  : path.resolve(__dirname, '../../Modelo sem título.tpl');
const AF_ID = '1617274484000-5786735';
const AF_ID_ALT = '1617274484000-99999';
const VALID_UUID = 'EA7583CD-A667-48BC-B806-42ECB2B48D12';
const IOS_NUMERIC_APP_ID = '123456789';
const ANDROID_PACKAGE_APP_ID = 'com.empresa.aplicacao';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('PASS  ' + name);
  } catch (err) {
    failed += 1;
    console.error('FAIL  ' + name);
    console.error('      ' + err.message.split('\n').join('\n      '));
  }
}

function extractSandboxedJs(content) {
  const marker = '___SANDBOXED_JS_FOR_SERVER___';
  const start = content.indexOf(marker);
  if (start === -1) {
    throw new Error('Bloco ' + marker + ' nao encontrado no template');
  }
  const endMarkers = ['___SERVER_PERMISSIONS___', '___TESTS___', '___NOTES___'];
  let end = content.length;
  for (const m of endMarkers) {
    const idx = content.indexOf(m, start);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  }
  return content.slice(start + marker.length, end);
}

function hasLog(calls, fragment) {
  return calls.logs.some(function (line) {
    return line.indexOf(fragment) !== -1;
  });
}

function runTag(opts) {
  opts = opts || {};
  const calls = { success: 0, failure: 0, logs: [] };

  const data = {
    s2sToken: 'mp_test_s2s_token',
    appId: IOS_NUMERIC_APP_ID,
    platform: 'ios',
    eventName: 'af_purchase',
    validateAtt: true,
    enableLogging: false,
    gtmOnSuccess: function () { calls.success += 1; },
    gtmOnFailure: function () { calls.failure += 1; }
  };
  Object.assign(data, opts.data || {});

  const headers = opts.headers || {};
  const mocks = {
    getAllEventData: function () {
      return opts.eventData || {};
    },
    getRequestHeader: function (name) {
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === String(name).toLowerCase()) {
          return headers[key];
        }
      }
      return undefined;
    },
    makeString: function (value) {
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    },
    getType: function (value) {
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        return 'array';
      }
      return typeof value;
    },
    logToConsole: function () {
      calls.logs.push(Array.prototype.slice.call(arguments).join(' '));
    },
    JSON: JSON,
    Object: Object,
    makeNumber: function (value) {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      var n = Number(value);
      return isNaN(n) ? null : n;
    },
    makeTableMap: function (table, keyColumn, valueColumn) {
      var map = {};
      if (Array.isArray(table)) {
        table.forEach(function (row) {
          if (row && row[keyColumn] !== undefined && row[keyColumn] !== null && String(row[keyColumn]) !== '') {
            map[String(row[keyColumn])] = row[valueColumn];
          }
        });
      }
      return map;
    },
    getRemoteAddress: function () {
      return undefined;
    },
    encodeUriComponent: function (value) {
      return encodeURIComponent(String(value));
    },
    sendHttpRequest: function (url, callback, options, postBody) {
      callback(200, {}, '');
      return undefined;
    }
  };

  const sandbox = {
    require: function (name) {
      return mocks[name] || function () {};
    },
    data: data
  };
  vm.createContext(sandbox);
  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  vm.runInContext(extractSandboxedJs(content), sandbox);

  return {
    calls: calls,
    data: data,
    sandbox: sandbox,
    context: sandbox.context,
    resolvedPlatform: sandbox.resolvedPlatform,
    appIdNormalized: sandbox.appIdNormalized,
    appsflyerId: sandbox.appsflyerId,
    attAuthorized: sandbox.attAuthorized
  };
}

// ===== Utilitários de normalização =====

test('isAllDigits aceita apenas sequencias de digitos', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.isAllDigits('123'), true);
  assert.strictEqual(s.isAllDigits('12a'), false);
  assert.strictEqual(s.isAllDigits(''), false);
  assert.strictEqual(s.isAllDigits('12.3'), false);
  assert.strictEqual(s.isAllDigits(undefined), false);
});

test('isUuid aceita UUID no padrao 8-4-4-4-12', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.isUuid(VALID_UUID), true);
  assert.strictEqual(s.isUuid('EA7583CD-A667-48BC-B806-42ECB2B48D1'), false);
  assert.strictEqual(s.isUuid('nao-e-um-uuid-ok'), false);
  assert.strictEqual(s.isUuid(''), false);
});

test('isAndroidPackage exige reverse-domain (ao menos 2 segmentos)', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.isAndroidPackage(ANDROID_PACKAGE_APP_ID), true);
  assert.strictEqual(s.isAndroidPackage('com.empresa'), true);
  assert.strictEqual(s.isAndroidPackage('empresa'), false);
  assert.strictEqual(s.isAndroidPackage('9empresa.app'), false);
  assert.strictEqual(s.isAndroidPackage(''), false);
});

test('isValidAppsFlyerId aceita 13 digitos - 1 a 19 digitos', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.isValidAppsFlyerId(AF_ID), true);
  assert.strictEqual(s.isValidAppsFlyerId('0000000000000-1'), true);
  assert.strictEqual(s.isValidAppsFlyerId('5786735'), false);
  assert.strictEqual(s.isValidAppsFlyerId(AF_ID + '-1'), false);
  assert.strictEqual(s.isValidAppsFlyerId('abcdefghijklm-5786735'), false);
  assert.strictEqual(s.isValidAppsFlyerId('1234567890123-abcdef1'), false);
});

// ===== Normalização do App ID =====

test('normalizeAppId injeta prefixo id em App ID iOS numerico', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.normalizeAppId(IOS_NUMERIC_APP_ID, 'ios'), 'id' + IOS_NUMERIC_APP_ID);
});

test('normalizeAppId iOS com prefixo id ja presente e idempotente', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.normalizeAppId('id' + IOS_NUMERIC_APP_ID, 'ios'), 'id' + IOS_NUMERIC_APP_ID);
});

test('normalizeAppId preserva namespace reverse-domain no Android', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.normalizeAppId(ANDROID_PACKAGE_APP_ID, 'android'), ANDROID_PACKAGE_APP_ID);
});

test('normalizeAppId nao injeta prefixo id em App ID Android numerico', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.normalizeAppId(IOS_NUMERIC_APP_ID, 'android'), IOS_NUMERIC_APP_ID);
});

// ===== Resolução de plataforma =====

test('resolvePlatform respeita config explicita', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolvePlatform('ios', 'android', 'ua android'), 'ios');
  assert.strictEqual(s.resolvePlatform('android', 'ios', 'ua iphone'), 'android');
  assert.strictEqual(s.resolvePlatform('auto', 'Web'), 'android');
  assert.strictEqual(s.resolvePlatform(undefined, undefined), 'android');
});

test('resolvePlatform detecta iOS/Android via Event Data platform', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolvePlatform('auto', 'ios', ''), 'ios');
  assert.strictEqual(s.resolvePlatform('auto', 'iphone', ''), 'ios');
  assert.strictEqual(s.resolvePlatform('auto', 'android', ''), 'android');
  assert.strictEqual(s.resolvePlatform('auto', 'Web', ''), 'android');
});

test('resolvePlatform detecta iOS via User-Agent (sem politica de sinal)', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolvePlatform('auto', undefined, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'ios');
});

test('resolvePlatform detecta Android via User-Agent (apos Event Data nulo)', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolvePlatform('auto', null, 'Mozilla/5.0 (Linux; Android 14; Pixel 8)'), 'android');
});

// ===== Fluxo principal: validação de campos básicos =====

test('despacho bloqueado sem s2sToken (gtmOnFailure + log)', () => {
  const out = runTag({ data: { s2sToken: '' } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'S2S Token'));
});

test('despacho bloqueado sem appId (gtmOnFailure + log)', () => {
  const out = runTag({ data: { appId: '' } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'Application ID'));
});

test('despacho bloqueado sem eventName (gtmOnFailure + log)', () => {
  const out = runTag({ data: { eventName: '' } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'eventName'));
});

// ===== Fluxo principal: appsflyer_id =====

test('fluxo iOS completo com appsflyer_id valido via data.appsflyerId', () => {
  const out = runTag({ data: { appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
  assert.strictEqual(out.resolvedPlatform, 'ios');
  assert.strictEqual(out.appIdNormalized, 'id' + IOS_NUMERIC_APP_ID);
  assert.strictEqual(out.context.appId, 'id' + IOS_NUMERIC_APP_ID);
  assert.strictEqual(out.context.platform, 'ios');
  assert.strictEqual(out.context.appsflyerId, AF_ID);
  assert.strictEqual(out.context.eventName, 'af_purchase');
});

test('appsflyer_id proveniente de event_data.appsflyer_id quando data.appsflyerId ausente', () => {
  const out = runTag({ eventData: { appsflyer_id: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.appsflyerId, AF_ID);
});

test('appsflyer_id proveniente de event_data.af_id como fallback final da cascata', () => {
  const out = runTag({ eventData: { af_id: AF_ID_ALT } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.appsflyerId, AF_ID_ALT);
});

test('cascata prioriza data.appsflyerId sobre event_data.appsflyer_id e event_data.af_id', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID },
    eventData: { appsflyer_id: AF_ID_ALT, af_id: '0000000000000-1' }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.appsflyerId, AF_ID);
});

test('despacho bloqueado com appsflyer_id ausente (gtmOnFailure + log)', () => {
  const out = runTag();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'appsflyer_id ausente ou invalido'));
});

test('despacho bloqueado com appsflyer_id malformado (gtmOnFailure + log)', () => {
  const out = runTag({ data: { appsflyerId: '5786735' } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'appsflyer_id ausente ou invalido'));
});

test('despacho bloqueado com appsflyer_id de outra campanha (sem prefixo de 13 digitos)', () => {
  const out = runTag({ data: { appsflyerId: 'abcdefghijklm-5786735' } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
});

// ===== Fluxo principal: customer_user_id =====

test('customer_user_id proveniente de data.customerUserId', () => {
  const out = runTag({ data: { appsflyerId: AF_ID, customerUserId: 'usuario_123' } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.context.customerUserId, 'usuario_123');
});

test('customer_user_id proveniente de event_data.user_id quando data.customerUserId ausente', () => {
  const out = runTag({ data: { appsflyerId: AF_ID }, eventData: { user_id: 'usuario_eda' } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.context.customerUserId, 'usuario_eda');
});

test('customer_user_id ausente nao bloqueia o despacho', () => {
  const out = runTag({ data: { appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.context.customerUserId, null);
});

// ===== Fluxo principal: Android =====

test('fluxo Android completo com appsflyer_id valido', () => {
  const out = runTag({ data: { appId: ANDROID_PACKAGE_APP_ID, platform: 'android', appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.resolvedPlatform, 'android');
  assert.strictEqual(out.context.appId, ANDROID_PACKAGE_APP_ID);
  assert.strictEqual(out.context.appsflyerId, AF_ID);
});

test('despacho bloqueado com App ID Android invalido (gtmOnFailure + log)', () => {
  const out = runTag({ data: { appId: 'empresa', platform: 'android', appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'App ID Android invalido'));
});

test('plataforma auto via Event Data android usa fallback android e preserva o pacote', () => {
  const out = runTag({
    data: { platform: 'auto', appId: ANDROID_PACKAGE_APP_ID, appsflyerId: AF_ID },
    eventData: { platform: 'android' }
  });
  assert.strictEqual(out.resolvedPlatform, 'android');
  assert.strictEqual(out.context.appId, ANDROID_PACKAGE_APP_ID);
  assert.strictEqual(out.calls.success, 1);
});

test('plataforma auto via User-Agent de iPhone resolve para iOS (appId numerico vira id...)', () => {
  const out = runTag({
    data: { platform: 'auto', appsflyerId: AF_ID },
    headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }
  });
  assert.strictEqual(out.resolvedPlatform, 'ios');
  assert.strictEqual(out.context.appId, 'id' + IOS_NUMERIC_APP_ID);
  assert.strictEqual(out.calls.success, 1);
});

// ===== Conformidade ATT (supressão do idfa) =====

test('at_status denied suprime o idfa no contexto', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: VALID_UUID },
    eventData: { att_status: 'denied' }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.attAuthorized, false);
  assert.strictEqual(out.context.idfa, null);
});

test('at_status authorized mantem o idfa no contexto', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: VALID_UUID },
    eventData: { att_status: 'authorized' }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.attAuthorized, true);
  assert.strictEqual(out.context.idfa, VALID_UUID);
});

test('at_status "3" (autorizado) mantem o idfa no contexto', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: VALID_UUID },
    eventData: { att_status: '3' }
  });
  assert.strictEqual(out.attAuthorized, true);
  assert.strictEqual(out.context.idfa, VALID_UUID);
});

test('ad_tracking_enabled true mantem o idfa mesmo sem at_status', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: VALID_UUID },
    eventData: { ad_tracking_enabled: true }
  });
  assert.strictEqual(out.attAuthorized, true);
  assert.strictEqual(out.context.idfa, VALID_UUID);
});

test('sem sinal de consentimento (eventData vazio) suprime o idfa (privacy-first)', () => {
  const out = runTag({ data: { appsflyerId: AF_ID, idfa: VALID_UUID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.attAuthorized, false);
  assert.strictEqual(out.context.idfa, null);
});

test('validateAtt false anula a checagem ATT e propaga o idfa', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: VALID_UUID, validateAtt: false },
    eventData: { att_status: 'denied' }
  });
  assert.strictEqual(out.attAuthorized, true);
  assert.strictEqual(out.context.idfa, VALID_UUID);
});

test('idfa com formato invalido de UUID e descartado mesmo com consentimento', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfa: 'este-nao-e-um-uuid', validateAtt: false }
  });
  assert.strictEqual(out.context.idfa, null);
});

// ===== Advertising IDs auxiliares =====

test('advertising_id (GAID) reconhecido e normalizado como UUID', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID },
    eventData: { advertising_id: VALID_UUID }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.context.advertisingId, VALID_UUID);
});

test('advertising_id invalido de UUID e descartado', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID },
    eventData: { advertising_id: 'xyz' }
  });
  assert.strictEqual(out.context.advertisingId, null);
});

test('idfv reconhecido e normalizado como UUID', () => {
  const out = runTag({
    data: { appsflyerId: AF_ID, idfv: VALID_UUID }
  });
  assert.strictEqual(out.context.idfv, VALID_UUID);
});

test('campo data.platform invalido (auto/ausente) com Event Data nulo resolve via UA', () => {
  const out = runTag({
    data: { platform: 'auto', appId: ANDROID_PACKAGE_APP_ID, appsflyerId: AF_ID },
    headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Build/UP1A' }
  });
  assert.strictEqual(out.resolvedPlatform, 'android');
  assert.strictEqual(out.context.platform, 'android');
  assert.strictEqual(out.calls.success, 1);
});

test('evento com nome acima de 255 caracteres e truncado no contexto', () => {
  const longName = 'ev_' + new Array(300).join('a');
  const out = runTag({ data: { eventName: longName, appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.context.eventName.length, 255);
});

console.log('\nTotal: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);