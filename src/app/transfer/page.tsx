"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { client } from '@/utils/constants/client';
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";

const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;
const CHAKRA_RESOURCE_TREE_ADDRESS = process.env.CHAKRA_RESOURCE_TREE_ADDRESS as string;

export default function TransferPage() {
  const router = useRouter();
  const wallet = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch CHAKRA balance
  const fetchBalance = async (showLoading = false) => {
    if (!wallet.publicKey) return;
    
    if (showLoading) setRefreshing(true);
    
    try {
      const resources = await client.findHoldings({
        holders: [wallet.publicKey.toString()],
        trees: [CHAKRA_RESOURCE_TREE_ADDRESS]
      });

      const chakraBalance = Number(resources.holdings[0]?.balance || 0);
      setBalance(chakraBalance);
      
      if (showLoading) {
        toast.success('Balance refreshed!');
      }
    } catch (error) {
      console.error('Failed to fetch CHAKRA balance:', error);
      toast.error('Failed to fetch CHAKRA balance');
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  // Fetch balance on mount and wallet change
  useEffect(() => {
    if (wallet.connected) {
      fetchBalance();
    }
  }, [wallet.connected, wallet.publicKey]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      toast.error('Wallet not properly connected');
      return;
    }

    // Validate recipient address
    try {
      new PublicKey(recipient);
    } catch (error) {
      toast.error('Invalid recipient address');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount');
      return;
    }

    if (!Number.isInteger(amountNum)) {
      toast.error('CHAKRA amount must be a whole number');
      return;
    }

    if (balance !== null && amountNum > balance) {
      toast.error(`Insufficient balance. You have ${balance} CHK`);
      return;
    }

    setLoading(true);

    try {
      toast.info('💸 Creating transfer transaction...');

      console.log('Creating CHAKRA transfer transaction...', {
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: wallet.publicKey.toString(),
        recipient: recipient,
        amount: amountNum
      });

      // Create CHAKRA transfer transaction (CLIENT-SIDE)
      const { createTransferResourceTransaction: txResponse } = 
        await client.createTransferResourceTransaction({
          resource: CHAKRA_RESOURCE_ADDRESS,
          owner: wallet.publicKey.toString(),
          recipient: recipient,
          amount: amountNum.toString(),
          // No payer = owner pays gas
        });

      toast.info('📝 Please approve the transaction in your wallet');

      // User signs and sends transfer (CLIENT-SIDE)
      const response = await sendClientTransactions(
        client, 
        wallet, 
        txResponse
      );
      
      console.log('CHAKRA transfer response:', response);

      // Check if transfer succeeded
      if (!response || !response[0]?.responses || response[0].responses[0].status !== "Success") {
        const error = response?.[0]?.responses?.[0]?.error || 'Unknown error';
        throw new Error(error);
      }

      const signature = response[0].responses[0].signature;
      console.log('✅ Transfer successful! Signature:', signature);

      toast.success(`Successfully sent ${amountNum} CHK!`, {
        autoClose: 5000,
      });

      // Show transaction link
      if (signature) {
        toast.info(
          <div>
            <a 
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Explorer
            </a>
          </div>,
          { autoClose: 10000 }
        );
      }

      // Reset form
      setRecipient('');
      setAmount('');
      
      // Refresh balance
      await fetchBalance();

    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to transfer CHAKRA
          </p>
          <Button
            onClick={() => router.push("/lobby")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              💸 Transfer CHAKRA
              <img src="/chakra_coin.svg" alt="chakra" className="w-10 h-10" />
            </h1>
            <p className="text-gray-300">
              Send CHAKRA tokens to another player
            </p>
          </div>
          <Button
            onClick={() => router.push("/lobby")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Back to Lobby
          </Button>
        </div>

        {/* Balance Display */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border-2 border-blue-500/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Wallet</p>
              <p className="text-white font-mono text-sm">
                {wallet.publicKey?.toString().slice(0, 8)}...{wallet.publicKey?.toString().slice(-8)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-white text-2xl font-bold flex items-center gap-2 justify-end">
                {balance !== null ? `${balance} CHK` : 'Loading...'}
                {balance !== null && (
                  <img src="/chakra_coin.svg" alt="chakra" className="w-6 h-6" />
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={() => fetchBalance(true)}
            disabled={refreshing}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            size="sm"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Balance
              </>
            )}
          </Button>
        </div>

        {/* Transfer Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            Send CHAKRA
            <img src="/chakra_coin.svg" alt="chakra" className="w-7 h-7" />
          </h2>
          
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Recipient Address */}
            <div>
              <Label className="text-white text-lg mb-2 block">
                Recipient Wallet Address *
              </Label>
              <Input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter recipient's Solana wallet address"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 font-mono"
                required
              />
              <p className="text-gray-400 text-sm mt-2">
                Enter the wallet address of the player you want to send CHAKRA to
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-white text-lg mb-2 block">
                Amount (CHK) *
              </Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 text-lg"
                required
              />
              <div className="flex justify-between mt-2">
                <p className="text-gray-400 text-sm">
                  Minimum: 1 CHK (whole numbers only)
                </p>
                {balance !== null && (
                  <button
                    type="button"
                    onClick={() => setAmount(balance.toString())}
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                  >
                    Send All ({balance} CHK)
                  </button>
                )}
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-white text-sm mb-2 block">Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={balance !== null && amt > balance}
                  >
                    {amt}
                    <img src="/chakra_coin.svg" alt="CHK" className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Summary */}
            {recipient && amount && (
              <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-semibold mb-3">Transaction Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">From:</span>
                    <span className="text-white font-mono">
                      {wallet.publicKey?.toString().slice(0, 8)}...{wallet.publicKey?.toString().slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">To:</span>
                    <span className="text-white font-mono">
                      {recipient.slice(0, 8)}...{recipient.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      {amount} CHK
                      <img src="/chakra_coin.svg" alt="CHK" className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-gray-300">Paid by sender</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !recipient || !amount}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send {amount || '0'} CHK
                  <img src="/chakra_coin.svg" alt="CHK" className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-8 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">⚠️ Important</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Double-check the recipient address before sending</li>
            <li>• CHAKRA transfers are irreversible</li>
            <li>• You can only send whole numbers (no decimals)</li>
            <li>• Transfers are instant on the blockchain</li>
            <li>• Network fees are paid in Honeycomb SOL automatically</li>
          </ul>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-3">💡 Tips</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Use this to send CHAKRA to friends or trade with other players</li>
            <li>• Keep some CHAKRA for purchasing characters and power-ups</li>
            <li>• Earn more CHAKRA by winning matches and tournaments</li>
            <li>• You can verify transfers on Solana Explorer using the transaction signature</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

