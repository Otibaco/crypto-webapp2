import connectDB from '../lib/connectDB'
import Transaction from '../models/Transaction'
import { getUserByWallet, createUserIfNotExists } from './userController'

/**
 * Upsert a transaction by txHash (if provided) for the given wallet.
 * If txHash is not provided, always create a new transaction record.
 */
export async function addOrUpdateTransaction(walletAddress, { txHash, type = 'other', token, amount, status = 'pending', meta = {} } = {}) {
  if (!walletAddress) return null
  try {
    await connectDB()
    let user = await getUserByWallet(walletAddress)
    if (!user) user = await createUserIfNotExists(walletAddress)
    if (!user) return null

    if (txHash) {
      // Upsert by txHash for idempotency
      const existing = await Transaction.findOneAndUpdate(
        { txHash },
        { user: user._id, type, token, amount, status, meta },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return existing
    }

    const doc = await Transaction.create({ user: user._id, txHash, type, token, amount, status, meta })
    return doc
  } catch (err) {
    console.error('addOrUpdateTransaction error', err)
    return null
  }
}

export async function getTransactionsByWallet(walletAddress, { type } = {}) {
  if (!walletAddress) return []
  try {
    await connectDB()
    const user = await getUserByWallet(walletAddress)
    if (!user) return []
    const query = { user: user._id }
    if (type) query.type = type
    return await Transaction.find(query).sort({ createdAt: -1 }).limit(200).lean()
  } catch (err) {
    console.error('getTransactionsByWallet error', err)
    return []
  }
}
