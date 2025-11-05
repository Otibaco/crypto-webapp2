"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { ScrollArea } from "./ui/scroll-area" // Assuming you have a ScrollArea component
import { Badge } from "./ui/badge" // Assuming you have a Badge component
import { Loader2 } from 'lucide-react'

// Helper function to format the long token string
const formatTokenPair = (token) => {
    if (!token) return 'Unknown'
    const parts = token.split('->')
    return parts.length === 2 ? `${parts[0]} → ${parts[1]}` : token
}

// Component to render individual history items
const HistoryItem = ({ item }) => {
    const tokenPair = formatTokenPair(item.token)
    const isSuccess = item.status === 'success'
    const isFailed = item.status === 'failed'

    return (
        <div className="border-b p-3 last:border-b-0">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">Swap: {tokenPair}</h4>
                <Badge className={
                    isSuccess ? "bg-green-500 hover:bg-green-600" :
                        isFailed ? "bg-red-500 hover:bg-red-600" :
                            "bg-yellow-500 hover:bg-yellow-600"
                }>{item.status.toUpperCase()}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
                Amount: {item.amount} {tokenPair.split(' → ')[0]}
            </p>
            {item.meta?.estimatedAmount && (
                <p className="text-xs text-muted-foreground">
                    Est. Rec: {Number(item.meta.estimatedAmount).toFixed(6)} {tokenPair.split(' → ')[1]}
                </p>
            )}
            {isFailed && item.meta?.error && (
                <p className="text-xs text-red-500 mt-1">Error: {item.meta.error}</p>
            )}
        </div>
    )
}

export default function SwapHistoryModal({ walletAddress }) {
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // API to fetch only 'swap' type transactions
    const fetchHistory = useCallback(async () => {
        if (!walletAddress) return setHistory([])

        setIsLoading(true)
        try {
            const res = await fetch('/api/transactions/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, type: 'swap' })
            })
            const data = await res.json()
            setHistory(data.items || [])
        } catch (e) {
            console.error("Failed to fetch swap history:", e)
            setHistory([])
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin mr-2" /> Loading History...
            </div>
        )
    }

    if (history.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No swap transactions found.</div>
    }

    return (
        <ScrollArea className="h-[300px] w-full rounded-md border">
            {history.map(item => (
                <HistoryItem key={item._id} item={item} />
            ))}
        </ScrollArea>
    )
}