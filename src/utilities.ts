import {error} from "@actions/core";
import path = require('path');
import scp = require('node-scp');
import fs = require('fs');
import glob = require('glob');
import * as core from "@actions/core";
import ini = require('ini')

let client: any
let localBase: string
const TEST = false
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

interface Options {
    host: string,
    username: string,
    password: string,
    port: number,
    local: string,
    remote: string,
    exclude: string,
    dotFiles?: boolean,
    rmRemote?: boolean,
}

const relativeLocal = (filePath: string) => {
    if (localBase.match(/^(\.\/?)?$/)) {
        return filePath
    }
    return filePath.substring(localBase.length)
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

function getElements(local: string, exclude: string, dotFiles: boolean) {
    let elements: Element[] = []
    let excludeGlob = exclude
    let files: string[]
    if (fs.statSync(local).isDirectory()) local = path.join(local, '**/*')
    if (exclude!=='') {
        exclude = path.join(local, exclude)
        if (!exclude.match(/\*/) && fs.statSync(exclude).isDirectory()) {
            excludeGlob = path.join(exclude, '/**/*')
        }
        exclude = exclude.replace(/\*\.(\w*)$/, "**/*.$1")
        let excludeList = glob.sync(excludeGlob)
        excludeList.push(exclude)
        files = glob.sync(local, {ignore:excludeList, dot:dotFiles})
    } else {
        files = glob.sync(local ,{dot: dotFiles})
    }

    files.forEach(localPath => {
        if (fs.statSync(localPath).isFile()) {
            elements.push({type: PathType.file, path: localPath})
        } else {
            elements.push({type: PathType.directory, path: localPath})
        }
    })
    return elements
}

export async function copy (
    {host,
    port,
    username,
    password,
    local,
    remote,
    exclude,
    dotFiles=true}: Options
) {
    try {
        // @ts-ignore
        client = await scp({
            host: host,
            port: port,
            username: username,
            password: password,
        })
    } catch (e) {
        console.log(`Couldn't connect to server ❌\nPlease check your action parameters`)
        console.log(e)
        process.exit(1)
    }

    local = path.normalize(local)
    localBase = fs.statSync(local).isDirectory() ? local : path.dirname(local)
    remote = path.normalize(remote)

    let elements = getElements(local, exclude, dotFiles)
    for (const elt of elements) {
        await upload(elt, remote)
    }
    return await client.close()
}

export async function run (
) {
    if (process.env.NODE_ENV==='test' || TEST) {
        let config = ini.parse(fs.readFileSync('configuration.ini', 'utf-8'));
        let options = config.options
        console.log(options)
        return await copy(
            options
        )
    } else {
        return await copy ({
            host: core.getInput('host'),
            username: core.getInput('username'),
            password: core.getInput('password'),
            port: +core.getInput('port') || 22,
            local: core.getInput('local'),
            dotFiles: !!core.getInput('dotfiles') || true,
            remote: core.getInput('remote'),
            exclude: core.getInput('exclude') || '',
        })
    }
}
