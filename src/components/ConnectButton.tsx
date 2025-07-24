"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { client } from "@/utils/constants/client";
import { User } from "@/lib/types/user";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import base58 from "bs58";
import { useUserStore } from "@/store/user-store";
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

  // const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Authenticate and fetch user
  useEffect(() => {
  const fetchUser = async () => {
    const { user } = await client.findUsers({
      wallets: [`${wallet.publicKey?.toString()}`],
      includeProof: true,
    });

    if (user.length > 0) {
      setUser(user as unknown as User);
      console.log("first", user)                                  
    }
  };

  if (wallet.publicKey) {
    fetchUser();
  }
}, [wallet.publicKey]);

useEffect(() => {
  const checkIfUserHasProfile = async () => {
    if (!user) return;

    try {
      const { profile } = await client.findProfiles({
        projects: [PROJECT_ADDRESS],
        includeProof: true,
      });

       if (!user.profiles || user.profiles.length === 0) {
      updateUser({ profiles: profile });
    }
      console.log("Zustand user after profile update:", user);
      setHasProfile(profile.length > 0);
    } catch (err) {
      console.error("Error checking for profile:", err);
    }
  };

  checkIfUserHasProfile();
}, [user]);

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
    console.log("Access token:", authConfirm.accessToken);
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
      toast.success("User & Profile Created!");

      const { user } = await client.findUsers({
      wallets: [`${wallet.publicKey?.toString()}`],
      includeProof: true,
      });

    if (user.length > 0) {
      setUser(user as unknown as User);                          
    }
      console.log(result);
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
      toast.success("Profile Created!");
      setHasProfile(true)
      console.log(result);
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
