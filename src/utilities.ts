import * as core from "@actions/core"
import config from "./config"
import { Options } from "./options"
import path = require("path")
import scp = require("node-scp")
import fs = require("fs")
import glob = require("glob")

let errors = 0
let client: scp.ScpClient
let localBase: string

enum PathType {
    file, directory
}

class Element {
    type: PathType
    path: string

    constructor(type: PathType, path: string) {
        this.type = type
        this.path = path
    }
}

interface NodeSCPElement {
    type: string
    name: string
    size?: number
    modifyTime: number
    accessTime: number
    rights: { user: string, group: string, other: string }
    owner: number
    group: number
}

async function removeRemoteFile(file: string) {
    try {
        await client.unlink(file)
        console.log(`Removed file ${file}`)
    } catch (err: any) {
        errors++
        console.log(`🔴 Couldn't remove file ${file}: ${err.message}`)
    }
}

async function removeRemoteDir(dir: string) {
    try {
        await client.rmdir(dir)
        console.log(`Removed directory ${dir}`)
    } catch (err: any) {
        errors++
        console.log(`🔴 Couldn't remove directory ${dir}: ${err.message}`)
    }
}

async function removeRemoteElement(element: NodeSCPElement, remote: string) {
    if (element.type === "d") {
        return await removeRemoteDir(path.join(remote, element.name))
    } else {
        return await removeRemoteFile(path.join(remote, element.name))
    }
}

async function removeRemote(remote: string) {
    let files
    try {
        files = await client.list(remote)
    } catch (err: any) {
        console.log(err.message)
    }
    for (let file of files) {
        await removeRemoteElement(file, remote)
    }
    console.log("Cleared remote\n")
}

const relativeLocal = (filePath: string) => {
    if (localBase.match(/^(\.\/?)?$/)) {
        return filePath
    }
    return filePath.substring(localBase.length)
}

async function upload(element: Element, remote: string) {
    let localPath = element.path
    let remotePath = path.join(remote, relativeLocal(localPath))

    if (element.type === PathType.file) {
        try {
            await client.uploadFile(localPath, remotePath)
            console.log(`🟢 Copied file ${localPath} to ${remotePath}`)
        } catch (e: any) {
            errors++
            console.error(`🔴 Couldn't copy file ${localPath} to ${remotePath}: ${e.message}`)
        }
    } else {
        try {
            await client.mkdir(remotePath)
            console.log(`🟢 Created directory ${remotePath}`)
        } catch (e: any) {
            if (e.code === 4) {
                console.log(`Directory "${remotePath}" already exists`)
            } else {
                errors++
                console.error(`🔴 Couldn't create directory ${remotePath}: ${e.message}`)
            }
        }
    }
}

function getElements(local: string, exclude: string, dotFiles: boolean) {
    let elements: Element[] = []
    let excludeGlob = exclude
    let excludeList: string[] = []
    let files: string[]

    if (fs.statSync(local).isFile()) {
        return [{type: PathType.file, path: local}]
    }
    if (exclude !== "") {
        exclude = path.join(local, exclude)
        if (!exclude.match(/\*/)) {
            excludeGlob = path.join(exclude, "/**/*")
        } else {
            excludeGlob = exclude.replace(/\*\.(\w*)$/, "**/*.$1")
        }
        glob.sync(excludeGlob).forEach(file => excludeList.push(file))
        excludeList.push(exclude)
    }
    glob.sync(".git/**/*").forEach(file => excludeList.push(file))
    glob.sync(".github/**/*").forEach(file => excludeList.push(file))
    glob.sync(".idea/**/*").forEach(file => excludeList.push(file))
    files = glob.sync(path.join(local, "**/*"), {ignore: excludeList, dot: dotFiles})
    files.forEach(localPath => {
        if (fs.statSync(localPath).isFile()) {
            elements.push({type: PathType.file, path: localPath})
        } else {
            elements.push({type: PathType.directory, path: localPath})
        }
    })
    console.log("Element list generated\n")
    return elements
}

export async function copy(
    {
        host,
        port,
        username,
        password,
        privateKey,
        passphrase,
        local,
        remote,
        exclude,
        dotFiles,
        rmRemote
    }: Options
) {
    try {
        // @ts-ignore
        client = await scp({
            host,
            port,
            username,
            password,
            privateKey,
            passphrase

        })
    } catch (e: any) {
        console.error(`Couldn't connect to server ❌\nPlease check your action parameters: ${e.message}`)
        process.exit(1)
    }

    local = path.normalize(local)
    localBase = fs.statSync(local).isDirectory() ? local : path.dirname(local)
    remote = path.normalize(remote)

    if (rmRemote) {
        console.log("Clearing remote...")
        await removeRemote(remote)
    }
    console.log("Generating element list...")
    let elements = getElements(local, exclude, dotFiles)
    console.log("Uploading...")
    for (const elt of elements) {
        await upload(elt, remote)
    }
    await client.close()
    if (errors > 0) {
        console.error(`\n\n${errors} error${errors > 1 ? "s" : ""}`)
        process.exit(1)
    } else {
        console.log("\n\nAll files transferred successfully")
    }
}

export async function run() {
    if (process.env.GITHUB_ACTION_ENV === "test") {
        await copy(config)
    } else {
        return await copy({
            host: core.getInput("host"),
            username: core.getInput("username"),
            password: core.getInput("password"),
            privateKey: core.getInput("privateKey"),
            passphrase: core.getInput("passphrase"),
            port: +core.getInput("port") || 22,
            local: core.getInput("local"),
            dotFiles: core.getInput("dotfiles") === "" || core.getInput("dotfiles") === "true",
            remote: core.getInput("remote"),
            exclude: core.getInput("exclude"),
            rmRemote: core.getInput("rmRemote") === "true",
        })
    }
}
