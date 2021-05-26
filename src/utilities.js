const core = require('@actions/core')
const scp = require('node-scp')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const {error} = require("@actions/core");
let client
let errorCount = 0
let errorFiles = []
let excludedPaths
let localBase

const relativeLocal = (filePath) => {
    return filePath.substr(localBase.length-1,filePath.length-1)
}

async function upload (elt, remote) {
    let localPath = elt.path
    let remotePath = path.join(remote, relativeLocal(localPath))

    if (elt.type==='file') {
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

function getPaths (local, exclude, dotFiles) {
    let paths = []
    let excludeGlob
    // if (fs.statSync(local).isDirectory()) local+='/*'
    exclude = path.join(local, exclude)
    if (!exclude.match(/\*/)) {
        if (fs.statSync(exclude).isDirectory()) excludeGlob = path.join(exclude,'/**/*')
    }
    exclude = exclude.replace(/\*\.(\w*)$/, '**/*.$1')
    if (fs.statSync(local).isDirectory()) local = path.join(local, '**/*')
    let excludeList = glob.sync(excludeGlob)
    excludeList.push(exclude)
    let files = glob.sync(local, {ignore:excludeList, dot:dotFiles})
    // files.map(file => path.basename(file))
    files.forEach(path => {
        // console.log(file)
        if (fs.statSync(path).isFile()) {
            paths.push({type: 'file', path: path})
        } else {
            paths.push({type: 'directory', path: path})
        }
    })
    return paths
}

async function copy (
    host,
    port,
    username,
    password,
    local,
    remote,
    exclude,
    dotfiles
) {
    try {
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

    let elements = getPaths(local, exclude, dotfiles)
    for (const elt of elements) {
        await upload(elt, remote)
    }
    await client.close()
}

async function run (
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
    const exclude = core.getInput('exclude') || null;


    return await copy(
        host,
        port,
        username,
        password,
        local,
        remote,
        exclude,
        dotfiles
    )
}

module.exports = { copy, run }
