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
let client;
let errorCount = 0;
let errorFiles = [];
let excludedPaths;
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
    return filePath.substr(localBase.length - 1, filePath.length - 1);
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
            // errorCount++;
            // errorFiles.push(local)
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
    let excludeList = glob.sync(excludeGlob);
    excludeList.push(exclude);
    let files = glob.sync(local, { ignore: excludeList, dot: dotFiles });
    // files.map(file => path.basename(file))
    files.forEach(localPath => {
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
async function copy(host, port, username, password, local, remote, exclude, dotfiles) {
    try {
        // @ts-ignore
        client = await scp({
            host: host,
            port: port,
            username: username,
            password: password,
            // privateKey: privateKey,
            // passphrase: passphrase
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
    let elements = getElements(local, exclude, dotfiles);
    for (const elt of elements) {
        await upload(elt, remote);
    }
    return await client.close();
}
exports.copy = copy;
async function run() {
    const host = core.getInput('host');
    const username = core.getInput('username');
    const port = +core.getInput('port') || 22;
    // const privateKey = core.getInput('privateKey');
    const password = core.getInput('password');
    // const passphrase = core.getInput('passphrase');
    // const tryKeyboard = !!core.getInput('tryKeyboard');
    // const verbose = !!core.getInput('verbose') || true;
    // const recursive = !!core.getInput('recursive') || true;
    // const concurrency = +core.getInput('concurrency') || 1;
    const local = core.getInput('local');
    const dotfiles = !!core.getInput('dotfiles') || true;
    const remote = core.getInput('remote');
    // const rmRemote = !!core.getInput('rmRemote') || false;
    // const atomicPut = core.getInput('atomicPut');
    const exclude = core.getInput('exclude') || '';
    await copy(host, port, username, password, local, remote, exclude, dotfiles);
}
exports.run = run;
