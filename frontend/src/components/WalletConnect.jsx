import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Button, Badge } from './UI';
import { Wallet, LogOut } from 'lucide-react';
import { formatAddress } from '../utils/helpers';

const WalletConnect = () => {
  const { account, balance, isConnecting, isConnected, connectWallet, disconnectWallet } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        loading={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end">
        <span className="text-xs text-gray-500">Balance</span>
        <span className="text-sm font-semibold text-gray-900">
          {parseFloat(balance).toFixed(4)} ETH
        </span>
      </div>
      
      <Badge variant="bg-primary-100 text-primary-800 border-primary-200">
        <Wallet className="h-3 w-3 mr-1" />
        {formatAddress(account)}
      </Badge>
      
      <Button
        onClick={disconnectWallet}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WalletConnect;
