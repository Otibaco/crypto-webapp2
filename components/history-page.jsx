"use client"

import { useState, useMemo, useEffect } from "react"
// Assuming these UI components are defined elsewhere (e.g., shadcn/ui)
import { Card } from "../components/ui/card"
import { ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, ExternalLink, Search, Copy, CheckCircle2 } from "lucide-react"
import { Input } from "../components/ui/input"
import Link from "next/link"
import { cn } from "../lib/utils"
import { format } from 'date-fns';
import { Button } from "../components/ui/button";
import { getTransactionsAction } from '../lib/actions'

// Helper function to format value from Moralis (which is in WEI)
const formatWeiValue = (value, chain) => {
    // Moralis transaction value is native coin amount in WEI.
    const decimal = 18; // Assume 18 decimals for most EVM coins (ETH, BNB, MATIC)
    
    try {
        // Use BigInt for high precision handling
        const valueBigInt = BigInt(value || '0');
        const divisor = BigInt(10) ** BigInt(decimal);
        
        const integerPart = valueBigInt / divisor;
        const fractionPart = valueBigInt % divisor;
        
        // Pad the fractional part to 4 decimals for display
        const fractionString = fractionPart.toString().padStart(decimal, '0').slice(0, 4);
        
        return `${integerPart}.${fractionString} ${chain.toUpperCase()}`;
    } catch (e) {
        // Fallback for environments that don't fully support BigInt in arithmetic
        const amount = Number(value || '0') / (10 ** 18);
        return `${amount.toFixed(4)} ${chain.toUpperCase()}`;
    }
};

// Chain and explorer configuration
const CHAIN_INFO = {
    'eth': { name: 'Ethereum', explorer: 'https://etherscan.io/tx/', color: 'text-blue-400', folder: 'ethereum' },
    'polygon': { name: 'Polygon', explorer: 'https://polygonscan.com/tx/', color: 'text-purple-500', folder: 'polygon' },
    'bsc': { name: 'BNB Chain', explorer: 'https://bscscan.com/tx/', color: 'text-yellow-500', folder: 'smartchain' },
    'arbitrum': { name: 'Arbitrum', explorer: 'https://arbiscan.io/tx/', color: 'text-blue-500', folder: 'arbitrum' },
    'base': { name: 'Base', explorer: 'https://basescan.org/tx/', color: 'text-blue-600', folder: 'base' },
    'optimism': { name: 'Optimism', explorer: 'https://optimistic.etherscan.io/tx/', color: 'text-red-500', folder: 'optimism' },
};

// Helper function to get the block explorer link
const getExplorerLink = (hash, chain) => {
    const chainData = CHAIN_INFO[chain] || CHAIN_INFO['eth'];
    return `${chainData.explorer}${hash}`;
};

// Helper to get Trust Wallet asset logo URL
const getAssetLogoUrl = (token, chain) => {
    if (!token || !chain) return null;
    const chainData = CHAIN_INFO[chain] || CHAIN_INFO['eth'];
    const base = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";
    return token.toLowerCase() === chainData.folder 
        ? `${base}/${chainData.folder}/info/logo.png`
        : `${base}/${chainData.folder}/assets/${token}/logo.png`;
};

