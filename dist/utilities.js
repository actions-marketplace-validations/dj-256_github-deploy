"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.copy = void 0;
var path = require("path");
var scp = require("node-scp");
var fs = require("fs");
var glob = require("glob");
var core = __importStar(require("@actions/core"));
var client;
var errorCount = 0;
var errorFiles = [];
var excludedPaths;
var localBase;
var PathType;
(function (PathType) {
    PathType[PathType["file"] = 0] = "file";
    PathType[PathType["directory"] = 1] = "directory";
})(PathType || (PathType = {}));
var Element = /** @class */ (function () {
    function Element(type, path) {
        this.type = type;
        this.path = path;
    }
    return Element;
}());
var relativeLocal = function (filePath) {
    return filePath.substr(localBase.length - 1, filePath.length - 1);
};
function upload(element, remote) {
    return __awaiter(this, void 0, void 0, function () {
        var localPath, remotePath, e_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localPath = element.path;
                    remotePath = path.join(remote, relativeLocal(localPath));
                    if (!(element.type === PathType.file)) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.uploadFile(localPath, remotePath)];
                case 2:
                    _a.sent();
                    console.log("copied file " + localPath + " to " + remotePath + " \uD83D\uDFE2");
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.log("couldn't copy file " + localPath + " to " + remotePath + " \uD83D\uDD34");
                    console.log(e_1);
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 8];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, client.mkdir(remotePath)];
                case 6:
                    _a.sent();
                    console.log("created directory " + remotePath + " \uD83D\uDFE2");
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    console.log("couldn't create directory " + remotePath + " \uD83D\uDD34");
                    console.log(e_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function getElements(local, exclude, dotFiles) {
    var elements = [];
    var excludeGlob = exclude;
    // if (fs.statSync(local).isDirectory()) local+='/*'
    if (exclude !== '') {
        exclude = path.join(local, exclude);
        if (!exclude.match(/\*/)) {
            if (fs.statSync(exclude).isDirectory())
                excludeGlob = path.join(exclude, '/**/*');
        }
        exclude = exclude.replace(/\*\.(\w*)$/, "**/*.$1");
    }
    if (fs.statSync(local).isDirectory())
        local = path.join(local, '**/*');
    var excludeList = glob.sync(excludeGlob);
    excludeList.push(exclude);
    var files = glob.sync(local, { ignore: excludeList, dot: dotFiles });
    // files.map(file => path.basename(file))
    files.forEach(function (localPath) {
        // console.log(file)
        if (fs.statSync(localPath).isFile()) {
            elements.push({ type: PathType.file, path: localPath });
        }
        else {
            elements.push({ type: PathType.directory, path: localPath });
        }
    });
    return elements;
}
function copy(host, port, username, password, local, remote, exclude, dotfiles) {
    return __awaiter(this, void 0, void 0, function () {
        var e_3, elements, _i, elements_1, elt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, scp({
                            host: host,
                            port: port,
                            username: username,
                            password: password,
                            // privateKey: privateKey,
                            // passphrase: passphrase
                        })];
                case 1:
                    // @ts-ignore
                    client = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    console.log("Couldn't connect to server \u274C\nPlease check your action parameters");
                    console.log(e_3);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3:
                    local = path.normalize(local);
                    localBase = local;
                    remote = path.normalize(remote);
                    elements = getElements(local, exclude, dotfiles);
                    _i = 0, elements_1 = elements;
                    _a.label = 4;
                case 4:
                    if (!(_i < elements_1.length)) return [3 /*break*/, 7];
                    elt = elements_1[_i];
                    return [4 /*yield*/, upload(elt, remote)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, client.close()];
                case 8: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.copy = copy;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var host, username, port, password, local, dotfiles, remote, exclude;
        return __generator(this, function (_a) {
            host = core.getInput('host');
            username = core.getInput('username');
            port = +core.getInput('port') || 22;
            password = core.getInput('password');
            local = core.getInput('local');
            dotfiles = !!core.getInput('dotfiles') || true;
            remote = core.getInput('remote');
            exclude = core.getInput('exclude') || '';
            copy(host, port, username, password, local, remote, exclude, dotfiles).then(process.exit(0))
                .catch(function (e) {
                console.log('erreur');
                console.log(e);
            });
            return [2 /*return*/];
        });
    });
}
exports.run = run;
module.exports = { copy: copy, run: run };
