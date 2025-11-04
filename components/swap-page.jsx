"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  useAccount,
  useBalance,
  useChainId,
  useWalletClient
} from "wagmi"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select"
import { ArrowLeft, Loader2, Clock, ArrowDownUp, History } from "lucide-react"
import { getAssetConfig, ASSET_CONFIG_BASE } from "../lib/asset-config"
import { cn } from "../lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog" // Import dialog components
import SwapHistoryModal from "./SwapHistoryModal" // New component for the modal content

const CHAIN_NAMES = {
  1: "Ethereum",
  56: "BNB",
  137: "Polygon",
  8453: "Base",
  10: "Optimism",
  42161: "Arbitrum"
}

// Token list generator (No changes here, kept for context)
function allTokens() {
  const baseSymbols = ["ETH", "BNB", "MATIC", "OP", "ARB", "BASE"]
  const stableChains = ["1", "56", "137"]
  const res = []

  for (const sym of baseSymbols) {
    const config = ASSET_CONFIG_BASE[sym]
    if (!config) continue
    const chainIds = Object.keys(config.addresses)
    const chainId = chainIds[0]
    const id = `${sym}-${chainId}`
    const cfg = getAssetConfig(id)
    if (cfg) res.push(cfg)
  }

  for (const stable of ["USDT", "USDC"]) {
    for (const cid of stableChains) {
      const assetId = `${stable}-${cid}`
      const cfg = getAssetConfig(assetId)
      if (cfg) res.push(cfg)
    }
  }

  return res
}

// Token icon - **UPDATED to use local logos from the /public folder**
function TokenIcon({ token, size = 20 }) {
  // Assuming token.symbol matches the filename in /public/logos (e.g., /public/logos/BNB.svg)
  const logoPath = `/logos/${token.symbol?.toUpperCase()}.svg` // Adjust extension if needed (e.g., .png)

  return (
    <img
      src={logoPath}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      className="rounded-full"
      // Optional fallback if the file doesn't exist
      onError={(e) => { e.currentTarget.style.display = "none" }}
    />
  )
}

// Helper to log swap status to DB
const logSwapStatus = async ({ walletAddress, fromToken, toToken, amount, status, error, depositAddress, estimatedAmount }) => {
  try {
    await fetch("/api/log-swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amountIn: amount,
        amountOut: estimatedAmount,
        status,
        txHashes: [], // If you have tx hash, pass it here
        error,
      }),
    })
  } catch (e) {
    console.error("Failed to log swap to DB:", e)
  }
}


