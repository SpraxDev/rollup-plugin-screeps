'use strict';

var screepsApi = require('screeps-api');
var fs = require('fs');
var path = require('path');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);

function generateSourceMaps(bundle) {
    // Iterate through bundle and test if type===chunk && map is defined
    let itemName;
    for (itemName in bundle) {
        let item = bundle[itemName];
        if (item.type === "chunk" && item.map) {
            // Tweak maps
            let tmp = item.map.toString;
            delete item.map.sourcesContent;
            item.map.toString = function () {
                return "module.exports = " + tmp.apply(this, arguments) + ";";
            };
        }
    }
}
function writeSourceMaps(options) {
    fs__namespace.renameSync(options.file + '.map', options.file + '.map.js');
}
function validateConfig(cfg) {
    if (cfg.hostname && cfg.hostname === 'screeps.com') {
        return [
            typeof cfg.token === "string",
            cfg.protocol === "http" || cfg.protocol === "https",
            typeof cfg.hostname === "string",
            typeof cfg.port === "number",
            typeof cfg.path === "string",
            typeof cfg.branch === "string"
        ].reduce((a, b) => a && b);
    }
    return [
        (typeof cfg.email === 'string' && typeof cfg.password === 'string') || typeof cfg.token === 'string',
        cfg.protocol === "http" || cfg.protocol === "https",
        typeof cfg.hostname === "string",
        typeof cfg.port === "number",
        typeof cfg.path === "string",
        typeof cfg.branch === "string"
    ].reduce((a, b) => a && b);
}
function loadConfigFile(configFile) {
    let data = fs__namespace.readFileSync(configFile, 'utf8');
    let cfg = JSON.parse(data);
    if (!validateConfig(cfg))
        throw new TypeError("Invalid config");
    if (cfg.email && cfg.password && !cfg.token && cfg.hostname === 'screeps.com') {
        console.log('Please change your email/password to a token');
    }
    return cfg;
}
function uploadSource(config, options, bundle) {
    if (!config) {
        console.log('screeps() needs a config e.g. screeps({configFile: \'./screeps.json\'}) or screeps({config: { ... }})');
    }
    else {
        if (typeof config === "string")
            config = loadConfigFile(config);
        let code = getFileList(options.file);
        let branch = getBranchName(config.branch);
        let api = new screepsApi.ScreepsAPI(config);
        if (!config.token) {
            api.auth().then(() => {
                runUpload(api, branch, code);
            });
        }
        else {
            runUpload(api, branch, code);
        }
    }
}
function runUpload(api, branch, code) {
    api.raw.user.branches().then((data) => {
        let branches = data.list.map((b) => b.branch);
        if (branches.includes(branch)) {
            api.code.set(branch, code);
        }
        else {
            api.raw.user.cloneBranch('', branch, code);
        }
    });
}
function getFileList(outputFile) {
    let code = {};
    let base = path__namespace.dirname(outputFile);
    let files = fs__namespace.readdirSync(base).filter((f) => path__namespace.extname(f) === '.js' || path__namespace.extname(f) === '.wasm');
    files.map((file) => {
        if (file.endsWith('.js')) {
            code[file.replace(/\.js$/i, '')] = fs__namespace.readFileSync(path__namespace.join(base, file), 'utf8');
        }
        else {
            code[file] = {
                binary: fs__namespace.readFileSync(path__namespace.join(base, file)).toString('base64')
            };
        }
    });
    return code;
}
function getBranchName(branch) {
    if (branch === 'auto') {
        console.warn('[WARNING] Automatically detecting the git-branch is no longer supported in this forked version');
    }
    return branch;
}
function screeps(screepsOptions = {}) {
    return {
        name: "screeps",
        generateBundle(options, bundle, isWrite) {
            if (options.sourcemap)
                generateSourceMaps(bundle);
        },
        writeBundle(options, bundle) {
            if (options.sourcemap)
                writeSourceMaps(options);
            if (!screepsOptions.dryRun) {
                uploadSource((screepsOptions.configFile || screepsOptions.config), options);
            }
        }
    };
}

module.exports = screeps;
