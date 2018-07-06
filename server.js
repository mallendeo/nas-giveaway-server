'use strict'

const {
  Neb,
  Transaction,
  Account,
  HttpRequest
} = require('nebulas')

const fs = require('fs-extra')
const fastify = require('fastify')({ logger: true })
const cors = require('cors')
const os = require('os')
const path = require('path')

const { PORT = 3002 } = process.env

const configDir = path.join(os.homedir(), '.nas-giveaway')
fs.ensureDirSync(configDir)

const wallets = fs.readdirSync(configDir).filter(name => /^n1.+json$/.test(name))
if (wallets.length !== 1) throw Error(`Multiple wallets found in "${configDir}"`)
const wallet = fs.readJSONSync(path.join(configDir, wallets[0]))

const configPath = path.join(configDir, 'config.json')
const config = fs.readJSONSync(configPath)

;['mainnet', 'contractAddr', 'passphrase'].forEach(prop => {
  if (typeof config[prop] === 'undefined') {
    throw Error(`mainnet, contractAddr, passphrase are required!`)
  }
})

const callbackUrl = config.mainnet
  ? 'https://mainnet.nebulas.io'
  : 'https://testnet.nebulas.io'

const neb = new Neb()
neb.setRequest(new HttpRequest(callbackUrl))

const account = new Account()
  .fromKey(wallet, config.passphrase)

/**
 * @param {*} to Address
 * @param {Object} contract { function: '', args: [] }
 */
const send = async (to, { fn, args = [] } = {}) => {
  if (!to) throw Error('Missing parameter `to`')
  const state = await neb.api.getAccountState(account.getAddressString())

  const contract = typeof fn === 'string' ? {
    function: fn,
    args: JSON.stringify(args)
  } : null

  const tx = new Transaction(
    config.mainnet ? 1 : 1001,
    account,
    to,
    '0',
    parseInt(state.nonce) + 1,
    1000000,
    200000,
    contract
  )

  tx.signTransaction()

  return neb.api.sendRawTransaction({ data: tx.toProtoString() })
}

// Server
// --------------------------
const ADDR = account.getAddressString()
fastify.use(cors())

fastify.get('/', (request, reply) => {
  reply.send({ success: true, addr: ADDR })
})

fastify.post('/claim/:address', async request => {
  try {
    const tx = await send(config.contractAddr, {
      fn: 'claim',
      args: [request.params.address]
    })

    return { success: true, payload: tx }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

fastify.listen(PORT, err => {
  if (err) throw err

  neb.api.getAccountState({ address: ADDR })
    .then(state => {
      console.log('Wallet address:', ADDR)
      console.log('Balance:', state.balance / 10 ** 18, 'NAS')
      console.log('Nonce:', state.nonce)
    })
    .catch(console.error)
})
