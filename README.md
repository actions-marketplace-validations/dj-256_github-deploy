# github-deploy
Github Action providing simple scp feature

## Examples

### **Copy a single file**

```yml
- name: Copy single file
  uses: dj-256/github-deploy@v1
  with:
    local: main.py
    remote: /home/user/example
    host: ${{ secrets.HOST }}
    port: ${{ secrets.PORT }}
    username: ${{ secrets.USERNAME }}
    password: ${{ secrets.PASSWORD }}

```

### **Copy a directory recursively**

```yml
- name: Copy entire directory
  uses: dj-256/github-deploy@v1
  with:
    local: ./dist
    remote: /var/www/app
    host: ${{ secrets.HOST }}
    username: ${{ secrets.SSH_USER }}
    password: ${{ secrets.PASSWORD }}

```

### **Copy a directory excluding some files**
```yml
- name: Excluding JS files
  uses: dj-256/github-deploy@v1
  with:
      local: dist
      remote: /home/example/
      host: ${{ secrets.HOST }}
      username: ${{ secrets.SSH_USER }}
      password: ${{ secrets.PASSWORD }}
      exclude: '*.js'
```

### **Copy a directory excluding a subdirectory**
```yml
- name: Copy exluding subdirectory
  uses: dj-256/github-deploy@v1
  with:
      local: ./
      remote: /var/www/dir
      host: ${{ secrets.HOST }}
      username: ${{ secrets.SSH_USER }}
      password: ${{ secrets.PASSWORD }}
      port: ${{ secrets.SSH_PORT }}
      exclude: 'out/*'
```


## Options

- **local** - _string_ - Path to the local file or directory you want to copy, relative to repository root. **required**

- **remote** - _string_ - Path to the remote directory to copy the contents to, absolute. **required**

- **host** - _string_ - Hostname or IP address of the server. **Default:** `'localhost'`

- **port** - _integer_ - Port number of the server. **Default:** `22`

- **username** - _string_ - Username for authentication. **Default:** (none)

- **password** - _string_ - Password for password-based user authentication. **Default:** (none)

- **passphrase** - _string_ - For an encrypted private key, this is the passphrase used to decrypt it. **Default:** (none)

- **rmRemote** - _boolean_ - Clean directory before uploading. **Default:** `false`

- **exclude** - _string_ - Paths excluded from the copy, relative to remote path. You can specify a single file or
  directory or else, use a glob.

## Development

This has been strongly inspired by [garygrossgarten's github-action-scp](https://github.com/garygrossgarten/github-action-scp)
it uses [node-scp](https://www.npmjs.com/package/node-scp) and [glob](https://www.npmjs.com/package/glob)
