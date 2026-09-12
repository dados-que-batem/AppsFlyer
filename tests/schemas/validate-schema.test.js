'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schemas', 'appsflyer-s2s-v3.schema.json');
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

function payloadSizeBytes(payload) {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}

function validatePayload(payload) {
  const errors = [];
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    const size = payloadSizeBytes(payload);
    if (size > MAX_PAYLOAD_BYTES) {
      errors.push('payload excede o limite de ' + MAX_PAYLOAD_BYTES + ' bytes (' + size + ' bytes)');
    }
  }
  if (!validate(payload)) {
    for (const err of validate.errors) {
      errors.push((err.instancePath || '$') + ' ' + err.message);
    }
  }
  return errors;
}

function assertValid(name, payload) {
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    throw new Error('esperado VALIDO, mas falhou:\n' + errors.join('\n'));
  }
}

function assertInvalid(name, payload, expectMessage) {
  const errors = validatePayload(payload);
  if (errors.length === 0) {
    throw new Error('esperado INVALIDO, mas foi aceito');
  }
  if (expectMessage) {
    const joined = errors.join('\n');
    if (!joined.toLowerCase().includes(expectMessage.toLowerCase())) {
      throw new Error('erro "' + expectMessage + '" nao encontrado. Erros:\n' + joined);
    }
  }
}

const AF_ID = '1617274484000-5786735';

console.log('== PAYLOADS VALIDOS ==\n');

test('minimo obrigatorio (eventValue vazio)', () => {
  assertValid('minimo', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: ''
  });
});

test('completo com receita (eventValue stringified JSON + eventCurrency)', () => {
  assertValid('completo', {
    appsflyer_id: AF_ID,
    customer_user_id: 'usr_998412',
    eventName: 'af_purchase',
    eventCurrency: 'EUR',
    eventValue: JSON.stringify({
      af_revenue: 29.99,
      af_currency: 'EUR',
      af_content_id: 'sub_premium'
    }),
    eventTime: '2026-03-30 14:15:30.000',
    ip: '193.136.0.25',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
    os: '17.4',
    bundleIdentifier: 'com.empresa.aplicacao',
    app_version_name: '2.4.1',
    advertising_id: '38400000-8cf0-11bd-b23e-10b96e40000d',
    idfa: 'EA7583CD-A667-48BC-B806-42ECB2B48D12',
    idfv: 'E621E1F8-C36C-495A-93FC-0C247A3E6E5F',
    sharing_filter: 'all'
  });
});

test('payload iOS (idfa, idfv, os)', () => {
  assertValid('ios', {
    appsflyer_id: AF_ID,
    eventName: 'af_subscribe',
    eventValue: '',
    eventTime: '2026-09-12 10:00:00.000',
    os: '18.0',
    bundleIdentifier: 'com.empresa.ios',
    idfa: 'EA7583CD-A667-48BC-B806-42ECB2B48D12',
    idfv: 'E621E1F8-C36C-495A-93FC-0C247A3E6E5F'
  });
});

test('payload Android (advertising_id/GAID)', () => {
  assertValid('android', {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventCurrency: 'BRL',
    eventValue: JSON.stringify({ af_revenue: 59.9 }),
    eventTime: '2026-09-12 12:30:00.000',
    ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    ua: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
    os: '14.0',
    bundleIdentifier: 'com.empresa.aplicacao',
    app_version_name: '2.4.1',
    advertising_id: '38400000-8cf0-11bd-b23e-10b96e40000d'
  });
});

test('sharing_filter como array de redes', () => {
  assertValid('sharing-filter-array', {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventValue: JSON.stringify({ af_revenue: 9.99 }),
    sharing_filter: ['google_ads', 'facebook', 'meta_audience']
  });
});

test('tempo dentro do limite de 1024 bytes', () => {
  assertValid('size', {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventValue: JSON.stringify({ af_revenue: 29.99, af_currency: 'EUR' })
  });
  const payload = {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventCurrency: 'EUR',
    eventValue: JSON.stringify({ af_revenue: 29.99 })
  };
  const size = payloadSizeBytes(payload);
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error('payload total quebrou o limite do teste: ' + size);
  }
});

console.log('\n== PAYLOADS INVALIDOS ==\n');

test('ausencia de appsflyer_id', () => {
  assertInvalid('sem-appsflyer-id', {
    eventName: 'af_login',
    eventValue: ''
  }, 'appsflyer_id');
});

test('appsflyer_id mal formatado', () => {
  assertInvalid('appsflyer-id-bad', {
    appsflyer_id: '5786735',
    eventName: 'af_login',
    eventValue: ''
  }, 'pattern');
});

test('eventValue como objeto JSON (nao stringificado)', () => {
  assertInvalid('eventvalue-objeto', {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventValue: { af_revenue: 29.99 }
  }, 'must be string');
});

test('eventName vazio', () => {
  assertInvalid('eventname-vazio', {
    appsflyer_id: AF_ID,
    eventName: '',
    eventValue: ''
  }, 'must NOT have fewer than 1 characters');
});

test('eventTime fora do padrao UTC estrito (ISO 8601)', () => {
  assertInvalid('eventtime-iso', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    eventTime: '2026-03-30T14:15:30.000Z'
  }, 'pattern');
});

test('eventTime com segundos sem milissegundos', () => {
  assertInvalid('eventtime-sem-ms', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    eventTime: '2026-03-30 14:15:30'
  }, 'pattern');
});

test('eventCurrency fora do padrao ISO 4217', () => {
  assertInvalid('moeda-iso', {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventCurrency: 'eur',
    eventValue: ''
  }, 'pattern');
});

test('payload como array (batching proibido)', () => {
  assertInvalid('batching', [
    { appsflyer_id: AF_ID, eventName: 'af_login', eventValue: '' }
  ], 'must be object');
});

test('propriedade desconhecida', () => {
  assertInvalid('propriedade-extra', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    campo_inesperado: true
  }, 'must NOT have additional properties');
});

test('ip invalido', () => {
  assertInvalid('ip-invalido', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    ip: '999.1.1.1'
  }, 'must match format "ipv4"');
});

test('idfa invalido (nao UUID)', () => {
  assertInvalid('idfa-invalido', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    idfa: 'EA7583CD'
  }, 'format');
});

test('bundleIdentifier fora do formato reverse-domain', () => {
  assertInvalid('bundle-invalido', {
    appsflyer_id: AF_ID,
    eventName: 'af_login',
    eventValue: '',
    bundleIdentifier: 'empresa'
  }, 'pattern');
});

test('payload superior a 1024 bytes (1 KB)', () => {
  const bigEventValue = JSON.stringify(
    Array.from({ length: 200 }, (_, i) => ({ ['parametro_' + i]: 'string_' + 'x'.repeat(12) }))
      .reduce((acc, cur) => Object.assign(acc, cur), { af_revenue: 29.99 })
  );
  const bigPayload = {
    appsflyer_id: AF_ID,
    eventName: 'af_purchase',
    eventCurrency: 'USD',
    eventValue: bigEventValue
  };
  if (payloadSizeBytes(bigPayload) <= MAX_PAYLOAD_BYTES) {
    throw new Error('payload de teste deveria exceder 1024 bytes');
  }
  assertInvalid('tamanho-1kb', bigPayload, 'excede o limite');
});

console.log('\n=====================');
console.log('Testes: ' + (passed + failed) + ' | PASS: ' + passed + ' | FAIL: ' + failed);
console.log('=====================');

if (failed > 0) {
  process.exitCode = 1;
}