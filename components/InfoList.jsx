'use client'

import React from 'react';
import { useEffect } from 'react'
import {
    useAppKitState,
    useAppKitTheme,
    useAppKitEvents,
    useAppKitAccount,
    useWalletInfo
} from '@reown/appkit/react'
import { useClientMounted } from "../hooks/useClientMount";

export const InfoList = () => {
    const kitTheme = useAppKitTheme();
    const state = useAppKitState();
    const { address, caipAddress, isConnected, embeddedWalletInfo } = useAppKitAccount();
    const events = useAppKitEvents()
    const walletInfo = useWalletInfo()
    const mounted = useClientMounted();

    useEffect(() => {
        console.log("Events: ", events);
    }, [events]);

    return !mounted ? null : (
        <>
            <div>
                <h2>useAppKit</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    Address: {address}<br />
                    caip Address: {caipAddress}<br />
                    Connected: {isConnected.toString()}<br />
                    Account Type: {embeddedWalletInfo?.accountType}<br />
                    {embeddedWalletInfo?.user?.email && (`Email: ${embeddedWalletInfo?.user?.email}\n`)}
                    {embeddedWalletInfo?.user?.username && (`Username: ${embeddedWalletInfo?.user?.username}\n`)}
                    {embeddedWalletInfo?.authProvider && (`Provider: ${embeddedWalletInfo?.authProvider}\n`)}
                </div>
            </div>

            <div>
                <h2>Theme</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    Theme: {kitTheme.themeMode}<br />
                </div>
            </div>

            <div>
                <h2>State</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    Selected Network ID: {state.selectedNetworkId?.toString()}<br />
                    loading: {state.loading.toString()}<br />
                    open: {state.open.toString()}<br />
                </div>
            </div>

            <div>
                <h2>WalletInfo</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    Name: {walletInfo.walletInfo?.name?.toString()}<br />
                </div>
            </div>
        </>
    )
}
