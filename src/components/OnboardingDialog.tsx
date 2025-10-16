"use client";

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, usePathname } from 'next/navigation';
import { client } from '@/utils/constants/client';
import { characterAdressess } from '@/lib/charater-address';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Droplet, Sword, Check, Loader2, UserPlus } from 'lucide-react';
import { useUserStore } from '@/store/useUser';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://rpc.test.honeycombprotocol.com";
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

export default function OnboardingDialog() {
  const wallet = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSOL, setHasSOL] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [checking, setChecking] = useState(false);
  const [solBalance, setSolBalance] = useState(0);

  // Calculate progress - Order: SOL -> Profile -> Character
  const stepsCompleted = (hasSOL ? 1 : 0) + (hasProfile ? 1 : 0) + (hasCharacter ? 1 : 0);
  const totalSteps = 3;
  const isOnboardingComplete = hasSOL && hasProfile && hasCharacter;

  const checkUserStatus = useCallback(async () => {
    if (!wallet.publicKey || !wallet.connected) {
      setIsOpen(false);
      return;
    }

    // Don't show on task pages (where user is actually doing the tasks)
    // But allow it to show after leaving those pages
    if (pathname === '/faucet' || pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    // Mark that we left a task page (for showing dialog when returning)
    const wasOnTaskPage = sessionStorage.getItem('was-on-task-page');
    if (wasOnTaskPage) {
      sessionStorage.removeItem('was-on-task-page');
      // Force check immediately when returning from task page
    }

    setChecking(true);

    try {
      // Check if user has profile
      let userHasProfile = false;
      if (user && user.id) {
        try {
          const { profile } = await client.findProfiles({
            userIds: [user.id],
            projects: [PROJECT_ADDRESS],
            includeProof: true,
          });
          userHasProfile = profile && profile.length > 0;
        } catch {
          userHasProfile = false;
        }
      }
      setHasProfile(userHasProfile);

      // Check SOL balance
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const balanceLamports = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
      setSolBalance(balanceSOL);
      setHasSOL(balanceSOL > 0);

      // Check if user has characters
      const treeAddresses = Array.from(
        new Set(characterAdressess.map((c) => c.treeAdress))
      );
      const { character } = await client.findCharacters({
        trees: treeAddresses,
        wallets: [wallet.publicKey.toString()],
      });

      const userHasCharacter = character && character.length > 0;
      setHasCharacter(userHasCharacter);

      // Check if onboarding is permanently complete for THIS wallet
      const walletKey = wallet.publicKey.toString();
      const onboardingCompleteKey = `onboarding-complete-${walletKey}`;
      const onboardingComplete = sessionStorage.getItem(onboardingCompleteKey);
      
      // Mark as complete if user has SOL, profile, and character
      if (balanceSOL > 0 && userHasProfile && userHasCharacter) {
        sessionStorage.setItem(onboardingCompleteKey, 'true');
        setIsOpen(false);
        return;
      }

      // If already marked complete for this wallet, never show again
      if (onboardingComplete) {
        setIsOpen(false);
        return;
      }

      // Show dialog if user is missing SOL OR profile OR character
      const shouldShow = balanceSOL === 0 || !userHasProfile || !userHasCharacter;
      setIsOpen(shouldShow);

    } catch {
      // Silent error handling
    } finally {
      setChecking(false);
    }
  }, [wallet.publicKey, wallet.connected, pathname, user]);

  // Mark when on task pages
  useEffect(() => {
    if (pathname === '/faucet' || pathname === '/mint-character') {
      sessionStorage.setItem('was-on-task-page', 'true');
    }
  }, [pathname]);

  // Check status immediately when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      // Clean up old generic onboarding key (migration)
      const oldKey = sessionStorage.getItem('onboarding-complete');
      if (oldKey) {
        sessionStorage.removeItem('onboarding-complete');
      }
      
      // Reset onboarding state for new wallet
      setIsOpen(false);
      setHasProfile(false);
      setHasSOL(false);
      setHasCharacter(false);
      
      // Immediate check for new wallet (delay to ensure wallet is fully initialized)
      const timer = setTimeout(() => {
        checkUserStatus();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      setHasProfile(false);
      setHasSOL(false);
      setHasCharacter(false);
    }
  }, [wallet.publicKey?.toString()]);

  // Periodic check and page change detection
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      checkUserStatus();
      
      // Re-check every 60 seconds to catch updates (longer interval to avoid disrupting user actions)
      const interval = setInterval(checkUserStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [pathname, user, checkUserStatus, wallet.connected, wallet.publicKey]);

  if (!wallet.connected) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Allow temporary closing even if not complete
        setIsOpen(open);
        // Dialog will reappear on next check if not complete
      }}
    >
      <DialogContent 
        className={`bg-gray-900 border-2 max-w-lg overflow-auto max-h-[90vh] ${
          isOnboardingComplete 
            ? 'border-green-500' 
            : 'border-purple-500'
        }`}
        showCloseButton={true}
      >
        <DialogTitle className="text-2xl font-bold text-white text-center mb-2">
          🎮 Getting Started
        </DialogTitle>
        
        {/* Important Notice */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-3">
          <p className="text-blue-300 text-xs text-center">
            ⚠️ <span className="font-bold">Important:</span> You need Honeycomb SOL first to create your account and perform any transactions on the network.
          </p>
        </div>
        
        {!isOnboardingComplete && (
          <p className="text-gray-400 text-xs text-center mb-4">
            You can close this dialog to complete the steps. It will reappear until all steps are done.
          </p>
        )}

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Your Progress</span>
            <span className={`text-lg font-bold ${
              isOnboardingComplete ? 'text-green-400' : 'text-purple-400'
            }`}>
              {stepsCompleted}/{totalSteps}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isOnboardingComplete 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${(stepsCompleted / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1: Get SOL - ALWAYS FIRST */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasSOL 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-gray-800 border-purple-500'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasSOL ? 'text-green-400' : 'text-purple-400'
              }`}>
                {hasSOL ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-500">
                    <Droplet className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 1: Get Honeycomb SOL
                  {hasSOL && <span className="text-green-400 text-sm">✓ Complete</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasSOL 
                    ? `You have ${solBalance.toFixed(4)} SOL for transaction fees` 
                    : "You need SOL to create your account and perform any transactions on Honeycomb"
                  }
                </p>
                
                {!hasSOL && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/faucet');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Droplet className="w-4 h-4" />
                    Get Free SOL from Faucet
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Create Account */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasProfile 
              ? 'bg-green-900/20 border-green-500' 
              : hasSOL
                ? 'bg-gray-800 border-purple-500'
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasProfile ? 'text-green-400' : hasSOL ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasProfile ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasSOL 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <UserPlus className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 2: Create Account
                  {hasProfile && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {!hasSOL && <span className="text-gray-500 text-sm">(Get SOL first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasProfile 
                    ? "Your account is ready!" 
                    : hasSOL
                      ? "Click the Connect button in the navigation bar to create your user and profile"
                      : "Get SOL first before creating your account"
                  }
                </p>
                
                {!hasProfile && hasSOL && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                    <p className="text-blue-300 text-xs">
                      👆 Look for the <span className="font-bold">&quot;Create User&quot;</span> button in the top navigation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Mint Character */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasCharacter 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile && hasSOL 
                ? 'bg-gray-800 border-purple-500' 
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasCharacter ? 'text-green-400' : hasProfile && hasSOL ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasCharacter ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasProfile && hasSOL 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <Sword className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 3: Mint Character
                  {hasCharacter && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {(!hasSOL || !hasProfile) && <span className="text-gray-500 text-sm">(Complete Steps 1 & 2 first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasCharacter 
                    ? "You have a character and can start playing!" 
                    : hasSOL && hasProfile
                      ? "Create your first character to start playing (FREE!)"
                      : !hasSOL
                        ? "Get SOL and create your account first"
                        : "Create your account first"
                  }
                </p>
                
                {!hasCharacter && hasSOL && hasProfile && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/mint-character');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Sword className="w-4 h-4" />
                    Mint FREE Character
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Button
            onClick={checkUserStatus}
            disabled={checking}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                🔄 Refresh Status
              </>
            )}
          </Button>
          <p className="text-gray-500 text-xs text-center mt-2">
            Complete all 3 steps to start playing!
          </p>
        </div>

        {/* Close hint */}
        {isOnboardingComplete && (
          <p className="text-green-400 text-sm text-center mt-2">
            ✅ All done! Close this to start playing.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

