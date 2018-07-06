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

const wallets = fs.readdirSync(configDir).filter(name => /^n.+json$/.test(name))
if (wallets.length !== 1) throw Error(`There must be at least one wallet in "${configDir}"`)
const wallet = fs.readJSONSync(path.join(configDir, wallets[0]))

const configPath = path.join(configDir, 'config.json')
const config = fs.readJSONSync(configPath)

if (
  !config || !config.contractAddr || !config.passphrase ||
  !config.contractAddr.mainnet ||
  !config.contractAddr.testnet
) {
  throw Error(`Missing props, check your config file "${configPath}"`)
}

const mainNeb = new Neb()
mainNeb.setRequest(new HttpRequest('https://mainnet.nebulas.io'))

const testNeb = new Neb()
testNeb.setRequest(new HttpRequest('https://testnet.nebulas.io'))

const nets = {
  mainnet: mainNeb,
  testnet: testNeb
}

const getNeb = mainnet => nets[mainnet ? 'mainnet' : 'testnet']

const account = new Account()
  .fromKey(wallet, config.passphrase)

/**
 * @param {*} to Address
 * @param {Object} contract { function: '', args: [] }
 */
const send = async (to, { fn, args = [] } = {}, mainnet = true) => {
  const neb = getNeb(mainnet)

  if (!to) throw Error('Missing parameter `to`')
  const state = await neb.api.getAccountState(account.getAddressString())

  const contract = typeof fn === 'string' ? {
    function: fn,
    args: JSON.stringify(args)
  } : null

  const tx = new Transaction(
    mainnet ? 1 : 1001,
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

fastify.post('/:net/claim/:address', async request => {
  const { net, address } = request.params
  if (['mainnet', 'testnet'].indexOf(net) < 0) {
    return { success: false, error: 'Invalid net' }
  }

  try {
    const { txhash } = await send(config.contractAddr[net], {
      fn: 'claim',
      args: [address]
    }, net === 'mainnet')

    return {
      success: true,
      payload: {
        txhash,
        url: `https://explorer.nebulas.io/#/${net}/tx/${txhash}`
      }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

const logStatus = (mainnet = true) => {
  getNeb(mainnet).api.getAccountState({ address: ADDR })
    .then(state => {
      console.log('===', mainnet ? 'Mainnet' : 'Testnet')
      console.log('Wallet address:', ADDR)
      console.log('Balance:', state.balance / 10 ** 18, 'NAS')
      console.log('Nonce:', state.nonce)
    })
    .catch(console.error)
}

fastify.listen(PORT, '0.0.0.0', err => {
  if (err) throw err

  logStatus()
  logStatus(false)
})
