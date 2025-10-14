'use client'

import React, { useState, useEffect, useRef } from 'react'
import ConnectButton from './ConnectButton'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserProfile from './UserProfile'
import SearchDialog from './SearchDialog'
import { useWallet } from '@solana/wallet-adapter-react'
import useOnlineGameStore from '@/store/useOnlineGame'
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
  Menu,
  X,
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
  { href: '/wager', label: 'Wager Matches (PvP)', icon: DollarSign },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { href: '/streaming', label: 'Streaming', icon: Tv },
  { href: '/transfer', label: 'Transfer SOL', icon: Send, requiresAuth: true },
  { href: '/ai-game', label: 'AI Game (PvAI)', icon: Bot, requiresAuth: true },
];

export default function NavBar() {
  const wallet = useWallet();
  const path = usePathname();
  const { roomId } = useOnlineGameStore();
  const [menuOpen, setMenuOpen] = useState(false);
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
  }, [path]);

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
        <div className="flex items-center gap-3">
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
            <ConnectButton width="w-[145px]" />
          </div>

          {/* Hamburger Menu Toggle - All Screen Sizes */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-900/98 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
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
                  
                  {/* Wallet Connect/Disconnect Button */}
                  <div className="px-4 py-2">
                    <ConnectButton width="w-full" />
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

