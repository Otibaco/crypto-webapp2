"use client";

import React, { useState } from "react";
import { Copy, Check, Search, QrCode, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { QRCodeCanvas } from "qrcode.react";

export function ReceivePage() {
  const { address } = useAccount();
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  const walletAddress = address || "0x50154eFa7A9238dA26"; // fallback sample

  const networks = [
    {
      name: "Ethereum",
      logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    },
    {
      name: "BNB Chain",
      logo: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    },
    {
      name: "Polygon",
      logo: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
    },
    {
      name: "Base",
      // logo: "https://cryptologos.cc/logos/base-base-logo.png", failed to open
      logo: "/base-logo.png",
    },
    {
      name: "Arbitrum",
      // logo: "https://assets.coingecko.com/coins/images/16547/large/arbitrum.png", failed to open
      logo: "/arbitrum-arb-logo.png",
    },
    {
      name: "Optimism",
      logo: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
    },
    {
      name: "Linea",
      logo: "https://cryptologos.cc/logos/linea-linea-logo.png", 
      // logo: "/linea-logo.png",
    },
    {
      name: "Avalanche",
      logo: "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png",
    },
    // USDT and USDC group
    {
      name: "USDT (Ethereum)",
      logo: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
    },
    {
      name: "USDT (BNB Chain)",
      logo: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
    },
    {
      name: "USDT (Polygon)",
      logo: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
    },
    {
      name: "USDC (Ethereum)",
      logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    },
    {
      name: "USDC (BNB Chain)",
      logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    },
    {
      name: "USDC (Polygon)",
      logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    },
  ];

  const filteredNetworks = networks.filter((net) =>
    net.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = async (index) => {
    await navigator.clipboard.writeText(walletAddress);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Receiving Address</h1>
        <p className="text-muted-foreground">
          Same address works across all supported EVM networks.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Search networks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-3 text-muted-foreground h-5 w-5" />
      </div>

      {/* Grid of networks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNetworks.map((net, index) => (
          <Card
            key={index}
            className="p-4 flex items-center justify-between hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <img
                src={net.logo}
                alt={net.name}
                className="w-10 h-10 rounded-full border"
              />
              <div>
                <h2 className="font-semibold text-foreground">{net.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Copy Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(index)}
                className="hover:bg-accent"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>

              {/* QR Code Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedNetwork(net)}
                className="hover:bg-accent"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* QR Code Modal */}
      <Dialog open={!!selectedNetwork} onOpenChange={() => setSelectedNetwork(null)}>
        <DialogContent className="max-w-sm mx-auto p-6">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              Receive {selectedNetwork?.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedNetwork(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 mt-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeCanvas
                value={walletAddress}
                size={180}
                level="H"
                fgColor="#000000"
              />
            </div>
            <p className="text-center text-sm break-all font-mono">
              {walletAddress}
            </p>
            <Button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="w-full"
            >
              Copy Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
