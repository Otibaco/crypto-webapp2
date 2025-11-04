// Shared chain and asset configuration used by Send and Swap pages
import { getAddress } from 'viem'

export const CHAIN_CONFIG = {
  '1': { name: 'Ethereum', symbol: 'ETH', nativeSymbol: 'ETH', chainId: 1, explorer: 'https://etherscan.io/tx' },
  '10': { name: 'Optimism', symbol: 'OP', nativeSymbol: 'ETH', chainId: 10, explorer: 'https://optimistic.etherscan.io/tx' },
  '137': { name: 'Polygon', symbol: 'MATIC', nativeSymbol: 'MATIC', chainId: 137, explorer: 'https://polygonscan.com/tx' },
  '56': { name: 'BNB Chain', symbol: 'BNB', nativeSymbol: 'BNB', chainId: 56, explorer: 'https://bscscan.com/tx' },
  '42161': { name: 'Arbitrum', symbol: 'ARB', nativeSymbol: 'ETH', chainId: 42161, explorer: 'https://arbiscan.io/tx' },
  '8453': { name: 'Base', symbol: 'BASE', nativeSymbol: 'ETH', chainId: 8453, explorer: 'https://basescan.org/tx' },
  '250': { name: 'Fantom', symbol: 'FTM', nativeSymbol: 'FTM', chainId: 250, explorer: 'https://ftmscan.com/tx' },
  '43114': { name: 'Avalanche', symbol: 'AVAX', nativeSymbol: 'AVAX', chainId: 43114, explorer: 'https://snowtrace.io/tx' },
}

export const ASSET_CONFIG_BASE = {
  ETH: { name: 'Ethereum', decimals: 18, logo: 'Ξ', color: 'text-blue-400', isNative: true, addresses: { '1': null } },
  BNB: { name: 'BNB', decimals: 18, logo: 'B', color: 'text-yellow-500', isNative: true, addresses: { '56': null } },
  MATIC: { name: 'Polygon', decimals: 18, logo: 'M', color: 'text-purple-500', isNative: true, addresses: { '137': null } },
  ARB: { name: 'Arbitrum', decimals: 18, logo: 'A', color: 'text-blue-500', isNative: true, addresses: { '42161': null } },
  OP: { name: 'Optimism', decimals: 18, logo: '🔴', color: 'text-red-500', isNative: true, addresses: { '10': null } },
  BASE: { name: 'Base', decimals: 18, logo: 'B', color: 'text-blue-600', isNative: true, addresses: { '8453': null } },
  USDT: {
    name: 'Tether USD', decimals: 6, logo: '$', color: 'text-green-500', isNative: false,
    addresses: {
      '1': '0xdAC17F958D2ee5237c95619A80b8b20e0605a96A',
      '137': '0xc2132d05a96860c6d5c06BC2419f4a643d2C88D2',
      '56': '0x55d398326f99059fF775485246999027B3197955',
    }
  },
  USDC: {
    name: 'USD Coin', decimals: 6, logo: '¤', color: 'text-blue-500', isNative: false,
    addresses: {
      '1': '0xA0b86991c6218b36c1d19D4a2e9eb0cE3606eB48',
      '137': '0x3c499c542cE5E3cc0503E878A1eE970d5dFEaF8c',
      '56': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    }
  }
}

export const ALL_ASSET_IDS = Object.entries(ASSET_CONFIG_BASE).flatMap(([symbol, config]) => Object.keys(config.addresses).map(chainId => `${symbol}-${chainId}`))

export function getAssetConfig(assetId, currentChainId) {
  if (!assetId) return null
  const [symbol, configChainIdStr] = assetId.split('-')
  const config = ASSET_CONFIG_BASE[symbol]
  const assetChainConfig = CHAIN_CONFIG[configChainIdStr]
  if (!config || !assetChainConfig) return null
  const isAvailableOnCurrentChain = String(currentChainId) === configChainIdStr
  const tokenAddress = config.addresses[configChainIdStr]
  const displayLabel = config.isNative ? symbol : `${symbol} (${assetChainConfig.name})`
  const tokenAddressOrNull = tokenAddress ? getAddress(tokenAddress) : null
  const wagmiTokenAddress = config.isNative ? undefined : tokenAddressOrNull
  return {
    id: assetId,
    symbol,
    name: config.name,
    decimals: config.decimals,
    logo: config.logo,
    color: config.color,
    isNative: config.isNative,
    chainName: assetChainConfig.name,
    requiredChainId: assetChainConfig.chainId,
    address: tokenAddressOrNull,
    wagmiTokenAddress,
    isAvailableOnCurrentChain,
    displayLabel,
  }
}

export default {
  CHAIN_CONFIG,
  ASSET_CONFIG_BASE,
  ALL_ASSET_IDS,
  getAssetConfig,
}

