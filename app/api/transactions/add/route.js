import { NextResponse } from 'next/server'
import { addOrUpdateTransaction } from '../../../../controllers/transactionController'

export async function POST(req) {
  try {
    const body = await req.json()
    const { walletAddress, txHash, type, token, amount, status, meta } = body || {}
    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 })
    const tx = await addOrUpdateTransaction(walletAddress, { txHash, type, token, amount, status, meta })
    return NextResponse.json({ success: true, tx })
  } catch (err) {
    console.error('API /api/transactions/add error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
