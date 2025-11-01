import React, { createContext, useContext, useState, useEffect } from 'react';
import blockchainService from '../services/blockchainService';
import toast from 'react-hot-toast';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
    setupEventListeners();
    
    return () => {
      removeEventListeners();
    };
  }, []);

  useEffect(() => {
    if (account) {
      fetchBalance();
    }
  }, [account]);

  const checkIfWalletIsConnected = async () => {
    if (!blockchainService.isMetaMaskInstalled()) {
      return;
    }

    try {
      // If the user explicitly disconnected, don't auto-reconnect on page load/refresh
      const disconnectedByUser = localStorage.getItem('wallet:disconnectedByUser');
      if (disconnectedByUser) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        // Connect silently (will prompt if needed)
        await connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!blockchainService.isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to continue');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // Clear any 'disconnected by user' flag when the user intentionally connects
      try {
        localStorage.removeItem('wallet:disconnectedByUser');
      } catch (e) {
        /* ignore storage errors */
      }
      const { address, chainId: connectedChainId } = await blockchainService.connectWallet();
      
      setAccount(address);
      setChainId(connectedChainId);
      setIsConnected(true);
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setIsConnected(false);
    // Mark that the user intentionally disconnected so we don't auto-reconnect on refresh
    try {
      localStorage.setItem('wallet:disconnectedByUser', '1');
    } catch (e) {
      /* ignore storage errors */
    }
    toast.success('Wallet disconnected');
  };

  const fetchBalance = async () => {
    try {
      const bal = await blockchainService.getBalance(account);
      setBalance(bal);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const setupEventListeners = () => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
  };

  const removeEventListeners = () => {
    if (!window.ethereum) return;

    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected via wallet UI or switched to no account
      // Treat this as an intentional disconnect to avoid auto-reconnect on refresh
      try {
        localStorage.setItem('wallet:disconnectedByUser', '1');
      } catch (e) {}
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      toast.info('Account changed');
    }
  };

  const handleChainChanged = (newChainId) => {
    const chainIdDecimal = parseInt(newChainId, 16);
    setChainId(chainIdDecimal);
    toast.info('Network changed');
    window.location.reload();
  };

  const value = {
    account,
    chainId,
    balance,
    isConnecting,
    isConnected,
    connectWallet,
    disconnectWallet,
    refreshBalance: fetchBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
