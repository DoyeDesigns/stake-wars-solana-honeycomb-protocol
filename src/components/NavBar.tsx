'use client'

import React, { useState, useEffect, useRef } from 'react'
import ConnectButton from './ConnectButton'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserProfile from './UserProfile'
import SearchDialog from './SearchDialog'
import { useWallet } from '@solana/wallet-adapter-react'
import useOnlineGameStore from '@/store/useOnlineGame'
import { toast } from 'react-toastify'
import {
  Home,
  Gamepad2,
  Sword,
  Trophy,
  DollarSign,
  BarChart3,
  Tv,
  Send,
  Bot,
  Droplet,
  Menu,
  X,
  Wallet,
  LogOut,
  Copy,
  Check,
  LucideIcon
} from 'lucide-react'

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
}

const navigationLinks: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/lobby', label: 'Lobby', icon: Gamepad2, requiresAuth: true },
  { href: '/mint-character', label: 'Mint Character', icon: Sword, requiresAuth: true },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/wager', label: 'Wager Matches (PvP)', icon: DollarSign, requiresAuth: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { href: '/faucet', label: 'SOL Faucet', icon: Droplet, requiresAuth: true },
  { href: '/streaming', label: 'Streaming', icon: Tv },
  { href: '/transfer', label: 'Transfer CHAKRA', icon: Send, requiresAuth: true },
  { href: '/ai-game', label: 'AI Game (PvAI)', icon: Bot, requiresAuth: true },
];

export default function NavBar() {
  const wallet = useWallet();
  const path = usePathname();
  const { roomId } = useOnlineGameStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter links based on auth status
  const visibleLinks = navigationLinks.filter(link => 
    !link.requiresAuth || wallet.connected
  );

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setShowWalletSelector(false);
  }, [path]);

  // Reset wallet selector when menu closes
  useEffect(() => {
    if (!menuOpen) {
      setShowWalletSelector(false);
    }
  }, [menuOpen]);

  // Copy wallet address to clipboard
  const copyAddress = async () => {
    if (!wallet.publicKey) return;
    
    try {
      await navigator.clipboard.writeText(wallet.publicKey.toString());
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
      <div className="flex justify-between items-center py-4 px-5 lg:px-14">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <img 
              src="/stake-wars-logo.png" 
              alt="stake wars logo" 
              className="size-[80px] lg:size-[100px] hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Search */}
          {path !== `/game-play/${roomId}` && (
            <div className="hidden sm:block">
              <SearchDialog />
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          {path !== `/game-play/${roomId}` && (
            <div className="sm:hidden">
              <SearchDialog />
            </div>
          )}

          {/* Desktop: User Profile (only when connected) */}
          {wallet.connected && (
            <div className="hidden lg:block">
              <UserProfile />
            </div>
          )}

          {/* Desktop: Connect Button (handles both connect and disconnect) */}
          <div className="hidden lg:block">
            <ConnectButton width="w-full" />
          </div>

          {/* Tablet: Connect Button (medium screens) */}
          <div className="hidden sm:block lg:hidden">
            <ConnectButton width="w-full" />
          </div>

          {/* Mobile: Connect Button (small screens) */}
          <div className="block sm:hidden">
            <ConnectButton width="w-fit" />
          </div>

          {/* Hamburger Menu Toggle - All Screen Sizes */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-gray-900/98 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="py-2">
                  {/* Navigation Links */}
                  {visibleLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                          isActive(link.href)
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                  
                  {/* Separator */}
                  <div className="border-t border-purple-500/20 my-2"></div>
                  
                  {/* Wallet Section */}
                  <div className="px-4 py-2">
                    {wallet.connected && wallet.publicKey ? (
                      <>
                        {/* Connected Wallet Display */}
                        <div className="mb-2">
                          <div className="text-gray-400 text-xs mb-1">Connected Wallet</div>
                          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded group">
                            <div className="text-white text-sm font-mono flex-1 truncate">
                              {wallet.publicKey.toString().slice(0, 8)}...{wallet.publicKey.toString().slice(-8)}
                            </div>
                            <button
                              onClick={copyAddress}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                              title="Copy address"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Disconnect Button */}
                        <button
                          onClick={() => {
                            wallet.disconnect();
                            setMenuOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect Wallet
                        </button>
                      </>
                    ) : (
                      <>
                        {!showWalletSelector ? (
                          /* Select Wallet Button */
                          <button
                            onClick={() => setShowWalletSelector(true)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                          >
                            <Wallet className="w-4 h-4" />
                            Select Wallet
                          </button>
                        ) : (
                          /* Wallet Selector */
                          <div>
                            <div className="text-gray-400 text-xs mb-2">Choose a wallet:</div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {wallet.wallets.map((w) => (
                                <button
                                  key={w.adapter.name}
                                  onClick={async () => {
                                    try {
                                      wallet.select(w.adapter.name);
                                      await wallet.connect();
                                      setShowWalletSelector(false);
                                      setMenuOpen(false);
                                    } catch (error) {
                                      console.error('Failed to connect:', error);
                                    }
                                  }}
                                  className="flex items-center gap-3 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                  {w.adapter.icon && (
                                    <img 
                                      src={w.adapter.icon} 
                                      alt={w.adapter.name}
                                      className="w-6 h-6"
                                    />
                                  )}
                                  <span className="font-medium">{w.adapter.name}</span>
                                </button>
                              ))}
                            </div>
                            
                            {/* Back Button */}
                            <button
                              onClick={() => setShowWalletSelector(false)}
                              className="w-full mt-2 px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                            >
                              ← Back
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

