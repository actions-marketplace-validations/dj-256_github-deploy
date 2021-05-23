const core = require('@actions/core')
const scp = require('node-scp')
const fs = require('fs')
// const glob = require('glob')
const path = require('path')

copy = (
    host,
    port,
    username,
    password,
    local,
    remote) =>
{
    scp({
        host: host,
        port: port,
        username: username,
        password: password,
        // privateKey: privateKey,
        // passphrase: passphrase,
    }).then(client => {
        if (fs.statSync(local).isFile()) {
            client.uploadFile(local, remote + path.basename(local))
                .then(response => {
                    console.log(response)
                    client.close()
                })
                .catch(e => {
                    console.log('upload error')
                    console.log(e)
                })
        } else {
            client.uploadDir(local, remote)
                .then(response => {
                    console.log(response)
                    client.close()
                })
                .catch(e => {
                    console.log('upload error')
                    console.log(e)
                })
        }
    }).catch(e => console.log('client error'+e))
}

(() => {
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
})()
