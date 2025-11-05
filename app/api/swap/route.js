import { NextResponse } from "next/server"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")?.toLowerCase()
    const to = searchParams.get("to")?.toLowerCase()
    const fromChain = searchParams.get("fromChain")?.toLowerCase()
    const toChain = searchParams.get("toChain")?.toLowerCase()
    const amount = searchParams.get("amount")

    if (!from || !to || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Base URL + API key
    const base = "https://api.stealthex.io/v4"
    const key = process.env.STEALTHEX_KEY

    // Symbol and Network Mappings
    const SYMBOL_MAP = {
      bnb: "bnb",
      usdt: "usdt",
      usdc: "usdc",
      eth: "eth",
      matic: "matic",
    }
    const NETWORK_MAP = {
      bnb: "bsc",
      ethereum: "eth",
      polygon: "polygon",
    }

    // Resolve mapped tokens + networks
    const mappedFrom = SYMBOL_MAP[from] || from
    const mappedTo = SYMBOL_MAP[to] || to
    const mappedFromNetwork = NETWORK_MAP[fromChain] || fromChain
    const mappedToNetwork = NETWORK_MAP[toChain] || toChain

    console.log("Swapping:", {
      from,
      to,
      mappedFrom,
      mappedTo,
      mappedFromNetwork,
      mappedToNetwork,
      amount,
    })

    // This is the correct v4 endpoint for quotes
    const response = await fetch(`${base}/rates/estimated-amount?api_key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: {
          from: { symbol: mappedFrom, network: mappedFromNetwork },
          to: { symbol: mappedTo, network: mappedToNetwork },
        },
        estimation: "direct",
        rate: "floating",
        amount: parseFloat(amount),
      }),
    })

    const text = await response.text()

    if (!response.ok) {
      console.error("StealthEX (quote) error:", text)
      return NextResponse.json({ error: text }, { status: response.status })
    }

    const data = JSON.parse(text)
    return NextResponse.json({
      estimated_amount: data.estimated_amount,
      rate: data.rate,
      min_amount: data.min_amount,
      max_amount: data.max_amount,
    })
  } catch (e) {
    console.error("Swap API (quote) error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}