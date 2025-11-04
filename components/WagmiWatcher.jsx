"use client"

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { addUserAction } from '../controllers/wagmiController'

/**
 * Watches wagmi account state and silently registers the user server-side when a wallet connects.
 * Also stores a non-HTTP-only cookie with the wallet address for server endpoints to read if needed.
 */
export default function WagmiWatcher() {
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (!isConnected || !address) return 

    // Set a simple cookie so server endpoints may locate the wallet (not HTTP-only).
    try {
      document.cookie = `walletAddress=${address}; path=/; max-age=${60 * 60 * 24 * 365}`
    } catch (e) {
      // ignore cookie set failures
    }

    // Fire-and-forget - do not block or alter UI.
    (async () => {
      try {
        await addUserAction(address)
      } catch (err) {
        console.error('WagmiWatcher addUserAction failed', err)
      }
    })()
  }, [isConnected, address])

  return null
}
