import connectDB from '../lib/connectDB'
import User from '../models/User'

export async function createUserIfNotExists(walletAddress) {
  if (!walletAddress) return null
  try {
    await connectDB()
    const wa = walletAddress.toLowerCase()
    let user = await User.findOne({ walletAddress: wa })
    if (!user) user = await User.create({ walletAddress: wa })
    return user

  } catch (err) {
    console.error('createUserIfNotExists error', err)
    return null
  }
}

export async function getUserByWallet(walletAddress) {
  if (!walletAddress) return null
  try {
    await connectDB()
    const wa = walletAddress.toLowerCase()
    return await User.findOne({ walletAddress: wa })
  } catch (err) {
    console.error('getUserByWallet error', err)
    return null
  }
}
