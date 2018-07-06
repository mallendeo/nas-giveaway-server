class Giveaway {
  constructor () {
    LocalContractStorage.defineMapProperty(this, 'tx')
    LocalContractStorage.defineProperty(this, 'txCount')
    LocalContractStorage.defineProperty(this, 'admin')
    LocalContractStorage.defineProperty(this, 'txAmount')
  }

  init () {
    this.admin = Blockchain.transaction.from
    this.txCount = 0
    this.setAmount(0.0001)
  }

  _toWei (amount) {
    return new BigNumber(amount * 10 ** 18)
  }

  _checkAdmin () {
    const { from } = Blockchain.transaction
    if (this.admin !== from) throw Error('Not allowed.')
  }

  claim (address) {
    if (!address) throw Error('Param `address` required.')
    if (this.tx.get(address)) throw Error('Address already claimed.')

    const result = Blockchain.transfer(address, this.txAmount)
    if (!result) throw Error('Transfer failed.')

    this.tx.set(address, this.txAmount)

    Event.Trigger('claimed', {
      Transfer: {
        from: this.admin,
        to: address,
        value: this.txAmount.toString()
      }
    })
  }

  setAmount (amount) {
    if (typeof amount === 'undefined') throw Error('Param `amount` required.')
    this._checkAdmin()
    this.txAmount = this._toWei(amount)
  }

  widthdraw (balance) {
    this._checkAdmin()

    const result = Blockchain.transfer(from, new BigNumber(balance * 10 ** 18))
    if (!result) throw Error('Transfer failed.')
  }

  accept () {
    Event.Trigger('deposit', {
      from: Blockchain.transaction.from
    })
  }
}

module.exports = Giveaway
