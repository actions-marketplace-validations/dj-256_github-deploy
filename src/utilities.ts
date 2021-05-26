import {error} from "@actions/core";
import path = require('path');
import scp = require('node-scp');
import fs = require('fs');
import glob = require('glob');
import * as core from "@actions/core";

let client: any
let errorCount = 0
let errorFiles = []
let excludedPaths
let localBase

enum PathType {
    file, directory
}

class Element {
    type: PathType
    path: string

    constructor(type:PathType, path:string) {
        this.type = type
        this.path = path
    }
}

const relativeLocal = (filePath: string) => {
    return filePath.substr(localBase.length-1,filePath.length-1)
}

async function upload (element: Element, remote: string) {
    let localPath = element.path
    let remotePath = path.join(remote, relativeLocal(localPath))

    if (element.type===PathType.file) {
        try {
            await client.uploadFile(localPath, remotePath)
            console.log(`copied file ${localPath} to ${remotePath} 🟢`)
        } catch (e) {
            console.log(`couldn't copy file ${localPath} to ${remotePath} 🔴`)
            console.log(e)
            // errorCount++;
            // errorFiles.push(local)
        }
    } else {
        try {
            await client.mkdir(remotePath)
            console.log(`created directory ${remotePath} 🟢`)
        } catch (e) {
            console.log(`couldn't create directory ${remotePath} 🔴`)
            console.log(e)
        }
    }
}

function getElements (local:string, exclude:string, dotFiles:boolean) {
    let elements: Element[] = []
    let excludeGlob = exclude
    // if (fs.statSync(local).isDirectory()) local+='/*'
    if (exclude!=='') {
        exclude = path.join(local, exclude)
        if (!exclude.match(/\*/)) {
            if (fs.statSync(exclude).isDirectory()) excludeGlob = path.join(exclude, '/**/*')
        }
        exclude = exclude.replace(/\*\.(\w*)$/, "**/*.$1")
    }
    if (fs.statSync(local).isDirectory()) local = path.join(local, '**/*')
    let excludeList = glob.sync(excludeGlob)
    excludeList.push(exclude)
    let files = glob.sync(local, {ignore:excludeList, dot:dotFiles})
    // files.map(file => path.basename(file))
    files.forEach(localPath => {
        // console.log(file)
        if (fs.statSync(localPath).isFile()) {
            elements.push({type: PathType.file, path: localPath})
        } else {
            elements.push({type: PathType.directory, path: localPath})
        }
    })
    return elements
}

export async function copy (
    host: string,
    port: number,
    username: string,
    password: string,
    local: string,
    remote: string,
    exclude: string,
    dotfiles: boolean,
) {
    try {
        // @ts-ignore
        client = await scp({
            host: host,
            port: port,
            username: username,
            password: password,
            // privateKey: privateKey,
            // passphrase: passphrase
        })
    } catch (e) {
        console.log(`Couldn't connect to server ❌\nPlease check your action parameters`)
        console.log(e)
        process.exit(1)
    }

    local = path.normalize(local)
    localBase = local
    remote = path.normalize(remote)

    let elements = getElements(local, exclude, dotfiles)
    for (const elt of elements) {
        await upload(elt, remote)
    }
    return await client.close()
}

export async function run (
) {
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


    copy(
        host,
        port,
        username,
        password,
        local,
        remote,
        exclude,
        dotfiles
    ).then(process.exit(0))
        .catch(e=>{
            console.log('erreur')
            console.log(e)
        })
}

module.exports = { copy, run }
