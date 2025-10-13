"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { client } from "@/utils/constants/client";
// import { User } from "@/lib/types/user";
import { User } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import base58 from "bs58";
import { useUserStore } from "@/store/useUser";
import { useAuthStore } from "@/store/useAuth";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type ConnectButtonProps = {
  width: string;
};

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;
const PROFILE_TREE = process.env.PROFILE_TREE as string;

export const compactHash = (hash: string | null | undefined) => {
  if (!hash || typeof hash !== "string" || hash.length < 12) return "";
  return `${hash.substring(0, 7)}...${hash.substring(hash.length - 5)}`;
};

export default function ConnectButton({ width }: ConnectButtonProps) {
  const wallet = useWallet();
  const { user, setUser, updateUser } = useUserStore();
  const { setAccessToken: setGlobalAccessToken } = useAuthStore();

  const [localAccessToken, setLocalAccessToken] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!wallet.publicKey) return;

      try {
        const { user } = await client.findUsers({
          wallets: [wallet.publicKey.toString()],
          includeProof: true,
        });

        if (user && user.length > 0) {
          setUser(user[0] as unknown as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        toast.error(`Error fetching user: ${error}`);
        setUser(null);
      }
    };

    fetchUser();
  }, [wallet.publicKey?.toString()]); 

