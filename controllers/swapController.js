import connectDB from '../lib/connectDB'
import User from '../models/User'
import Transaction from '../models/Transaction'

export default async function saveSwap({ walletAddress, fromToken, toToken, amount, status, txHashes = [], meta = {} }) {
  if (!walletAddress) throw new Error('walletAddress required')
  await connectDB()

  // upsert user
  let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })
  if (!user) user = await User.create({ walletAddress: walletAddress.toLowerCase() })

  const doc = await Transaction.create({
    user: user._id,
    txHash: (txHashes && txHashes[0] && txHashes[0].hash) ? txHashes[0].hash : (txHashes && txHashes[0]) ? txHashes[0] : null,
    type: 'swap',
    token: `${fromToken}->${toToken}`,
    amount: amount?.toString?.() || String(amount || ''),
    status: status || 'pending',
    meta,
  })
  return doc
}

export async function getSwapsByAddress(walletAddress, limit = 50) {
  if (!walletAddress) return []
  await connectDB()
  const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })
  if (!user) return []
  const swaps = await Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(limit).lean()
  return swaps
}
