const core = require('@actions/core')
const scp = require('node-scp')
const fs = require('fs')
const glob = require('glob')
const path = require('path')

copy = (
    host,
    port,
    username,
    password,
    local,
    remote) =>
{
    // let errorCount = 0
    // let errorFiles = []

    scp({
        host: host,
        port: port,
        username: username,
        password: password,
        // privateKey: privateKey,
        // passphrase: passphrase,
    }).then(client => {

        const uploadFile = (local, remote) => {
            let remotePath = remote + path.basename(local)
            client.uploadFile(local, remotePath)
                .then(response => {
                    console.log(`copied file ${local} to ${remotePath} 🟢`)
                    client.close()
                })
                .catch(e => {
                    console.log(`couldn't copy file ${local} to ${remotePath} 🔴`)
                    console.log(e)
                    // errorCount++;
                    // errorFiles.push(local)
                })
        }

        const uploadDir = (local, remote) => {
            let remotePath = remote + path.basename(local)
            client.uploadDir(local, remotePath)
                .then(response => {
                    console.log(`copied directory ${local} to ${remotePath} 🟢`)
                    client.close()
                })
                .catch(e => {
                    console.log(`couldn't copy directory ${local} to ${remotePath} 🔴`)
                    console.log(e)
                    // errorCount++;
                })
        }

        if (local.match(/\*/)) {
            glob(local, (err, files) => {
                files.forEach(file => {
                    console.log(file)
                    uploadFile(file, remote)
                })
            })
        } else if (fs.statSync(local).isFile()) {
            uploadFile(local, remote)
        } else {
            local = local.endsWith('/') ? local : local+'/'
            fs.readdirSync(local).forEach(file =>  {
                if (fs.statSync(local+file).isFile()) {
                    uploadFile(local + file, remote)
                } else {
                    uploadDir(local+file, remote)
                }
            })
        }
        // if (errorCount===0) {
        //     console.log('All files copied successfully! 💯')
        // } else {
        //     console.log(`Some files haven't been copied :`)
        //     errorFiles.forEach(file => console.log('\n'+file))
        // }
    }).catch(e => {
        console.log(`Couldn't connect to server ❌\nPlease check your action parameters`)
        console.log(e)
    })
}

run = () => {
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
    // const exclude = core.getInput('exclude') || null;

    copy(
        host,
        port,
        username,
        password,
        local,
        remote,
    )
}

module.exports = {
    copy: copy,
    run: run,
}
