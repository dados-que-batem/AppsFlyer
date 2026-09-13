/**
 * Suite de testes da camada de egress de rede do Core Engine (SDLC-5 - Issue #5).
 * Extrai o bloco ___SANDBOXED_JS_FOR_SERVER___ do template e executa em um
 * sandbox Node.js (vm) com a API sendHttpRequest mockada, cobrindo:
 *  - Envio correto de URL, headers (authentication, Content-Type, Accept) e body.
 *  - Respostas de sucesso (200, 204) invocando gtmOnSuccess().
 *  - Respostas de erro (400, 401, 403, 5xx) invocando gtmOnFailure() com logs.
 *  - Timeout e rejeição assíncrona da Promise (falha de conectividade).
 *  - Guarda de idempotência (callback + Promise não duplicam gtmOnSuccess).
 *  - Bloqueio prévio de parâmetros inválidos sem disparo de rede.
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
const VALID_UUID = 'EA7583CD-A667-48BC-B806-42ECB2B48D12';
const S2S_TOKEN = 'mp_test_s2s_token';
const iOS_NUMERIC_APP_ID = '123456789';
const ANDROID_PACKAGE_APP_ID = 'com.empresa.aplicacao';

let passed = 0;
let failed = 0;
const tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
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
  const calls = {
    success: 0,
    failure: 0,
    logs: [],
    requests: []
  };

  const data = {
    s2sToken: S2S_TOKEN,
    appId: iOS_NUMERIC_APP_ID,
    platform: 'ios',
    eventName: 'af_purchase',
    validateAtt: true,
    enableLogging: true,
    appsflyerId: AF_ID,
    gtmOnSuccess: function () { calls.success += 1; },
    gtmOnFailure: function () { calls.failure += 1; }
  };
  Object.assign(data, opts.data || {});

  const httpBehaviour = opts.http || { type: 'status', status: 200 };

  const mocks = {
    getAllEventData: function () {
      return opts.eventData || {};
    },
    getRequestHeader: function (name) {
      const headers = opts.headers || {};
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
    Object: Object,
    getRemoteAddress: function () {
      return opts.ip;
    },
    encodeUriComponent: function (value) {
      return encodeURIComponent(String(value));
    },
    sendHttpRequest: function (url, callback, options, postBody) {
      calls.requests.push({ url: url, callback: callback, options: options, postBody: postBody });
      const b = httpBehaviour;
      if (b.type === 'status') {
        if (opts.async) {
          setTimeout(function () { callback(b.status, b.headers || {}, b.body || ''); }, 0);
        } else {
          callback(b.status, b.headers || {}, b.body || '');
        }
        return undefined;
      }
      if (b.type === 'promise-status') {
        return Promise.resolve({ statusCode: b.status, headers: b.headers || {}, body: b.body || '' });
      }
      if (b.type === 'reject') {
        return Promise.reject(new Error('Network error'));
      }
      if (b.type === 'both') {
        if (opts.async) {
          setTimeout(function () { callback(b.status, b.headers || {}, b.body || ''); }, 0);
        } else {
          callback(b.status, b.headers || {}, b.body || '');
        }
        return Promise.resolve({ statusCode: b.status, headers: b.headers || {}, body: b.body || '' });
      }
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
    payload: sandbox.context ? sandbox.context.payload : undefined
  };
}

function settle() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 15);
  });
}

// ===== Requisição de saída: URL, headers e body =====

test('envia POST para o endpoint canonico com headers e body corretos', async () => {
  const out = runTag({
    data: { platform: 'ios', appId: iOS_NUMERIC_APP_ID, revenue: '29.99', currency: 'BRL' },
    http: { type: 'status', status: 200 }
  });
  await settle();
  assert.strictEqual(out.calls.requests.length, 1);
  const req = out.calls.requests[0];
  assert.strictEqual(req.url, 'https://api3.appsflyer.com/inappevent/id' + iOS_NUMERIC_APP_ID);
  assert.strictEqual(req.options.method, 'POST');
  assert.strictEqual(req.options.timeout, 4000);
  assert.strictEqual(req.options.headers['Content-Type'], 'application/json');
  assert.strictEqual(req.options.headers['Accept'], 'application/json');
  assert.strictEqual(req.options.headers.authentication, S2S_TOKEN);
  const body = JSON.parse(req.postBody);
  assert.strictEqual(body.appsflyer_id, AF_ID);
  assert.strictEqual(body.eventName, 'af_purchase');
  assert.strictEqual(typeof body.eventValue, 'string');
  assert.strictEqual(JSON.parse(body.eventValue).af_revenue, 29.99);
});

test('URL preserva o prefixo id para iOS e o namespace reverse-domain para Android', async () => {
  const outIos = runTag({ data: { platform: 'ios', appId: iOS_NUMERIC_APP_ID }, http: { type: 'status', status: 200 } });
  await settle();
  assert.strictEqual(outIos.calls.requests[0].url, 'https://api3.appsflyer.com/inappevent/id' + iOS_NUMERIC_APP_ID);

  const outAndroid = runTag({
    data: { platform: 'android', appId: ANDROID_PACKAGE_APP_ID },
    http: { type: 'status', status: 200 }
  });
  await settle();
  assert.strictEqual(outAndroid.calls.requests[0].url, 'https://api3.appsflyer.com/inappevent/' + ANDROID_PACKAGE_APP_ID);
});

// ===== Respostas de sucesso (2xx) =====

test('status 200 invoca gtmOnSuccess', async () => {
  const out = runTag({ http: { type: 'status', status: 200 } });
  await settle();
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
});

test('status 204 (No Content) invoca gtmOnSuccess', async () => {
  const out = runTag({ http: { type: 'status', status: 204 } });
  await settle();
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
});

test('resposta de sucesso via Promise (statusCode 200) invoca gtmOnSuccess', async () => {
  const out = runTag({ http: { type: 'promise-status', status: 200 } });
  await settle();
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
});

test('callback assincrono (200) apos tick invoca gtmOnSuccess', async () => {
  const out = runTag({ async: true, http: { type: 'status', status: 200 } });
  await settle();
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
});

// ===== Respostas de erro (4xx / 5xx) =====

test('status 400 invoca gtmOnFailure com log de autenticacao/payload', async () => {
  const out = runTag({ http: { type: 'status', status: 400 } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'payload malformado'));
});

test('status 401 invoca gtmOnFailure com log de acesso nao autorizado', async () => {
  const out = runTag({ http: { type: 'status', status: 401 } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'nao autorizado'));
});

test('status 403 invoca gtmOnFailure com log de plano S2S', async () => {
  const out = runTag({ http: { type: 'status', status: 403 } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'plano AppsFlyer'));
});

test('status 500 invoca gtmOnFailure com log de erro interno', async () => {
  const out = runTag({ http: { type: 'status', status: 500 } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'servidores do AppsFlyer'));
});

// ===== Timeout / falha de conectividade =====

test('rejeicao assincrona (timeout/network) invoca gtmOnFailure com log de timeout', async () => {
  const out = runTag({ http: { type: 'reject' } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'Timeout de rede'));
});

test('resposta sem statusCode (null) e tratada como falha de rede', async () => {
  const out = runTag({ http: { type: 'status', status: null } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.ok(hasLog(out.calls, 'statusCode ausente'));
});

// ===== Guarda de idempotencia =====

test('guarda de idempotencia: callback + Promise invocam gtmOnSuccess uma unica vez', async () => {
  const out = runTag({ http: { type: 'both', status: 200 } });
  await settle();
  assert.strictEqual(out.calls.success, 1);
  assert.strictEqual(out.calls.failure, 0);
});

test('guarda de idempotencia: callback + Promise com erro nao duplicam gtmOnFailure', async () => {
  const out = runTag({ http: { type: 'both', status: 400 } });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
});

// ===== Bloqueio previo (nenhuma requisicao de rede) =====

test('appsflyer_id invalido bloqueia o envio sem qualquer requisicao', async () => {
  const out = runTag({ data: { appsflyerId: '5786735' } });
  await settle();
  assert.strictEqual(out.calls.failure, 1);
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.requests.length, 0);
});

test('s2sToken vazio bloqueia o envio sem qualquer requisicao', async () => {
  const out = runTag({ data: { s2sToken: '' } });
  await settle();
  assert.strictEqual(out.calls.failure, 1);
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.requests.length, 0);
});

test('payload que permanece acima de 1024 bytes apos poda bloqueia sem requisicao', async () => {
  const bigUa = 'Mozilla/' + new Array(2100).join('x');
  const out = runTag({
    data: { platform: 'android', appId: ANDROID_PACKAGE_APP_ID, appsflyerId: AF_ID, revenue: '12.3', currency: 'BRL' },
    headers: { 'user-agent': bigUa },
    http: { type: 'status', status: 200 }
  });
  await settle();
  assert.strictEqual(out.calls.success, 0);
  assert.strictEqual(out.calls.failure, 1);
  assert.strictEqual(out.calls.requests.length, 0);
});

(async function main() {
  for (const t of tests) {
    try {
      await t.fn();
      passed += 1;
      console.log('PASS  ' + t.name);
    } catch (err) {
      failed += 1;
      console.error('FAIL  ' + t.name);
      console.error('      ' + err.message.split('\n').join('\n      '));
    }
  }
  console.log('\nTotal: ' + passed + ' PASS, ' + failed + ' FAIL');
  process.exit(failed > 0 ? 1 : 0);
})();