export default function SwapPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()

  const tokenList = useMemo(() => allTokens(), [])
  const [fromToken, setFromToken] = useState(tokenList[0] || null)
  const [toToken, setToToken] = useState(tokenList[1] || null)
  const [amount, setAmount] = useState("")
  const [quote, setQuote] = useState(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [toast, setToast] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false) // State for modal

  const { data: fromBalanceData } = useBalance({
    address,
    token: fromToken?.wagmiTokenAddress,
    chainId: fromToken?.requiredChainId,
    enabled: !!address && !!fromToken,
    watch: true
  })

  const fromBalance = Number(fromBalanceData?.formatted ?? 0)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!fromToken || !toToken || !amount || Number(amount) <= 0) {
      setQuote(null)
      return
    }

    try {
      setIsQuoting(true)
      const res = await fetch(
        `/api/swap?from=${fromToken.symbol.toLowerCase()}&to=${toToken.symbol.toLowerCase()}&amount=${amount}&fromChain=${CHAIN_NAMES[fromToken.requiredChainId]}&toChain=${CHAIN_NAMES[toToken.requiredChainId]}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Quote failed")
      setQuote(data)
    } catch (err) {
      console.error(err)
      setToast({ type: "error", message: err.message })
      setQuote(null)
    } finally {
      setIsQuoting(false)
    }
  }, [amount, fromToken, toToken])

  useEffect(() => {
    const timeoutId = setTimeout(fetchQuote, 800)
    return () => clearTimeout(timeoutId)
  }, [fetchQuote])

  // Swap tokens (execute)
  const handleSwap = async () => {
    if (!isConnected || !address) {
      setToast({ type: "error", message: "Connect wallet first" })
      return
    }

    if (!quote || Number(amount) <= 0) {
      setToast({ type: "error", message: "Enter a valid amount" })
      return
    }

    // CHECK MIN AMOUNT (Crucial fix for your previous 404 error)
    if (quote.min_amount && Number(amount) < Number(quote.min_amount)) {
      setToast({ type: "error", message: `Amount is below minimum of ${Number(quote.min_amount).toFixed(4)} ${fromToken.symbol}` })
      return
    }

    let status = 'pending'
    let depositAddress = null
    let error = null

    try {
      setIsSwapping(true)

      const res = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromToken.symbol.toLowerCase(),
          to: toToken.symbol.toLowerCase(),
          fromChain: CHAIN_NAMES[fromToken.requiredChainId],
          toChain: CHAIN_NAMES[toToken.requiredChainId],
          amount,
          address, // your withdrawal wallet
          refundAddress: address, // optional safety fallback
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        status = 'failed'
        error = data.error || "Swap creation failed"
        throw new Error(error)
      }

      depositAddress = data.deposit_address

      setToast({
        type: "success",
        message: `✅ Swap created!\nSend ${amount} ${fromToken.symbol} to:\n${depositAddress}`,
      })

      setAmount("") // Clear amount after successful swap
      setQuote(null)

    } catch (err) {
      console.error(err)
      setToast({ type: "error", message: err.message })
      error = err.message // Use the specific error message
      status = 'failed'
    } finally {
      setIsSwapping(false)

      // LOG SWAP STATUS TO DB (ALWAYS)
      logSwapStatus({
        walletAddress: address,
        fromToken,
        toToken,
        amount,
        status,
        error,
        depositAddress,
        estimatedAmount: quote?.estimated_amount
      })
    }
  }

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setAmount("")
    setQuote(null)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 p-4 border-b bg-background flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h2 className="text-lg font-semibold">Swap</h2>

        {/* History Icon with Modal Trigger */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <History />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Swap History</DialogTitle>
            </DialogHeader>
            {/* Pass address to fetch history */}
            <SwapHistoryModal walletAddress={address} />
          </DialogContent>
        </Dialog>

      </header>

      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6 space-y-6">

              {/* FROM */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>From</Label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {fromBalance.toFixed(4)}
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  <Select
                    value={fromToken?.id}
                    onValueChange={val => setFromToken(getAssetConfig(val))}
                  >
                    <SelectTrigger className="w-[200px] font-medium">
                      <div className="flex items-center gap-2">
                        <TokenIcon token={fromToken} />
                        <SelectValue placeholder="Token" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {tokenList.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <TokenIcon token={t} />
                            <span>{t.symbol} ({CHAIN_NAMES[t.requiredChainId]})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="text-right text-lg"
                  />
                  {/* Show icon next to input */}
                  <TokenIcon token={fromToken} size={24} />
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="icon" onClick={handleSwapTokens}>
                  <ArrowDownUp />
                </Button>
              </div>

              {/* TO */}
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={toToken?.id}
                    onValueChange={val => setToToken(getAssetConfig(val))}
                  >
                    <SelectTrigger className="w-[200px] font-medium">
                      <div className="flex items-center gap-2">
                        <TokenIcon token={toToken} />
                        <SelectValue placeholder="Token" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {tokenList.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <TokenIcon token={t} />
                            <span>{t.symbol} ({CHAIN_NAMES[t.requiredChainId]})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="text"
                    readOnly
                    value={
                      isQuoting
                        ? "Fetching..."
                        : quote?.estimated_amount
                          ? Number(quote.estimated_amount).toFixed(6)
                          : "0.0"
                    }
                    className="text-right text-lg"
                  />
                  {/* Show icon next to output */}
                  <TokenIcon token={toToken} size={24} />
                </div>
              </div>

              {/* Quote Details (Min/Max) */}
              {quote?.min_amount && (
                <div className="text-xs text-muted-foreground pt-1">
                  Min Amount: {Number(quote.min_amount).toFixed(4)} {fromToken.symbol}
                </div>
              )}

              {/* SWAP BUTTON */}
              <Button
                className="w-full h-12 font-semibold"
                disabled={isQuoting || !quote || isSwapping || Number(amount) <= 0}
                onClick={handleSwap}
              >
                {(isSwapping || isQuoting) && <Loader2 className="animate-spin mr-2" />}
                {isSwapping ? "Swapping..." : isQuoting ? "Fetching..." : "Swap"}
              </Button>

              {toast && (
                <div
                  className={cn(
                    "text-sm p-3 rounded-md mt-2",
                    toast.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  )}
                  style={{ whiteSpace: "pre-wrap" }} // Ensures line breaks
                >
                  {toast.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}