"use client";

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';
import { Copy, Check, ChevronDown, Wallet, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

interface WalletButtonProps {
  className?: string;
}

export default function WalletButton({ className = '' }: WalletButtonProps) {
  const wallet = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compact wallet address display
  const compactAddress = wallet.publicKey 
    ? `${wallet.publicKey.toString().slice(0, 4)}...${wallet.publicKey.toString().slice(-4)}`
    : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowWalletSelector(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Copy wallet address
  const copyAddress = async () => {
    if (!wallet.publicKey) return;
    
    try {
      await navigator.clipboard.writeText(wallet.publicKey.toString());
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  // Handle wallet selection
  const handleSelectWallet = async (walletName: string) => {
    try {
      wallet.select(walletName);
      await wallet.connect();
      setShowWalletSelector(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (!wallet.connected || !wallet.publicKey) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Wallet Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-white border border-white connect-button-bg rounded-[7px] flex items-center justify-between gap-1 sm:gap-2
          min-h-[36px] sm:min-h-[42px] 
          text-xs sm:text-sm 
          px-2 sm:px-4
          font-semibold ${className}`}
      >
        <Wallet className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="flex-1 truncate text-[0.65rem] sm:text-sm">{compactAddress}</span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-gray-900 border border-purple-500/30 rounded-lg shadow-2xl z-50 max-h-[80vh] overflow-auto">
          {!showWalletSelector ? (
            <>
              {/* Wallet Address */}
              <div className="p-2 sm:p-3 border-b border-gray-700">
                <p className="text-gray-400 text-[0.65rem] sm:text-xs mb-1">Connected Wallet</p>
                <div className="flex items-center gap-2 bg-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded">
                  <span className="text-white text-xs sm:text-sm font-mono flex-1 truncate">
                    {wallet.publicKey.toString().slice(0, 8)}...{wallet.publicKey.toString().slice(-8)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => setShowWalletSelector(true)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  Change Wallet
                </button>
                
                <button
                  onClick={handleDisconnect}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Wallet Selector */}
              <div className="p-2 sm:p-3 border-b border-gray-700">
                <p className="text-white text-xs sm:text-sm font-semibold">Select a wallet</p>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {wallet.wallets.map((w) => (
                  <button
                    key={w.adapter.name}
                    onClick={() => handleSelectWallet(w.adapter.name)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                  >
                    {w.adapter.icon && (
                      <img 
                        src={w.adapter.icon} 
                        alt={w.adapter.name}
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      />
                    )}
                    <span className="font-medium">{w.adapter.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-700 p-1.5 sm:p-2">
                <button
                  onClick={() => setShowWalletSelector(false)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-gray-400 hover:text-white text-xs sm:text-sm transition-colors"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

