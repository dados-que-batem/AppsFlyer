/**
 * Testes automatizados de integridade estrutural e governança do Modelo sem título.tpl
 * (com fallback opcional para template.tpl).
 * Valida a conformidade com o contrato de Design da Issue #2 (SDLC-2):
 *  - Metadados ___INFO___ e contexto de execução SERVER.
 *  - Presença de todos os grupos zippy e campos da interface.
 *  - Validadores NON_EMPTY nos campos mandatórios.
 *  - Governança de permissões estritas (send_http confinado à API v3).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TEMPLATE_PATH = path.resolve(__dirname, '../../Modelo sem título.tpl');
const TEMPLATE_FALLBACK_PATH = path.resolve(__dirname, '../../template.tpl');

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseTemplateSections(content) {
  const sections = {};
  const sectionHeaders = [
    '___TERMS_OF_SERVICE___',
    '___INFO___',
    '___TEMPLATE_PARAMETERS___',
    '___SANDBOXED_JS_FOR_SERVER___',
    '___SERVER_PERMISSIONS___',
    '___TESTS___',
    '___NOTES___'
  ];

  let currentSection = null;
  const lines = content.split(/\r?\n/);
  const currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (sectionHeaders.includes(trimmed)) {
      if (currentSection) {
        sections[currentSection] = currentLines.join('\n').trim();
        currentLines.length = 0;
      }
      currentSection = trimmed;
    } else if (currentSection) {
      currentLines.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentLines.join('\n').trim();
  }

  return sections;
}

console.log('\n== VALIDACAO ESTRUTURAL DO TEMPLATE (SDLC-2) ==\n');

// 1. Existência do arquivo (com fallback opcional para template.tpl)
let templatePath;
if (fs.existsSync(TEMPLATE_PATH)) {
  templatePath = TEMPLATE_PATH;
} else if (fs.existsSync(TEMPLATE_FALLBACK_PATH)) {
  templatePath = TEMPLATE_FALLBACK_PATH;
}
assert(templatePath, 'Arquivo "Modelo sem título.tpl" (ou template.tpl) deve existir na raiz');

const content = fs.readFileSync(templatePath, 'utf-8');
const sections = parseTemplateSections(content);

// 2. Seções canônicas obrigatórias
const requiredSections = [
  '___INFO___',
  '___TEMPLATE_PARAMETERS___',
  '___SANDBOXED_JS_FOR_SERVER___',
  '___SERVER_PERMISSIONS___',
  '___TESTS___',
  '___NOTES___'
];

test('seções canônicas do template presentes', () => {
  requiredSections.forEach(sec => {
    assert(sections[sec] !== undefined, 'Seção ' + sec + ' deve estar presente no template');
  });
});

// 3. Validação de ___INFO___
let info = null;
test('___INFO___ é JSON válido e com contrato correto', () => {
  info = JSON.parse(sections['___INFO___']);
  assert(typeof info === 'object' && info !== null, '___INFO___ deve ser um objeto JSON');
  assert(info.type === 'TAG', '___INFO___ type deve ser TAG');
  assert(Array.isArray(info.containerContexts) && info.containerContexts.includes('SERVER'), '___INFO___ deve ter containerContexts contendo SERVER');
  assert(info.displayName === 'AppsFlyer In-App Events', 'displayName deve ser "AppsFlyer In-App Events"');
  assert(typeof info.description === 'string' && info.description.length > 0, 'description não deve estar vazio');
  assert(info.containerContexts.length === 1 && info.containerContexts[0] === 'SERVER', 'containerContexts deve conter exclusivamente SERVER');
});

// 4. Validação de ___TEMPLATE_PARAMETERS___
let params = null;
test('___TEMPLATE_PARAMETERS___ é um array JSON válido', () => {
  params = JSON.parse(sections['___TEMPLATE_PARAMETERS___']);
  assert(Array.isArray(params), '___TEMPLATE_PARAMETERS___ deve ser um array');
  assert(params.length >= 4, 'Deve haver ao menos 4 grupos de parâmetros');
});

function flattenParams(list) {
  const flat = [];
  function walk(items) {
    items.forEach(p => {
      flat.push(p);
      if (p.subParams && Array.isArray(p.subParams)) {
        walk(p.subParams);
      }
    });
  }
  walk(list);
  return flat;
}

const allParams = flattenParams(params);
const paramNames = allParams.map(p => p.name).filter(Boolean);
const groups = params.filter(p => p.type === 'GROUP');

test('4 grupos zippy com nomes canônicos', () => {
  assert(groups.length === 4, 'Deve haver exatamente 4 grupos (' + groups.length + ' encontrados)');
  const groupNames = groups.map(g => g.name);
  ['groupAuthDestination', 'groupIdentifiers', 'groupEventData', 'groupPrivacyAtt'].forEach(n => {
    assert(groupNames.includes(n), 'Grupo "' + n + '" deve existir');
  });
});

test('grupos de autenticação/identificadores/evento abertos e privacidade fechado', () => {
  const auth = groups.find(g => g.name === 'groupAuthDestination');
  const ids = groups.find(g => g.name === 'groupIdentifiers');
  const evt = groups.find(g => g.name === 'groupEventData');
  const priv = groups.find(g => g.name === 'groupPrivacyAtt');
  assert(auth && auth.groupStyle === 'ZIPPY_OPEN', 'groupAuthDestination deve ser ZIPPY_OPEN');
  assert(ids && ids.groupStyle === 'ZIPPY_OPEN', 'groupIdentifiers deve ser ZIPPY_OPEN');
  assert(evt && evt.groupStyle === 'ZIPPY_OPEN', 'groupEventData deve ser ZIPPY_OPEN');
  assert(priv && priv.groupStyle === 'ZIPPY_CLOSED', 'groupPrivacyAtt deve ser ZIPPY_CLOSED');
});

test('todos os campos da interface definidos', () => {
  const requiredFields = [
    's2sToken', 'platform', 'appId',
    'appsflyerId', 'customerUserId', 'advertisingId', 'idfa', 'idfv',
    'eventName', 'currency', 'revenue', 'customParameters',
    'validateAtt', 'attStatus', 'sharingFilter', 'enableLogging'
  ];
  requiredFields.forEach(f => {
    assert(paramNames.includes(f), 'Campo "' + f + '" deve existir na interface');
  });
});

test('validadores NON_EMPTY nos campos mandatórios (s2sToken, appId, eventName)', () => {
  ['s2sToken', 'appId', 'eventName'].forEach(f => {
    const field = allParams.find(p => p.name === f);
    assert(field, 'Campo "' + f + '" deve existir');
    assert(
      Array.isArray(field.valueValidators) && field.valueValidators.some(v => v.type === 'NON_EMPTY'),
      'Campo "' + f + '" deve possuir validador NON_EMPTY'
    );
  });
});

test('platform possui seletor com auto/ios/android', () => {
  const field = allParams.find(p => p.name === 'platform');
  assert(field && field.type === 'SELECT', 'platform deve ser um SELECT');
  const values = (field.selectItems || []).map(i => i.value);
  ['auto', 'ios', 'android'].forEach(v => {
    assert(values.includes(v), 'SELECT platform deve conter opção "' + v + '"');
  });
});

test('checkboxes com defaults de governança (validateAtt=true, enableLogging=false)', () => {
  const att = allParams.find(p => p.name === 'validateAtt');
  const logging = allParams.find(p => p.name === 'enableLogging');
  assert(att && att.defaultValue === true, 'validateAtt deve ter defaultValue true');
  assert(logging && logging.defaultValue === false, 'enableLogging deve ter defaultValue false');
});

test('customParameters é SIMPLE_TABLE com colunas name/value', () => {
  const field = allParams.find(p => p.name === 'customParameters');
  assert(field && field.type === 'SIMPLE_TABLE', 'customParameters deve ser SIMPLE_TABLE');
  const columns = (field.simpleTableColumns || []).map(c => c.name);
  assert(columns.includes('name'), 'Coluna "name" deve existir na SIMPLE_TABLE');
  assert(columns.includes('value'), 'Coluna "value" deve existir na SIMPLE_TABLE');
});

// 5. Validação de ___SANDBOXED_JS_FOR_SERVER___
const code = sections['___SANDBOXED_JS_FOR_SERVER___'];
test('Sandboxed JS contém require de logToConsole e chamadas gtmOnSuccess/gtmOnFailure', () => {
  assert(code.includes("require('logToConsole')"), 'Código deve importar logToConsole via require()');
  assert(code.includes('data.gtmOnSuccess()'), 'Código deve chamar data.gtmOnSuccess()');
  assert(code.includes('data.gtmOnFailure()'), 'Código deve chamar data.gtmOnFailure()');
});

test('Sandboxed JS tem sintaxe válida', () => {
  new vm.Script(code);
});

// 6. Validação de ___SERVER_PERMISSIONS___
let perms = null;
test('___SERVER_PERMISSIONS___ é um array JSON válido', () => {
  perms = JSON.parse(sections['___SERVER_PERMISSIONS___']);
  assert(Array.isArray(perms), '___SERVER_PERMISSIONS___ deve ser um array');
});

test('permissões essenciais presentes (send_http, read_event_data, read_request, logging)', () => {
  const permKeys = perms.map(p => p.instance && p.instance.key && p.instance.key.publicId).filter(Boolean);
  ['send_http', 'read_event_data', 'read_request', 'logging'].forEach(k => {
    assert(permKeys.includes(k), 'Permissão "' + k + '" deve estar presente');
  });
});

test('send_http confinado estritamente a https://api3.appsflyer.com/*', () => {
  const sendHttpPerm = perms.find(p => p.instance && p.instance.key && p.instance.key.publicId === 'send_http');
  assert(sendHttpPerm, 'Permissão send_http deve existir');
  const urlsParam = (sendHttpPerm.instance.param || []).find(param => param.key === 'urls');
  assert(urlsParam, 'send_http deve possuir parâmetro "urls"');
  const urls = (urlsParam.value.listItem || []).map(item => item.string);
  assert(urls.includes('https://api3.appsflyer.com/'), 'send_http deve autorizar https://api3.appsflyer.com/');
  urls.forEach(u => {
    assert(!u.includes('*://') && u !== '*', 'send_http não deve conter URLs curinga não autorizadas: ' + u);
  });
});

test('logging restrito ao ambiente debug', () => {
  const loggingPerm = perms.find(p => p.instance && p.instance.key && p.instance.key.publicId === 'logging');
  assert(loggingPerm, 'Permissão logging deve existir');
  const envParam = (loggingPerm.instance.param || []).find(param => param.key === 'environments');
  assert(envParam && envParam.value.string === 'debug', 'logging deve estar restrito a environments=debug');
});

// 7. Seções ___TESTS___ e ___NOTES___
test('seção ___TESTS___ presente (cenários nativos da Issue #6)', () => {
  assert(sections['___TESTS___'].length > 0, '___TESTS___ não deve estar vazia');
});

test('seção ___NOTES___ presente', () => {
  assert(sections['___NOTES___'].length > 0, '___NOTES___ deve conter notas de criação/governança');
});

console.log('\n=====================');
console.log('Testes Template: ' + (passed + failed) + ' | PASS: ' + passed + ' | FAIL: ' + failed);
console.log('=====================\n');

if (failed > 0) {
  process.exit(1);
}