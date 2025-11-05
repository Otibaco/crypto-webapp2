// import { saveSwap } from '../../../controllers/swapController'
import saveSwap from '../../../controllers/swapController'
import { NextResponse } from 'next/server'


export async function POST(req) {
  try {
    const body = await req.json()
    const { walletAddress, fromToken, toToken, amountIn, amountOut, status, txHashes, error } = body
    const meta = { amountOut, error }
    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 })

    const doc = await saveSwap({ walletAddress, fromToken, toToken, amount: amountIn, status: status || 'pending', txHashes, meta })
    return NextResponse.json({ ok: true, id: doc._id })
  } catch (e) {
    console.error('log-swap error', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
