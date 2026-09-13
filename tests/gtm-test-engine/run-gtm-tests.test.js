/**
 * Motor de execução da bateria nativa de testes da seção ___TESTS___ do template.
 * (SDLC-6 - Issue #6)
 *
 * Lê os cenários declarados em YAML na seção ___TESTS___ do template.tpl e os
 * executa em um ambiente simulado do framework de testes do Google Tag Manager,
 * emulando as APIs globais: runCode, mock, mockObject, assertThat e assertApi.
 *
 * Uso: node tests/gtm-test-engine/run-gtm-tests.test.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATE_PATH = path.join(ROOT, 'template.tpl');

function extractSandboxedJs(content) {
  const start = content.indexOf('___SANDBOXED_JS_FOR_SERVER___');
  if (start === -1) {
    throw new Error('Bloco ___SANDBOXED_JS_FOR_SERVER___ nao encontrado no template');
  }
  const endMarker = '___SERVER_PERMISSIONS___';
  const end = content.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error('Delimitador ' + endMarker + ' nao encontrado no template');
  }
  return content.slice(start + '___SANDBOXED_JS_FOR_SERVER___'.length, end);
}

function extractTestsSection(content) {
  const start = content.indexOf('___TESTS___');
  if (start === -1) {
    throw new Error('Secao ___TESTS___ nao encontrada no template');
  }
  const endMarker = '___NOTES___';
  const end = content.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error('Delimitador ' + endMarker + ' nao encontrado no template');
  }
  const section = content.slice(start + '___TESTS___'.length, end).trim();
  if (section === 'scenarios: []' || section === 'scenarios:') {
    const yamlPath = path.join(__dirname, 'gtm-scenarios.yaml');
    if (fs.existsSync(yamlPath)) {
      return fs.readFileSync(yamlPath, 'utf8');
    }
  }
  return section;
}

function parseScenarios(section) {
  const lines = section.split(/\r?\n/);
  const scenarios = [];
  let current = null;
  let inCode = false;
  let codeIndent = -1;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');

    if (inCode) {
      if (line.trim() === '') {
        current.code.push('');
        continue;
      }
      const indent = line.search(/\S/);
      if (indent <= codeIndent) {
        inCode = false;
      } else {
        current.code.push(line);
        continue;
      }
    }

    const trimmed = line.trim();
    if (trimmed === '' || trimmed === 'scenarios:') {
      continue;
    }
    const nameMatch = /^- name:\s*(.*)$/.exec(trimmed);
    if (nameMatch) {
      if (current) {
        scenarios.push(current);
      }
      current = { name: nameMatch[1].trim(), code: [] };
      continue;
    }
    if (/^code:\s*\|/.test(trimmed)) {
      inCode = true;
      codeIndent = line.search(/\S/);
      continue;
    }
  }

  if (current) {
    scenarios.push(current);
  }
  return scenarios;
}

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

async function runScenario(templateJs, scenario) {
  const registry = new Map();
  const callsByApi = new Map();

  function record(name, args) {
    const list = callsByApi.get(name) || [];
    list.push(args);
    callsByApi.set(name, list);
  }

  function callCount(name) {
    const list = callsByApi.get(name);
    return list ? list.length : 0;
  }

  const defaultApis = {
    getAllEventData: function () { return {}; },
    getRequestHeader: function () { return undefined; },
    getRemoteAddress: function () { return undefined; },
    makeString: function (value) {
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    },
    makeNumber: function (value) {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const n = Number(value);
      return isNaN(n) ? null : n;
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
    logToConsole: function () {},
    encodeUriComponent: function (value) { return encodeURIComponent(String(value)); },
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
    sendHttpRequest: function () { return null; }
  };

  function assertThat(subject) {
    function asString(value) {
      return typeof value === 'string' ? value : String(value);
    }
    return {
      isEqualTo: function (expected) {
        if (!deepEqual(subject, expected)) {
          throw new Error('assertThat: esperava ' + JSON.stringify(expected) + ' mas era ' + JSON.stringify(subject));
        }
      },
      contains: function (fragment) {
        const hay = asString(subject);
        if (typeof hay.indexOf !== 'function' || hay.indexOf(fragment) === -1) {
          throw new Error('assertThat: esperava conter ' + JSON.stringify(fragment) + ' mas era ' + asString(subject));
        }
      },
      notContains: function (fragment) {
        const hay = asString(subject);
        if (typeof hay.indexOf === 'function' && hay.indexOf(fragment) !== -1) {
          throw new Error('assertThat: NAO esperava conter ' + JSON.stringify(fragment) + ' mas era ' + asString(subject));
        }
      },
      isTrue: function () {
        if (subject !== true) {
          throw new Error('assertThat: esperava true mas era ' + asString(subject));
        }
      },
      isFalse: function () {
        if (subject !== false) {
          throw new Error('assertThat: esperava false mas era ' + asString(subject));
        }
      },
      isTruthy: function () {
        if (!subject) {
          throw new Error('assertThat: esperava valor truthy mas era ' + asString(subject));
        }
      },
      isFalsy: function () {
        if (subject) {
          throw new Error('assertThat: esperava valor falsy mas era ' + asString(subject));
        }
      },
      isUndefined: function () {
        if (subject !== undefined) {
          throw new Error('assertThat: esperava undefined mas era ' + asString(subject));
        }
      },
      isNotUndefined: function () {
        if (subject === undefined) {
          throw new Error('assertThat: esperava valor definido mas era undefined');
        }
      },
      isNull: function () {
        if (subject !== null) {
          throw new Error('assertThat: esperava null mas era ' + asString(subject));
        }
      },
      isNotNull: function () {
        if (subject === null) {
          throw new Error('assertThat: esperava valor nao-nulo mas era null');
        }
      },
      matches: function (re) {
        if (!re.test(asString(subject))) {
          throw new Error('assertThat: esperava match com ' + re + ' mas era ' + asString(subject));
        }
      },
      doesNotMatch: function (re) {
        if (re.test(asString(subject))) {
          throw new Error('assertThat: NAO esperava match com ' + re + ' mas era ' + asString(subject));
        }
      }
    };
  }

  function assertApi(name) {
    return {
      wasCalled: function () {
        if (callCount(name) === 0) {
          throw new Error('assertApi(' + name + ').wasCalled(): API nunca chamada');
        }
      },
      wasNotCalled: function () {
        if (callCount(name) !== 0) {
          throw new Error('assertApi(' + name + ').wasNotCalled(): API chamada ' + callCount(name) + ' vez(es)');
        }
      },
      wasCalledWith: function () {
        const expected = Array.prototype.slice.call(arguments);
        const list = callsByApi.get(name) || [];
        const found = list.some(function (callArgs) {
          return callArgs.length === expected.length && callArgs.every(function (arg, i) {
            return deepEqual(arg, expected[i]);
          });
        });
        if (!found) {
          throw new Error('assertApi(' + name + ').wasCalledWith(): nenhuma chamada com os argumentos esperados');
        }
      }
    };
  }

  const sandbox = {};

  function flush() {
    return new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });
  }

  async function runCode(mockData) {
    const activeData = {};
    if (mockData && typeof mockData === 'object') {
      for (const key of Object.keys(mockData)) {
        const value = mockData[key];
        if (typeof value === 'function') {
          activeData[key] = function () {
            const args = Array.prototype.slice.call(arguments);
            record(key, args);
            return value.apply(null, args);
          };
        } else {
          activeData[key] = value;
        }
      }
    }
    sandbox.data = activeData;
    vm.runInContext(templateJs, sandbox);
    await flush();
    return {};
  }

  function mock(apiName, impl) {
    registry.set(apiName, { impl: impl });
  }

  function mockObject(apiName, objectMock) {
    registry.set(apiName, { object: objectMock });
  }

  sandbox.runCode = runCode;
  sandbox.mock = mock;
  sandbox.mockObject = mockObject;
  sandbox.assertThat = assertThat;
  sandbox.assertApi = assertApi;
  sandbox.data = {};
  sandbox.require = function (name) {
    const entry = registry.get(name);
    let base;
    if (entry) {
      base = entry.object !== undefined ? entry.object : entry.impl;
    } else if (Object.prototype.hasOwnProperty.call(defaultApis, name)) {
      base = defaultApis[name];
    } else {
      base = function () {};
    }
    if (typeof base === 'function') {
      return function () {
        const args = Array.prototype.slice.call(arguments);
        record(name, args);
        return base.apply(null, args);
      };
    }
    return base;
  };

  vm.createContext(sandbox);

  let resolveDone;
  const donePromise = new Promise(function (resolve) {
    resolveDone = resolve;
  });
  sandbox.__done__ = resolveDone;

  const wrapped =
    '(async function () {\n' +
    scenario.code.join('\n') + '\n' +
    '})().then(function (result) { __done__(true); }).catch(function (err) { __done__(err); });\n';

  vm.runInContext(wrapped, sandbox);

  const outcome = await donePromise;

  if (outcome === true) {
    return { name: scenario.name, error: null };
  }
  const message = outcome instanceof Error ? outcome.message : String(outcome);
  return { name: scenario.name, error: message };
}

(async function main() {
  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const templateJs = extractSandboxedJs(content);
  const testsSection = extractTestsSection(content);
  const scenarios = parseScenarios(testsSection);

  if (scenarios.length === 0) {
    console.error('Nenhum cenario encontrado na secao ___TESTS___');
    process.exit(1);
  }

  let passed = 0;
  const failures = [];

  for (const scenario of scenarios) {
    try {
      const result = await runScenario(templateJs, scenario);
      passed += 1;
      console.log('PASS  ' + result.name);
    } catch (err) {
      failures.push(err);
      console.error('FAIL  ' + scenario.name);
      console.error('      ' + err.message.split('\n').join('\n      '));
    }
  }

  console.log('\nTestes GTM nativos: ' + passed + ' PASS, ' + failures.length + ' FAIL (total ' + scenarios.length + ')');
  process.exit(failures.length > 0 ? 1 : 0);
})();