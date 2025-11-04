import { NextResponse } from 'next/server'
import { getTransactionsByWallet } from '../../../../controllers/transactionController'

export async function POST(req) {
  try {
    const body = await req.json()
    const { walletAddress, type } = body || {}
    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 })
    const items = await getTransactionsByWallet(walletAddress, { type })
    return NextResponse.json({ success: true, items })
  } catch (err) {
    console.error('API /api/transactions/get error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
