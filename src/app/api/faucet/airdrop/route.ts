import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://rpc.test.honeycombprotocol.com";
const AIRDROP_AMOUNT = 5; // 5 SOL per request
const MAX_BALANCE_FOR_FAUCET = 2; // Only users with <= 2 SOL can use faucet

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate wallet address
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    console.log(`💧 Airdrop request: ${AIRDROP_AMOUNT} SOL to ${walletAddress}`);

    // Connect to Honeycomb RPC
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Check current balance
    const currentBalance = await connection.getBalance(publicKey);
    const currentBalanceSOL = currentBalance / LAMPORTS_PER_SOL;

    console.log(`Current balance: ${currentBalanceSOL.toFixed(4)} SOL`);

    // Reject if balance is too high
    if (currentBalanceSOL > MAX_BALANCE_FOR_FAUCET) {
      return NextResponse.json(
        { 
          error: `Wallet already has ${currentBalanceSOL.toFixed(4)} SOL. Faucet is only for wallets with ${MAX_BALANCE_FOR_FAUCET} SOL or less.`,
          currentBalance: currentBalanceSOL
        },
        { status: 403 }
      );
    }

    // Request airdrop
    const signature = await connection.requestAirdrop(
      publicKey,
      AIRDROP_AMOUNT * LAMPORTS_PER_SOL
    );

    console.log(`📤 Airdrop transaction sent: ${signature}`);

    // Confirm transaction
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });

    console.log(`✅ Airdrop confirmed! ${AIRDROP_AMOUNT} SOL sent to ${walletAddress}`);

    return NextResponse.json({
      success: true,
      signature,
      amount: AIRDROP_AMOUNT,
      recipient: walletAddress,
      message: `Successfully airdropped ${AIRDROP_AMOUNT} Honeycomb SOL!`,
    });

  } catch (error) {
    console.error("Airdrop error:", error);
    
    // Check for rate limit error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('airdrop request limit')) {
      return NextResponse.json(
        { error: "Airdrop limit reached. Please try again in a few hours." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Airdrop failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

