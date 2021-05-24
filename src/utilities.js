const core = require('@actions/core')
const scp = require('node-scp')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const {error} = require("@actions/core");
let client
let base
let errorCount = 0
let errorFiles = []
let r
let excludedPaths

async function uploadFile (local, remote) {
    let remotePath = remote + local.replace(r, "$2")
    try {
        await client.uploadFile(local, remotePath).then(()=>
        console.log(`copied file ${local} to ${remotePath} 🟢`))
    } catch (e) {
        console.log(`couldn't copy file ${local} to ${remotePath} 🔴`)
        console.log(e)
        // errorCount++;
        // errorFiles.push(local)
    }
}

async function uploadDir (local, remote) {
    let remotePath = remote + local.replace(r, "$2")
    try {
        await client.uploadDir(local, remotePath)
        console.log(`copied directory ${local} to ${remotePath} 🟢`)
    } catch (e) {
        console.log(`couldn't copy directory ${local} to ${remotePath} 🔴`)
        console.log(e)
        // errorCount++;
    }
}

function getPaths (local) {
    let paths = []

    if (local.match(/\*/)) { // glob path
        glob(local, (err, files) => {
            files.forEach(file => {
                // console.log(file)
                if (!excludedPaths.has(file)) {
                    paths.push(file)
                    // console.log(`not exluded: ${file}`)
                }
            })
        })
    } else if (fs.statSync(local).isFile()) { // single file
        if (!excludedPaths.has(local)) {
            paths.push(local)
            // console.log(`not exluded: ${file}`)
        }
    } else { // directory
        local = local.endsWith('/') ? local : local+'/'
        let files = fs.readdirSync(local)
        if (files.length===0) {
            error('Directory is empty')
        }
        files.forEach(file =>  {
            // console.log(file)
            if (!excludedPaths.has(local+file)) {
                paths.push(local+file)
                // console.log(`not exluded: ${file}`)
            }
        })
    }
    return paths
}

async function copy (
    host,
    port,
    username,
    password,
    local,
    remote,
    exclude
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

    base = path.basename(local)
    r = RegExp(`.*(\.\/)?${base}\/(.*)`)
    local = path.normalize(local)

    excludedPaths = new Set()
    if (exclude!==null) {
        let files
        let excludePath = path.join(local, exclude)
        if (fs.statSync(local).isDirectory()) {
            if (exclude.match(/\*/)) {
                // console.log(`excluded: ${excludePath}`)
                files = glob.sync(excludePath)
            } else {
                if (fs.statSync(excludePath).isDirectory()) {
                    files = fs.readdirSync(excludePath)
                    files = files.map(file => path.join(excludePath,file))
                }
            }
            // console.log(`exluded files: ${files}`)
            files.forEach(file => {
                excludedPaths.add(file)
            })
        }
    }

    let stack = getPaths(local, exclude)
    while (stack.length!==0) {
        let path = stack.pop()
        if (fs.statSync(path).isFile()) {
            await uploadFile(path, remote)
            // console.log(`file: ${path}`)
        } else {
            let paths = getPaths(path, exclude)
            await uploadDir(path, remote)
            // console.log(`directory: ${path}`)
            paths.forEach(p => stack.push(p))
        }
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
    // const dotfiles = !!core.getInput('dotfiles') || true;
    const remote = core.getInput('remote').match(/\/$/) ? core.getInput('remote') : core.getInput('remote')+'/';
    // const rmRemote = !!core.getInput('rmRemote') || false;
    // const atomicPut = core.getInput('atomicPut');
    const exclude = core.getInput('exclude') || null;


    await copy(
        host,
        port,
        username,
        password,
        local,
        remote,
        exclude
    )
}

module.exports = { copy, run }

