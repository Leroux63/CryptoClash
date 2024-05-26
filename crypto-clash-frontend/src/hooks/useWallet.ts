import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletContext {
    isConnected: boolean;
    userAddress: string;
    provider: ethers.BrowserProvider | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const useWallet = (): WalletContext => {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [userAddress, setUserAddress] = useState<string>('');
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        if (window.ethereum) {
            const customProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(customProvider);
        }
    }, []);

    const connectWallet = async () => {
        if (!provider) return;

        try {
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setUserAddress(address);
            setIsConnected(true);
        } catch (error) {
            console.error('Error connecting to the wallet:', error);
            setIsConnected(false);
        }
    };

    const disconnectWallet = () => {
        setUserAddress('');
        setIsConnected(false);
        if (window.ethereum && window.ethereum.removeListener) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    };

    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            setUserAddress('');
            setIsConnected(false);
        } else {
            // Utilisateur changé
            setUserAddress(accounts[0]);
        }
    };

    useEffect(() => {
        if (provider && window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, [provider]);

    return {
        isConnected,
        userAddress,
        provider,
        connectWallet,
        disconnectWallet,
    };
};

export default useWallet;
