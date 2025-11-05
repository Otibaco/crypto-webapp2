import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { from, to, amount, fromChain, toChain, address, refundAddress } = await req.json()

    if (!from || !to || !amount || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ❗️ V3 BASE URL ❗️
    const base = "https://api.stealthex.io/api/v3"
    const key = process.env.STEALTHEX_KEY

    // Mappings (keeping these as they are correct)
    const SYMBOL_MAP = {
      bnb: "bnb",
      usdt: "usdt",
      usdc: "usdc",
      eth: "eth",
      matic: "matic",
    }
    const mappedFrom = SYMBOL_MAP[from] || from
    const mappedTo = SYMBOL_MAP[to] || to
    

    // ❗️ V3 ENDPOINT AND QUERY ❗️
    const fetchUrl = `${base}/exchange?api_key=${key}` 

    // ❗️❗️❗️ FINAL CORRECTED V3 BODY STRUCTURE ❗️❗️❗️
    const body = {
      // All fields now align with V3 requirements (Fixing 'amount' -> 'amount_from')
      currency_from: mappedFrom,
      currency_to: mappedTo,
      amount_from: parseFloat(amount), // <<< FIX APPLIED HERE
      rate_type: 'floating', 
      address_to: address, 
      return_address: refundAddress || address,
    }

    console.log("Attempting to execute swap with V3 URL:", fetchUrl, body)

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()

    if (!response.ok) {
      console.error("StealthEX (V3 execute) error:", response.status, text) 
      return NextResponse.json({ error: text }, { status: response.status })
    }

    const data = JSON.parse(text)

    // V3 Response structure is similar but flat
    return NextResponse.json({
      id: data.id,
      deposit_address: data.deposit_address,
      withdrawal_address: data.address,
      from_currency: data.from_currency,
      to_currency: data.to_currency,
      rate: data.rate,
      status: data.status,
      estimated_amount: data.estimated_amount,
    })

  } catch (e) {
    console.error("Swap execute API error (V3 fallback):", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}