useEffect(() => {
  const checkIfUserHasProfile = async () => {
    if (!user || !user.id) return;

    // Skip if user already has profiles loaded
    if (user.profiles && user.profiles.length > 0) {
      setHasProfile(true);
      return;
    }

    try {
      const { profile } = await client.findProfiles({
        userIds: [user.id],
        projects: [PROJECT_ADDRESS],
        includeProof: true,
      });

      if (profile && profile.length > 0) {
        updateUser({ profiles: profile });
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      toast.error(`Error checking for profile: ${err}`);
    }
  };

  checkIfUserHasProfile();
}, [user?.id]); // Only depend on user.id, not the entire user object

const authenticateWithEdgeClient = async () => {
  if (!wallet.publicKey) {
    toast.error("Wallet not connected!");
    return;
  }

  try {
    toast.info('Authenticating...');
    
    const {
      authRequest: { message: authRequest },
    } = await client.authRequest({
      wallet: wallet.publicKey.toString(),
    });

    const encodedMessage = new TextEncoder().encode(authRequest);

    if (!wallet.signMessage) {
      toast.error("Your wallet does not support message signing.");
      return;
    }

    const signedUIntArray = await wallet.signMessage(encodedMessage);
    const signature = base58.encode(signedUIntArray);

    const { authConfirm } = await client.authConfirm({
      wallet: wallet.publicKey.toString(),
      signature,
    });

    if (authConfirm.accessToken) {
      setLocalAccessToken(authConfirm.accessToken);
      setGlobalAccessToken(authConfirm.accessToken);
      toast.success("Authenticated! Now create your profile.");
    } else {
      toast.error('Authentication failed');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    toast.error(`Auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

  const createUserAndProfile = async () => {
    if (!wallet.publicKey) return;
    
    try {
      setLoading(true);
      toast.info('Creating your account...');
      
      // Primary approach: Create user with profile in one transaction
      const {
        createNewUserWithProfileTransaction: txResponse,
      } = await client.createNewUserWithProfileTransaction({
        project: PROJECT_ADDRESS,
        wallet: wallet.publicKey.toString(),
        payer: wallet.publicKey.toString(),
        profileIdentity: "main",
        userInfo: {
          name: "John Doe",
          bio: "Solana Gamer",
          pfp: "https://example.com/profile.jpg",
        },
      });

      const result = await sendClientTransactions(client, wallet, txResponse);

      if (result[0].responses[0].status === 'Success') {
        toast.success(`User & Profile Created Successfully!`);
        
        // Fetch the created user
        const { user } = await client.findUsers({
          wallets: [wallet.publicKey.toString()],
          includeProof: true,
        });

        if (user.length > 0) {
          setUser(user[0] as unknown as User);
          setHasProfile(true);
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (e) {
      console.error('❌ Combined creation failed:', e);
      
      // FALLBACK: Try creating user only first
      toast.info('Trying alternate method...');
      
      try {
        const {
          createNewUserTransaction: txResponse,
        } = await client.createNewUserTransaction({
          wallet: wallet.publicKey.toString(),
          info: {
            name: "John Doe",
            pfp: "https://example.com/profile.jpg",
            bio: "Solana Gamer",
          },
          payer: wallet.publicKey.toString(),
        });

        const result = await sendClientTransactions(client, wallet, txResponse);

        if (result[0].responses[0].status === 'Success') {
          toast.success('User Created!');
          toast.info('Next: Click "Authenticate" then "Create Profile"', { autoClose: 7000 });
          
          // Fetch the created user
          const { user } = await client.findUsers({
            wallets: [wallet.publicKey.toString()],
            includeProof: true,
          });

          if (user.length > 0) {
            setUser(user[0] as unknown as User);
            setHasProfile(false);
          }
        } else {
          throw new Error("User creation failed");
        }
      } catch (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError);
        toast.error(`Failed to create user: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!wallet.publicKey || !localAccessToken || !user) {
      toast.error('Please authenticate first');
      return;
    }

    try {
      setLoading(true);
      toast.info('Creating your profile...');
      
      const {
        createNewProfileTransaction: txResponse,
      } = await client.createNewProfileTransaction(
        {
          project: PROJECT_ADDRESS,
          payer: wallet.publicKey.toString(),
          identity: "main",
          info: {
            name: "John Doe",
            bio: "Extra bio here",
            pfp: "https://example.com/pfp.png",
          },
        },
        {
          fetchOptions: {
            headers: {
              authorization: `Bearer ${localAccessToken}`,
            },
          },
        }
      );
      
      const result = await sendClientTransactions(client, wallet, txResponse);
      
      if (result[0].responses[0].status === 'Success') {
        setHasProfile(true);
        toast.success('Profile Created Successfully!');
        
        // Refresh user to get profile data
        const { user: updatedUser } = await client.findUsers({
          wallets: [wallet.publicKey.toString()],
          includeProof: true,
        });
        
        if (updatedUser.length > 0) {
          setUser(updatedUser[0] as unknown as User);
        }
      } else {
        throw new Error("Profile transaction failed");
      }
    } catch (e) {
      console.error('Profile creation error:', e);
      toast.error(`Failed to create profile: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!wallet.connected ? (
  // 1. Connect Wallet
  // <Button
  //   className={`text-white border border-white connect-button-bg min-h-[42px] font-semibold ${width} rounded-[7px]`}
  //   onClick={() => wallet.connect()}
  // >
  //   Connect Wallet
  // </Button>
  <WalletMultiButton />
) : wallet.connected && !user ? (
  // 2. Create User
  <Button
    onClick={createUserAndProfile}
    className={`text-white border border-white connect-button-bg min-h-[42px] font-semibold ${width} rounded-[7px]`}
    disabled={loading}
  >
    {loading ? "Creating..." : "Create User"}
  </Button>
) : wallet.connected && user && !hasProfile && !localAccessToken ? (
  // 3. Authenticate (only if no profile and no token)
  <Button
    onClick={authenticateWithEdgeClient}
    className={`text-white border border-white connect-button-bg min-h-[42px] font-semibold ${width} rounded-[7px]`}
  >
    Authenticate
  </Button>
) : wallet.connected && user && !hasProfile && localAccessToken ? (
  // 4. Create Profile after auth
  <Button
    onClick={createProfile}
    className={`text-white border border-white connect-button-bg min-h-[42px] font-semibold ${width} rounded-[7px]`}
    disabled={loading}
  >
    {loading ? "Creating..." : "Create Profile"}
  </Button>
) : (
  // 5. Everything ready — Show address
  // <Button
  //   className="text-white border border-white connect-button-bg min-h-[42px] w-full lg:w-[145px] rounded-[7px]"
  //   onClick={() => wallet.}
  // >
  //   {compactAddress}
  // </Button>
  <WalletMultiButton />
)}
    </div>
  );
}
