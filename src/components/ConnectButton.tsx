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
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type ConnectButtonProps = {
  width: string;
};

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

export const compactHash = (hash: string | null | undefined) => {
  if (!hash || typeof hash !== "string" || hash.length < 12) return "";
  return `${hash.substring(0, 7)}...${hash.substring(hash.length - 5)}`;
};

export default function ConnectButton({ width }: ConnectButtonProps) {
  const wallet = useWallet();
  const { user, setUser, updateUser } = useUserStore();

  const [accessToken, setAccessToken] = useState<string | null>(null);
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

        console.log("Found users:", user);

        if (user && user.length > 0) {
          setUser(user[0] as unknown as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
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
      console.log("Fetching profiles for user.id:", user.id);
      const { profile } = await client.findProfiles({
        userIds: [user.id],
        projects: [PROJECT_ADDRESS],
        includeProof: true,
      });

      console.log("Found profiles:", profile);

      if (profile && profile.length > 0) {
        updateUser({ profiles: profile });
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      console.error("Error checking for profile:", err);
      toast.error(`Error checking for profile: ${err}`);
    }
  };

  checkIfUserHasProfile();
}, [user?.id]); // Only depend on user.id, not the entire user object

const authenticateWithEdgeClient = async () => {
  if (!wallet.publicKey) {
    alert("Wallet not connected!");
    return;
  }

  const {
    authRequest: { message: authRequest },
  } = await client.authRequest({
    wallet: wallet.publicKey.toString(),
  });

  const encodedMessage = new TextEncoder().encode(authRequest);

  if (!wallet.signMessage) {
    alert("Your wallet does not support message signing.");
    return;
  }

  const signedUIntArray = await wallet.signMessage(encodedMessage);
  const signature = base58.encode(signedUIntArray);

  const { authConfirm } = await client.authConfirm({
    wallet: wallet.publicKey.toString(),
    signature,
  });

  if (authConfirm.accessToken) {
    setAccessToken(authConfirm.accessToken);
    toast.success("Authentication successful");
  }
};

  const createUserAndProfile = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoading(true);
      const {
        createNewUserWithProfileTransaction: txResponse,
      } = await client.createNewUserWithProfileTransaction({
        project: PROJECT_ADDRESS,
        wallet: wallet.publicKey.toString(),
        profileIdentity: "main",
        userInfo: {
          name: "John Doe",
          bio: "Solana Gamer",
          pfp: "https://example.com/profile.jpg",
        },
      });

      const result = await sendClientTransactions(client, wallet, txResponse);

      if (result[0].responses[0].status === 'Success') {
          toast.success(`User & Profile Created! ${result[0].responses[0].signature}`);
      } else {
        throw new Error("transaction failed")
      }

      const { user } = await client.findUsers({
      wallets: [`${wallet.publicKey?.toString()}`],
      includeProof: true,
      });

    if (user.length > 0) {
      setUser(user as unknown as User);                          
    }
    } catch (e) {
      if (e instanceof Error) {
        toast.error("Failed to create user and profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!wallet.publicKey || !accessToken || !user) return;

    try {
      setLoading(true);
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
              authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

      const result = await sendClientTransactions(client, wallet, txResponse);
      if (result[0].responses[0].status === 'Success') {
          setHasProfile(true)
          toast.success(`Profile Created! ${result[0].responses[0].signature}`);
      } else {
        throw new Error("transaction failed")
      }
    } catch (e) {
      toast.error(`Failed to create profile: ${e}`);
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
) : wallet.connected && user && !hasProfile && !accessToken ? (
  // 3. Authenticate (only if no profile and no token)
  <Button
    onClick={authenticateWithEdgeClient}
    className={`text-white border border-white connect-button-bg min-h-[42px] font-semibold ${width} rounded-[7px]`}
  >
    Authenticate
  </Button>
) : wallet.connected && user && !hasProfile && accessToken ? (
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
