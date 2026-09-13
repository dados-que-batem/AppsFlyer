/**
 * Suite de testes do motor de payload do Core Engine (SDLC-4 - Issue #4).
 * Extrai o bloco ___SANDBOXED_JS_FOR_SERVER___ do template e o executa em um
 * sandbox Node.js (vm) com as APIs do sGTM mockadas, cobrindo:
 *  - Construção e serialização de eventValue (JSON stringified ou string vazia "").
 *  - Injeção de metadados de rede/hardware (ip, ua, os, bundleIdentifier, app_version_name).
 *  - resolveCurrency (ISO 4217) e resolveSharingFilter ("all" | array de redes).
 *  - Salvaguarda de 1024 bytes: poda seletiva preservando af_revenue/af_currency
 *    e bloqueio preventivo via gtmOnFailure() quando o limite persiste.
 *  - Conformidade 100% de todos os payloads compilados com o schema oficial.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const TEMPLATE_PATH = fs.existsSync(path.resolve(__dirname, '../../template.tpl'))
  ? path.resolve(__dirname, '../../template.tpl')
  : path.resolve(__dirname, '../../Modelo sem título.tpl');
const SCHEMA_PATH = path.resolve(__dirname, '../../schemas/appsflyer-s2s-v3.schema.json');
const AF_ID = '1617274484000-5786735';
const VALID_UUID = 'EA7583CD-A667-48BC-B806-42ECB2B48D12';
const MAX_PAYLOAD_BYTES = 1024;

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

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

function payloadSizeBytes(payload) {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}

function toLocalArray(value) {
  return Array.prototype.slice.call(value);
}

function assertPayloadValid(payload) {
  const valid = validate(payload);
  if (!valid) {
    const errors = validate.errors
      .map(e => (e.instancePath || '$') + ' ' + e.message)
      .join('\n');
    throw new Error('payload invalido vs schema oficial:\n' + errors);
  }
}

function assertPayloadCanonicalKeys(payload) {
  const canonical = [
    'appsflyer_id', 'customer_user_id', 'eventName', 'eventCurrency', 'eventValue',
    'eventTime', 'ip', 'ua', 'os', 'bundleIdentifier', 'app_version_name',
    'advertising_id', 'idfa', 'idfv', 'sharing_filter'
  ];
  for (const key of Object.keys(payload)) {
    assert.ok(canonical.indexOf(key) !== -1, 'chave nao canonica no payload: ' + key);
  }
}

function runTag(opts) {
  opts = opts || {};
  const calls = { success: 0, failure: 0, logs: [] };

  const data = {
    s2sToken: 'mp_test_s2s_token',
    appId: 'com.empresa.aplicacao',
    platform: 'android',
    eventName: 'af_purchase',
    validateAtt: true,
    enableLogging: false,
    appsflyerId: AF_ID,
    gtmOnSuccess: function () { calls.success += 1; },
    gtmOnFailure: function () { calls.failure += 1; }
  };
  Object.assign(data, opts.data || {});

  const headers = opts.headers || {};
  const mocks = {
    getAllEventData: function () {
      const ed = Object.assign({}, opts.eventData || {});
      if (opts.ip && !ed.ip_override && !ed.client_ip_address) {
        ed.ip_override = opts.ip;
      }
      return ed;
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
    makeNumber: function (value) {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const n = Number(value);
      return isNaN(n) ? null : n;
    },
    makeTableMap: function (table, keyColumn, valueColumn) {
      const map = {};
      if (Array.isArray(table)) {
        for (const row of table) {
          if (row && row[keyColumn] !== undefined && row[keyColumn] !== null && String(row[keyColumn]) !== '') {
            map[String(row[keyColumn])] = row[valueColumn];
          }
        }
      }
      return map;
    },
    JSON: JSON,
    getRemoteAddress: function () {
      return opts.ip;
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
    payload: sandbox.context ? sandbox.context.payload : undefined,
    payloadBytes: sandbox.context ? sandbox.context.payloadBytes : undefined
  };
}

// ===== utf8ByteLength =====

test('utf8ByteLength conta bytes UTF-8 corretamente', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.utf8ByteLength(''), 0);
  assert.strictEqual(s.utf8ByteLength('hello'), 5);
  assert.strictEqual(s.utf8ByteLength('caf\u00e9'), 5);
  assert.strictEqual(s.utf8ByteLength('\u20ac'), 3);
  assert.strictEqual(s.utf8ByteLength('\ud83d\udca9'), 4);
});

test('utf8ByteLength concorda com Buffer.byteLength em amostras', () => {
  const s = runTag().sandbox;
  const samples = ['hello', 'caf\u00e9', 'EUR BRL', '\ud83d\udca9', '\u043a\u0430\u0437\u0435\u043d\u043d\u044b\u0439 \u0442\u0435\u043a\u0441\u0442'];
  for (const sample of samples) {
    assert.strictEqual(s.utf8ByteLength(sample), Buffer.byteLength(sample, 'utf8'), 'amostra: ' + sample);
  }
});

// ===== buildEventValue =====

test('buildEventValue serializa receita float e moeda ISO 4217', () => {
  const s = runTag().sandbox;
  const ev = s.buildEventValue('129.9', 'BRL', null);
  assert.strictEqual(typeof ev, 'string');
  assert.deepStrictEqual(JSON.parse(ev), { af_revenue: 129.9, af_currency: 'BRL' });
});

test('buildEventValue mescla customParams preservando campos monetarios', () => {
  const s = runTag().sandbox;
  const ev = s.buildEventValue('29.99', 'EUR', { coupon: 'PROMO10', af_content_id: 'sub_premium' });
  const parsed = JSON.parse(ev);
  assert.strictEqual(parsed.af_revenue, 29.99);
  assert.strictEqual(parsed.af_currency, 'EUR');
  assert.strictEqual(parsed.coupon, 'PROMO10');
  assert.strictEqual(parsed.af_content_id, 'sub_premium');
});

test('buildEventValue retorna string vazia sem receita nem params', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.buildEventValue(null, null, null), '');
  assert.strictEqual(s.buildEventValue(undefined, undefined, undefined), '');
  assert.strictEqual(s.buildEventValue('', 'BRL', {}), '');
});

test('buildEventValue ignora receita nao numerica', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.buildEventValue('abc', 'BRL', null), '');
  assert.strictEqual(s.buildEventValue('R$10', 'BRL', null), '');
});

test('buildEventValue so inclui af_currency quando af_revenue presente', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.buildEventValue(null, 'BRL', null), '');
});

// ===== resolveCurrency =====

test('resolveCurrency valida ISO 4217 (3 letras, normalizado para maiusculas)', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolveCurrency('BRL'), 'BRL');
  assert.strictEqual(s.resolveCurrency('eur'), 'EUR');
  assert.strictEqual(s.resolveCurrency('BR'), null);
  assert.strictEqual(s.resolveCurrency('BRXX'), null);
  assert.strictEqual(s.resolveCurrency('12X'), null);
  assert.strictEqual(s.resolveCurrency(''), null);
  assert.strictEqual(s.resolveCurrency(null), null);
  assert.strictEqual(s.resolveCurrency(undefined), null);
});

// ===== resolveSharingFilter =====

test('resolveSharingFilter normaliza "all" e listas de redes', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolveSharingFilter('all'), 'all');
  assert.strictEqual(s.resolveSharingFilter(' ALL '), 'all');
  assert.deepStrictEqual(toLocalArray(s.resolveSharingFilter('facebook, google_ads')), ['facebook', 'google_ads']);
});

test('resolveSharingFilter remove itens vazios da lista', () => {
  const s = runTag().sandbox;
  assert.deepStrictEqual(toLocalArray(s.resolveSharingFilter('facebook,,google_ads,')), ['facebook', 'google_ads']);
});

test('resolveSharingFilter retorna null para vazio', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.resolveSharingFilter(''), null);
  assert.strictEqual(s.resolveSharingFilter('  '), null);
  assert.strictEqual(s.resolveSharingFilter(null), null);
  assert.strictEqual(s.resolveSharingFilter(undefined), null);
});

// ===== isEventTimeUtc =====

test('isEventTimeUtc reconhece o formato UTC estrito', () => {
  const s = runTag().sandbox;
  assert.strictEqual(s.isEventTimeUtc('2026-09-12 20:30:00.000'), true);
  assert.strictEqual(s.isEventTimeUtc('2026-09-12T20:30:00.000Z'), false);
  assert.strictEqual(s.isEventTimeUtc('2026-09-12 20:30:00'), false);
  assert.strictEqual(s.isEventTimeUtc(''), false);
});

// ===== Fluxo principal: compilação do payload =====

test('payload compilado com receita, moeda, metadata de rede/hardware e customParams', () => {
  const out = runTag({
    data: {
      revenue: '129.9',
      currency: 'BRL',
      customParameters: [
        { name: 'coupon', value: 'PROMO10' },
        { name: 'af_content_id', value: 'sub_premium' }
      ]
    },
    eventData: {
      user_id: 'usr_998412',
      os_version: '17.4',
      bundle_identifier: 'com.empresa.app',
      app_version_name: '2.4.1'
    },
    ip: '200.180.10.15',
    headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15' }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
  const p = out.context.payload;
  assert.ok(p, 'payload deve estar disponivel no contexto');
  assert.strictEqual(typeof p.eventValue, 'string');
  assert.strictEqual(p.appsflyer_id, AF_ID);
  assert.strictEqual(p.eventName, 'af_purchase');
  assert.strictEqual(p.eventCurrency, 'BRL');
  assert.strictEqual(p.customer_user_id, 'usr_998412');
  assert.strictEqual(p.ip, '200.180.10.15');
  assert.strictEqual(p.ua, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15');
  assert.strictEqual(p.os, '17.4');
  assert.strictEqual(p.bundleIdentifier, 'com.empresa.app');
  assert.strictEqual(p.app_version_name, '2.4.1');
  const ev = JSON.parse(p.eventValue);
  assert.strictEqual(ev.af_revenue, 129.9);
  assert.strictEqual(ev.af_currency, 'BRL');
  assert.strictEqual(ev.coupon, 'PROMO10');
  assert.strictEqual(ev.af_content_id, 'sub_premium');
  assertPayloadCanonicalKeys(p);
  assertPayloadValid(p);
});

test('eventValue e string vazia quando nao ha receita nem custom parameters', () => {
  const out = runTag({ data: { appsflyerId: AF_ID } });
  assert.strictEqual(out.calls.success, 1);
  const p = out.context.payload;
  assert.strictEqual(p.eventValue, '');
  assert.strictEqual(p.eventCurrency, undefined);
  assert.ok(p.appsflyer_id, 'appsflyer_id deve estar presente');
  assert.ok(p.eventName, 'eventName deve estar presente');
  assertPayloadValid(p);
});

test('moeda em minusculas e normalizada para ISO 4217 maiuscula', () => {
  const out = runTag({ data: { revenue: '10.5', currency: 'brl' } });
  assert.strictEqual(out.context.payload.eventCurrency, 'BRL');
  assert.strictEqual(JSON.parse(out.context.payload.eventValue).af_currency, 'BRL');
  assertPayloadValid(out.context.payload);
});

test('moeda invalida nao inclui eventCurrency nem af_currency', () => {
  const out = runTag({ data: { revenue: '10.5', currency: 'US' } });
  const p = out.context.payload;
  assert.strictEqual(p.eventCurrency, undefined);
  const ev = JSON.parse(p.eventValue);
  assert.strictEqual(ev.af_revenue, 10.5);
  assert.strictEqual(ev.af_currency, undefined);
  assertPayloadValid(p);
});

test('metadados de hardware sao injetados a partir do Event Data', () => {
  const out = runTag({
    eventData: {
      os_version: '14.0',
      bundle_identifier: 'com.empresa.aplicacao',
      app_version_name: '1.2.0'
    }
  });
  const p = out.context.payload;
  assert.strictEqual(p.os, '14.0');
  assert.strictEqual(p.bundleIdentifier, 'com.empresa.aplicacao');
  assert.strictEqual(p.app_version_name, '1.2.0');
  assertPayloadValid(p);
});

test('bundleIdentifier nao reverse-domain e omitido', () => {
  const out = runTag({
    data: { platform: 'ios', appId: '123456789' },
    eventData: { bundle_identifier: 'id123456789' }
  });
  const p = out.context.payload;
  assert.strictEqual(p.bundleIdentifier, undefined);
  assertPayloadValid(p);
});

test('sharing_filter "all" mapeado para a constante da API', () => {
  const out = runTag({ data: { sharingFilter: 'all' } });
  assert.strictEqual(out.context.payload.sharing_filter, 'all');
  assertPayloadValid(out.context.payload);
});

test('sharing_filter de lista de redes vira array', () => {
  const out = runTag({ data: { sharingFilter: 'facebook, google_ads' } });
  assert.deepStrictEqual(toLocalArray(out.context.payload.sharing_filter), ['facebook', 'google_ads']);
  assertPayloadValid(out.context.payload);
});

test('sharing_filter ausente nao inclui o campo', () => {
  const out = runTag({ data: { appsflyerId: AF_ID } });
  assert.strictEqual(out.context.payload.sharing_filter, undefined);
  assertPayloadValid(out.context.payload);
});

test('eventTime valido e preservado no formato UTC estrito', () => {
  const out = runTag({ data: { eventTime: '2026-09-12 20:30:00.000' } });
  assert.strictEqual(out.context.payload.eventTime, '2026-09-12 20:30:00.000');
  assertPayloadValid(out.context.payload);
});

test('eventTime fora do padrao estrito e descartado', () => {
  const out = runTag({ data: { eventTime: '2026-09-12T20:30:00.000Z' } });
  assert.strictEqual(out.context.payload.eventTime, undefined);
  assertPayloadValid(out.context.payload);
});

test('idfa propagado com consentimento e validateAtt desabilitado', () => {
  const out = runTag({
    data: { idfa: VALID_UUID, validateAtt: false, platform: 'ios', appId: '123456789' }
  });
  assert.strictEqual(out.context.payload.idfa, VALID_UUID);
  assertPayloadValid(out.context.payload);
});

test('idfa suprimido sem consentimento ATT', () => {
  const out = runTag({ data: { idfa: VALID_UUID } });
  assert.strictEqual(out.context.payload.idfa, undefined);
  assertPayloadValid(out.context.payload);
});

test('advertising_id (GAID) incluido quando presente', () => {
  const out = runTag({ eventData: { advertising_id: VALID_UUID } });
  assert.strictEqual(out.context.payload.advertising_id, VALID_UUID);
  assertPayloadValid(out.context.payload);
});

// ===== Salvaguarda de 1 KB =====

test('salvaguarda de 1KB: aborta com gtmOnFailure quando a poda e insuficiente', () => {
  const bigUa = 'Mozilla/' + new Array(2100).join('x');
  const out = runTag({
    data: {
      revenue: '12.3',
      currency: 'USD',
      customParameters: [{ name: 'p1', value: 'v1' }]
    },
    headers: { 'user-agent': bigUa }
  });
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.strictEqual(out.context.payload, undefined);
  assert.ok(hasLog(out.calls, '1024'), 'deve registrar aviso preventivo de 1024 bytes');
});

test('poda seletiva reduz eventValue preservando af_revenue/af_currency', () => {
  const manyParams = [];
  for (let i = 0; i < 150; i++) {
    manyParams.push({ name: 'param_' + i, value: 'value_' + new Array(13).join('x') });
  }
  const out = runTag({
    data: { revenue: '12.3', currency: 'USD', customParameters: manyParams }
  });
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
  const p = out.context.payload;
  assert.ok(payloadSizeBytes(p) <= MAX_PAYLOAD_BYTES, 'payload final deve caber em 1KB');
  const ev = JSON.parse(p.eventValue);
  assert.strictEqual(ev.af_revenue, 12.3);
  assert.strictEqual(ev.af_currency, 'USD');
  assert.strictEqual(p.eventValue.indexOf('param_0'), -1, 'parametro superfluo deve ser podado');
  assertPayloadCanonicalKeys(p);
  assertPayloadValid(p);
});

test('todos os payloads compilados validam 100% contra o schema oficial', () => {
  const scenarios = [
    runTag({ data: { appsflyerId: AF_ID } }),
    runTag({ data: { revenue: '129.9', currency: 'BRL', customParameters: [{ name: 'coupon', value: 'PROMO10' }] } }),
    runTag({ data: { sharingFilter: 'all' } }),
    runTag({ data: { sharingFilter: 'facebook,google_ads' } }),
    runTag({ data: { eventTime: '2026-09-12 20:30:00.000' } }),
    runTag({ data: { idfa: VALID_UUID, validateAtt: false, platform: 'ios', appId: '123456789' } }),
    runTag({
      data: { customerUserId: 'usr_77' },
      eventData: { os_version: '17.4', bundle_identifier: 'com.empresa.app', app_version_name: '2.4.1' },
      ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)' }
    })
  ];
  for (const out of scenarios) {
    assert.strictEqual(out.calls.success, 1, 'cenario deve concluir com sucesso');
    const p = out.context.payload;
    assertPayloadCanonicalKeys(p);
    assertPayloadValid(p);
  }
});

console.log('\nTotal: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);