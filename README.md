# nas-giveaway-server

# Install
```bash
$ git clone https://github.com/mallendeo/nas-giveaway-server
$ yarn # or npm i

# create config directory
$ mkdir -p ~/.nas-giveaway
$ touch  ~/.nas-giveaway/config.json
```

Config file example:

```json
{
  "contractAddr": {
    "mainnet": "n1LXsq2imeWFSq7ZSpoT1JgrRoKpMHP8stz",
    "testnet": "n1LXsq2imeWFSq7ZSpoT1JgrRoKpMHP8stz"
  },
  "passphrase": "some password"
}
```

Copy your encrypted wallet file to the config directory

Example:

```bash
$ cp ~/Downloads/n1LXsq2imeWFSq7ZSpoT1JgrRoKpMHP8stz.json ~/.nas-giveaway
```

Run the server:

```bash
$ PORT=3002 yarn dev # live-reload fastify server
```

# Usage

### Claim
```bash
# curl -X POST http://localhost:3002/claim/{{your_address}}
$ curl -X POST http://localhost:3002/testnet/claim/n1LXsq2imeWFSq7ZSpoT1JgrRoKpMHP8stz
$ curl -X POST http://localhost:3002/mainnet/claim/n1LXsq2imeWFSq7ZSpoT1JgrRoKpMHP8stz
```

# License

MIT