// IMPORTANT: This component now accepts the walletAddress prop
export function HistoryPage({ initialTransactions, walletAddress }) {
    const [activeFilter, setActiveFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [transactions, setTransactions] = useState(initialTransactions || [])
    const [copiedHash, setCopiedHash] = useState("")

    // Fetch persisted transactions for this wallet from our DB (poll for near real-time updates)
    useEffect(() => {
        if (!walletAddress) return
        let mounted = true

        const fetchOnce = async () => {
            try {
                const res = await fetch('/api/transactions/get', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress })
                })
                const data = await res.json()
                const items = data?.items || []
                if (mounted) setTransactions(items)
            } catch (err) {
                console.error('Failed to fetch persisted transactions', err)
            }
        }

        // initial fetch + polling every 10s for near-real-time UI
        fetchOnce()
        const iv = setInterval(fetchOnce, 10000)
        return () => { mounted = false; clearInterval(iv) }
    }, [walletAddress])
    
    // Build enriched transactions from our persisted DB records
    const enrichedTransactions = useMemo(() => {
        if (!transactions || !walletAddress) return [];

        const walletLower = walletAddress.toLowerCase();

        return transactions.map(tx => {
            // tx is expected to follow the Transaction model shape: { user, txHash, type, token, amount, status, meta, createdAt }
            const type = tx.type || (tx.from?.toLowerCase?.() === walletLower ? 'send' : 'receive')
            const status = tx.status || 'pending'

            // amount may be stored raw; use meta fallbacks if available
            const amountRaw = tx.amount || tx.meta?.amount || '0'
            const tokenSymbol = tx.token || tx.meta?.token || tx.meta?.symbol || ''

            // Try to determine counterparty and USD value
            const counterparty = tx.meta?.counterparty || tx.meta?.to || tx.meta?.toAddress || tx.to || tx.address || ''
            const usdValue = tx.meta?.usdValue || tx.meta?.valueUSD || 0

            const created = tx.createdAt ? new Date(tx.createdAt) : (tx.updatedAt ? new Date(tx.updatedAt) : null)
            const date = created ? format(created, 'MMM dd, yyyy') : 'N/A'
            const time = created ? format(created, 'h:mm a') : 'N/A'

            // Explorer chain key if provided in meta e.g. 'eth','polygon'
            const explorerChain = tx.meta?.chain || tx.meta?.chainKey || tx.meta?.chainId

            return {
                id: tx._id || tx.txHash || tx.id,
                type,
                asset: tokenSymbol || (tx.meta?.chain || '').toUpperCase(),
                amount: amountRaw,
                value: usdValue,
                address: counterparty || '',
                date,
                time,
                status,
                hash: tx.txHash || tx.hash,
                chain: explorerChain || tx.meta?.chain || null,
                raw: tx,
            }
        }).sort((a,b) => {
            // sort newest first by createdAt if available
            const ta = new Date(a.raw?.createdAt || a.raw?.updatedAt || Date.now())
            const tb = new Date(b.raw?.createdAt || b.raw?.updatedAt || Date.now())
            return tb - ta
        })
    }, [transactions, walletAddress]);


    const filteredTransactions = enrichedTransactions.filter((tx) => {
        // Map 'sent' to 'send' and 'received' to 'receive' for filter matching
        const matchesFilter = activeFilter === "all" 
            || (activeFilter === "sent" && tx.type === "send")
            || (activeFilter === "received" && tx.type === "receive")
        
        const matchesSearch =
            searchQuery === "" ||
            tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.hash.toLowerCase().includes(searchQuery.toLowerCase())
        
        return matchesFilter && matchesSearch
    })

    // ... (getTransactionIcon and getStatusColor functions remain the same)
    const getTransactionIcon = (type, status) => {
        const iconClass = cn(
            "h-5 w-5",
            (status === "success" || status === "completed") && type === "send" && "text-red-400",
            (status === "success" || status === "completed") && type === "receive" && "text-green-400",
            (status === "success" || status === "completed") && type === "swap" && "text-blue-400",
            status === "pending" && "text-yellow-400",
            status === "failed" && "text-red-500",
        )

        switch (type) {
            case "send":
                return <ArrowUp className={iconClass} />
            case "receive":
                return <ArrowDown className={iconClass} />
            case "swap":
                return <ArrowUpDown className={iconClass} />
            default:
                return <ArrowUp className={iconClass} />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "success":
            case "completed":
                return "text-green-400"
            case "pending":
                return "text-yellow-400"
            case "failed":
                return "text-red-400"
            default:
                return "text-muted-foreground"
        }
    }


    return (
        <div className="p-4 space-y-6 max-w-6xl mx-auto">
            {/* Header and Search/Filter UI remain the same */}
            {/* ... (Header) */}
            <div className="flex items-center gap-4 pt-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold animate-in slide-in-from-left duration-300">Transaction History</h1>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                 {[
                    { label: "All", value: "all" },
                    { label: "Sent", value: "sent" },
                    { label: "Received", value: "received" },
                 ].map((option) => (
                    <Button
                        key={option.value}
                        onClick={() => setActiveFilter(option.value)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 relative transition-all duration-200",
                            activeFilter === option.value && "bg-background text-foreground shadow-sm",
                        )}
                    >
                        {option.label}
                        {activeFilter === option.value && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 gradient-purple-blue rounded-full" />
                        )}
                    </Button>
                ))}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTransactions.length === 0 ? (
                    <Card className="p-8 text-center md:col-span-2">
                        <p className="text-muted-foreground">No transactions found matching your filter or search.</p>
                    </Card>
                ) : (
                    filteredTransactions.map((transaction, index) => (
                        <Card
                            key={transaction.id}
                            className="p-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in slide-in-from-left"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <a 
                                href={getExplorerLink(transaction.hash, transaction.chain)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center glow-purple">
                                        {getTransactionIcon(transaction.type, transaction.status)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                {/* Token Logo */}
                                                {transaction.raw?.meta?.tokenAddress && transaction.raw?.meta?.chain && (
                                                    <img
                                                        src={getAssetLogoUrl(transaction.raw.meta.tokenAddress, transaction.raw.meta.chain)}
                                                        onError={e => { e.currentTarget.style.display = 'none' }}
                                                        alt={transaction.asset}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                )}
                                                <p className="font-semibold capitalize">
                                                    {transaction.type === "swap"
                                                        ? `Swap ${transaction.asset} → ${transaction.toAsset}`
                                                        : `${transaction.type} ${transaction.asset}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={cn("text-xs capitalize px-2 py-0.5 rounded-full", 
                                                    transaction.status === "success" ? "bg-green-500/10 text-green-500" :
                                                    transaction.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                                                    transaction.status === "failed" ? "bg-red-500/10 text-red-500" :
                                                    "bg-muted text-muted-foreground"
                                                )}>
                                                    {transaction.status}
                                                </span>
                                                {/* Chain Badge */}
                                                {transaction.chain && (
                                                    <span className={cn("text-xs px-2 py-0.5 rounded-full bg-secondary",
                                                        CHAIN_INFO[transaction.chain]?.color || 'text-muted-foreground'
                                                    )}>
                                                        {CHAIN_INFO[transaction.chain]?.name || transaction.chain}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Display only the first 6 and last 4 chars of the address for cleaner UI */}
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.type === "send" ? "To:" : "From:"} {transaction.address ? `${transaction.address.slice(0, 6)}...${transaction.address.slice(-4)}` : '-'}
                                            </p>
                                            {/* Copy Hash Button */}
                                            {transaction.hash && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="h-5 w-5 rounded-full hover:bg-secondary"
                                                    onClick={async () => {
                                                        await navigator.clipboard.writeText(transaction.hash)
                                                        setCopiedHash(transaction.hash)
                                                        setTimeout(() => setCopiedHash(""), 2000)
                                                    }}
                                                >
                                                    {copiedHash === transaction.hash ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.date} • {transaction.time}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={cn(
                                            "font-semibold",
                                            transaction.type === "sent" && "text-red-400",
                                            transaction.type === "received" && "text-green-400",
                                        )}
                                    >
                                        {transaction.type === "sent" ? '-' : transaction.type === "received" ? '+' : ''}
                                        {transaction.amount} {transaction.asset || ''}
                                    </p>
                                </div>
                            </a>
                        </Card>
                    ))
                )}
            </div>

            {/* Load More - Can be updated later to fetch the next page of Moralis data */}
            {filteredTransactions.length > 0 && (
                <Button variant="outline" className="w-full bg-transparent">
                    Load More Transactions
                </Button>
            )}
        </div>
    )
}
