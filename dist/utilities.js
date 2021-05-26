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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.copy = void 0;
const path = require("path");
const scp = require("node-scp");
const fs = require("fs");
const glob = require("glob");
const core = __importStar(require("@actions/core"));
const ini = require("ini");
let client;
let localBase;
var PathType;
(function (PathType) {
    PathType[PathType["file"] = 0] = "file";
    PathType[PathType["directory"] = 1] = "directory";
})(PathType || (PathType = {}));
class Element {
    constructor(type, path) {
        this.type = type;
        this.path = path;
    }
}
const relativeLocal = (filePath) => {
    return filePath.substring(localBase.length);
};
async function upload(element, remote) {
    let localPath = element.path;
    let remotePath = path.join(remote, relativeLocal(localPath));
    if (element.type === PathType.file) {
        try {
            await client.uploadFile(localPath, remotePath);
            console.log(`copied file ${localPath} to ${remotePath} 🟢`);
        }
        catch (e) {
            console.log(`couldn't copy file ${localPath} to ${remotePath} 🔴`);
            console.log(e);
        }
    }
    else {
        try {
            await client.mkdir(remotePath);
            console.log(`created directory ${remotePath} 🟢`);
        }
        catch (e) {
            console.log(`couldn't create directory ${remotePath} 🔴`);
            console.log(e);
        }
    }
}
function getElements(local, exclude, dotFiles) {
    let elements = [];
    let excludeGlob = exclude;
    let files = [];
    if (fs.statSync(local).isDirectory())
        local = path.join(local, '**/*');
    if (exclude !== '') {
        exclude = path.join(local, exclude);
        if (!exclude.match(/\*/) && fs.statSync(exclude).isDirectory()) {
            excludeGlob = path.join(exclude, '/**/*');
        }
        exclude = exclude.replace(/\*\.(\w*)$/, "**/*.$1");
        let excludeList = glob.sync(excludeGlob);
        excludeList.push(exclude);
        files = glob.sync(local, { ignore: excludeList, dot: dotFiles });
    }
    else {
        files = glob.sync(local, { dot: dotFiles });
    }
    files.forEach(localPath => {
        if (fs.statSync(localPath).isFile()) {
            elements.push({ type: PathType.file, path: localPath });
        }
        else {
            elements.push({ type: PathType.directory, path: localPath });
        }
    });
    return elements;
}
async function copy({ host, port, username, password, local, remote, exclude, dotFiles = true }) {
    try {
        // @ts-ignore
        client = await scp({
            host: host,
            port: port,
            username: username,
            password: password,
        });
    }
    catch (e) {
        console.log(`Couldn't connect to server ❌\nPlease check your action parameters`);
        console.log(e);
        process.exit(1);
    }
    local = path.normalize(local);
    localBase = local;
    remote = path.normalize(remote);
    let elements = getElements(local, exclude, dotFiles);
    for (const elt of elements) {
        await upload(elt, remote);
    }
    return await client.close();
}
exports.copy = copy;
async function run() {
    if (process.env.NODE_ENV === 'test') {
        let config = ini.parse(fs.readFileSync('configuration.ini', 'utf-8'));
        let options = config.options;
        console.log(options);
        await copy(options);
    }
    else {
        await copy({
            host: core.getInput('host'),
            username: core.getInput('username'),
            password: core.getInput('password'),
            port: +core.getInput('port') || 22,
            local: core.getInput('local'),
            dotFiles: !!core.getInput('dotfiles') || true,
            remote: core.getInput('remote'),
            exclude: core.getInput('exclude') || '',
        });
    }
}
exports.run = run;
