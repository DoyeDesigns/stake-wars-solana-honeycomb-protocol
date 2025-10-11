import { client } from "@/utils/constants/client";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;
const CHAKRA_RESOURCE_TREE_ADDRESS = process.env.CHAKRA_RESOURCE_TREE_ADDRESS as string;

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Burns chakra (entry fee) from user's wallet
 * Note: This function is deprecated - use /api/tournaments/pay-entry endpoint instead
 * @deprecated Use server-side API endpoint for payment
 */
export async function payTournamentEntryFee(
  amount: number,
  walletAddress: string,
  signerFunction: (transaction: unknown) => Promise<string>
): Promise<PaymentResult> {
  try {
    if (!PROJECT_AUTHORITY || !CHAKRA_RESOURCE_ADDRESS) {
      return {
        success: false,
        error: "Payment system not configured",
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "Invalid amount",
      };
    }

    // Create transfer transaction (transfers chakra to PROJECT_AUTHORITY)
    const { createTransferResourceTransaction: txResponse } = 
      await client.createTransferResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: walletAddress,
        recipient: PROJECT_AUTHORITY,
        amount: amount.toString(),
        payer: walletAddress,
      });

    // Sign and send transaction
    const signature = await signerFunction(txResponse);

    if (!signature) {
      return {
        success: false,
        error: "Transaction signing failed",
      };
    }

    return {
      success: true,
      signature,
    };

  } catch (error) {
    console.error("Tournament payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verifies if a user has sufficient chakra balance to join a tournament
 */
export async function checkChakraBalance(
  walletAddress: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; balance?: number; error?: string }> {
  try {
    if (!CHAKRA_RESOURCE_TREE_ADDRESS) {
      return {
        sufficient: false,
        error: "Resource not configured",
      };
    }

    // Get user's chakra balance (same way as Marketplace.tsx)
    const resources = await client.findHoldings({
      holders: [walletAddress],
      trees: [CHAKRA_RESOURCE_TREE_ADDRESS],
    });

    if (!resources || !resources.holdings || resources.holdings.length === 0) {
      return {
        sufficient: false,
        balance: 0,
      };
    }

    const balance = Number(resources.holdings[0]?.balance || 0);

    return {
      sufficient: balance >= requiredAmount,
      balance: balance,
    };

  } catch (error) {
    console.error("Check balance error:", error);
    return {
      sufficient: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

