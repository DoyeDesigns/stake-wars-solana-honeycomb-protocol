"use client";

import { useEffect, useState } from "react";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { HiveControlPermissionInput, RewardKind } from "@honeycomb-protocol/edge-client";
import { client } from "@/utils/constants/client";
// import { SPL_NOOP_PROGRAM_ID, SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,  } from '@solana/spl-account-compression';
// import {
//   SYSVAR_CLOCK_PUBKEY,
//   SYSVAR_INSTRUCTIONS_PUBKEY,
//   SystemProgram,
//   sendAndConfirmTransaction
// } from '@solana/web3.js';
// import { HPL_NECTAR_MISSIONS_PROGRAM } from "@honeycomb-protocol/nectar-missions";
// import { ASSOCIATED_TOKEN_PROGRAM_ID, } from "@solana/spl-token";
// import { sendTransaction, signTransaction } from "@honeycomb-protocol/edge-client/client/helpers";
import * as web3 from '@solana/web3.js';
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { MPL_TOKEN_METADATA_PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
// import { HPL_HIVE_CONTROL_PROGRAM, VAULT } from "@honeycomb-protocol/hive-control";




import { ResourceStorageEnum } from "@honeycomb-protocol/edge-client";

import base58 from "bs58";

import { MintAsKind } from "@honeycomb-protocol/edge-client";
import { characterAdressess } from "@/lib/charater-address";
import { useUserStore } from "@/store/useUser";
import { toast } from "react-toastify";

const ASSEMBLER_CONFIG_ADDRESS = process.env.ASSEMBLER_CONFIG_ADDRESS as string
const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string
const CHARACTER_MODEL_ADDRESS = process.env.CHARACTER_MODEL_ADDRESS as string
const CHARACTER_MODEL_TREE_ADDRESS = process.env.CHARACTER_MODEL_TREE_ADDRESS as string
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string


export default function Test() {
  const { connection } = useConnection();

  const wallet = useWallet();

  const [balance, setBalance] = useState<number | null>(null);

  const [accessToken, setAccesstoken] = useState<string | null>(null);

  const {user} = useUserStore()

  const [projectAddress, setProjectAddress] = useState<string | null>("5UhtPu7RLsprTBy2791E5aEiC287Xtw7SZA23ZQgy7cJ");

  const [characterModelAddress, setCharacterModelAddress] = useState<
    string | null
  >(null);
  const [characterModelTreeAddress, setCharacterModelTreeAddress] = useState<
    string | null
  >(null);

  const [assemblerConfigAddress, setAssemblerConfigAddress] = useState<
    string | null
  >("6acx8p2hER99zTUkohfTEEP8eSvZxwLv4KBoqnWDDpFh");

  const [characterModelWithNFTAddress, setCharacterModelWithNFTAddress] =
    useState<string | null>(null);

    const [assembledAttribute, setAssembledAttributes] = useState<[string, string][]>([]);

    console.log(assembledAttribute)

    const order = ["Village", "Chakra"]

    console.log(assemblerConfigAddress)
    console.log(characterModelAddress)


    const traitUri =
  "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg";

const villages = ["Hidden Leaf", "Hidden Sand", "Hidden Mist", "Hidden Cloud"];
// const weapons = ["Kunai", "Shuriken", "Sword", "Scythe"];
const chakras = ["Fire", "Water", "Wind", "Earth", "Lightning"];

function generateRandomTraitsTuple(count: number): [string, string][] {
  if (count < 1 || count > 3) throw new Error("Trait count must be between 1 and 3.");

  const allTraits = [
    { label: "Village", options: villages },
    // { label: "Weapon", options: weapons },
    { label: "Chakra", options: chakras },
  ];

  // Randomly pick which traits to include
  const selected = [...allTraits].sort(() => 0.5 - Math.random()).slice(0, count);

  // Ensure correct order
  const ordered = selected.sort(
    (a, b) =>
      ["Village", "Weapon", "Chakra"].indexOf(a.label) -
      ["Village", "Weapon", "Chakra"].indexOf(b.label)
  );

  return ordered.map((trait) => {
    const randomName = trait.options[Math.floor(Math.random() * trait.options.length)];
    return [trait.label, randomName] as [string, string];
  });
}

function getCharacterId(attributes: Record<string, string>) {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }


// Final function
function generateOrderedCharacterTraits() {
  const shuffledVillages = [...villages].sort(() => 0.5 - Math.random()).slice(0, 1);
  // const shuffledWeapons = [...weapons].sort(() => 0.5 - Math.random()).slice(0, 1);
  const shuffledChakras = [...chakras].sort(() => 0.5 - Math.random()).slice(0, 1);

  const villageTrait = {
    label: "Village",
    name: shuffledVillages[0],
    uri: traitUri,
  };

  // const weaponTrait = {
  //   label: "Weapon",
  //   name: shuffledWeapons[0],
  //   uri: traitUri,
  // };

  const chakraTrait = {
    label: "Chakra",
    name: shuffledChakras[0],
    uri: traitUri,
  };

  return [villageTrait, chakraTrait];
}



const handleGenerate = () => {
    const generated = generateOrderedCharacterTraits().map(
      (trait) => [trait.label, trait.name] as [string, string]
    );
    setAssembledAttributes(generated);
    console.log(assembledAttribute)
  };


  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.publicKey) {
        const lamports = await connection.getBalance(wallet.publicKey);

        setBalance(lamports / web3.LAMPORTS_PER_SOL);
      }
    };

    fetchBalance();
  }, [wallet.publicKey, connection]);

  const handleCreateProject = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const {
      createCreateProjectTransaction: {
        project: projectAddress, // This is the project address once it'll be created

        tx: txResponse, // This is the transaction response, you'll need to sign and send this transaction
      },
    } = await client.createCreateProjectTransaction({
      name: "Stake Wars", // Name of the project

      authority: wallet.publicKey.toBase58(), // Public key of the project authority, this authority has complete control over the project

      // payer: wallet.publicKey.toBase58(), // Optional public key of the payer, the payer pays the transaction fees for creating this project

      profileDataConfig: {
        achievements: [
          // Specify an array of achievements that you want to be able to set on your users' profiles

          "Academy Student",
          "Genin",
          "Chūnin",
          "Special Jōnin",
          "Jōnin",
          "Anbu Black Ops",
          "Kage Candidate",
          "Kage",
          "Sannin",
          "Legendary Ninja",
          "Sage",
          "Jinchūriki Vessel",
          "Tailed Beast Master",
          "Six Paths Disciple",
          "Ōtsutsuki Initiate",
          "Ōtsutsuki Warrior",
          "Ōtsutsuki Sage",
          "Ōtsutsuki God",
        ],

        customDataFields: [
          // Specify an array of custom data fields that you want to be able to set on your users' profiles
          "NFTs owned",
          "wins",
          "losses",
        ],
      },
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // You can pass the transaction response containing either a single transaction or an array of transactions
    );

    console.log("Project address:", projectAddress);

    console.log("Transaction response:", txResponse);

    console.log("Response after sending transaction:", response);

    setProjectAddress(projectAddress); // Store the project address in state
  };

  const handleCreateChangeProjectDriverTransaction = async () => {
    if (!wallet.publicKey || !projectAddress) {
      alert("Wallet not connected or project address not set!");

      return;
    }

    const {
      createChangeProjectDriverTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createChangeProjectDriverTransaction({
      authority: wallet.publicKey.toBase58(), // Provide the project authority's public key

      project: projectAddress, // The project's public key

      driver: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // The new driver's public key

      // payer: payerPublicKey.toString() // Optional, the transaction payer's public key
    });

    console.log("Change project driver transaction response:", txResponse);
  };

  //   const createbadge = async () => {

  //     if (!wallet.publicKey) {

  //       alert("Wallet not connected!");

  //       return;

  //     }

  //     const {

  //   createCreateBadgeCriteriaTransaction: {

  //     blockhash,

  //     lastValidBlockHeight,

  //     transaction,

  //   },

  // } = await client.createCreateBadgeCriteriaTransaction({

  //   args: {

  //     authority: "", // Project authority public key

  //     projectAddress: "", // Project public key

  //     payer: "", // Optional transaction payer public key

  //     badgeIndex: 0, // Badge index as an integer, used to identify the badge

  //     condition: BadgesCondition.Public, // Badge condition, only Public is available for now

  //     startTime: 0, // Optional start time, UNIX timestamp

  //     endTime: 0, // Optional end time, UNIX timestamp

  //   },

  // });

  // // const {

  // //   createUpdateBadgeCriteriaTransaction: {

  // //     blockhash,

  // //     lastValidBlockHeight,

  // //     transaction,

  // //   },

  // // } = await client.createUpdateBadgeCriteriaTransaction({

  // //   args: {

  // //     authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // Project authority public key

  // //     projectAddress: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6", // Project public key

  // //     // payer: payerPublicKey, // Optional transaction payer public key

  // //     criteriaIndex: 0, // Badge index as an integer, used to identify the badge (when adding a badge you'll use this index)

  // //     condition: BadgesCondition.Public, // Badge condition, only Public is available for now

  // //     startTime: 0, // Optional start time, UNIX timestamp

  // //     endTime: 0, // Optional end time, UNIX timestamp

  // //   },

  // // });

  //   }

  const claimBadge = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const matchingProfile = user?.profiles?.find(
      (profile) => profile?.project === PROJECT_ADDRESS
    );

    if (!matchingProfile?.address) {
      alert("No matching profile found!");
      return;
    }

    console.log("Matching profile:", matchingProfile);

    try {
      // Call the server API to claim badge
      const claimResponse = await fetch("/api/claim-badge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileAddress: matchingProfile.address,
          criteriaIndex: 1,
          userAddress: wallet.publicKey.toString(),
        }),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        alert(errorData.error || "Failed to claim badge");
        return;
      }

      const claimData = await claimResponse.json();
      console.log("Claim badge response:", claimData);
      
      if (claimData.transactionResult && claimData.transactionResult.status === "Success") {
        alert(`Successfully claimed badge! ${claimData.transactionResult.signature}`);
      } else {
        alert("Transaction failed");
      }
    } catch (error) {
      console.error("Claim badge error:", error);
      alert("Failed to claim badge");
    }
  }

  const createUser = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const {
      createNewUserTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createNewUserTransaction({
      wallet: wallet.publicKey.toString(), // User's wallet public key

      info: {
        name: "Test User",

        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",

        bio: "This is a test user",
      },

      // payer: adminPublicKey.toString(), // Optional, the transaction payer's public key
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // You can pass the transaction response containing either a single transaction or an array of transactions
    );

    console.log("New user transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const createProfileTree = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    const {
      createCreateProfilesTreeTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createCreateProfilesTreeTransaction({
      payer: wallet.publicKey.toString(),

      project: process.env.PROJECT_ADDRESS as string,

      treeConfig: {
        // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)

        basic: {
          numAssets: 100_000, // The desired number of profiles this tree will be able to store
        },

        // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)

        // advanced: {

        //   maxDepth: 20,

        //   maxBufferSize: 64,

        //   canopyDepth: 14,

        // }
      },
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse.tx // Pass only the transaction object
    );

    console.log("Create profiles tree transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const createUserAndProfile = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const {
      createNewUserWithProfileTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createNewUserWithProfileTransaction({
      project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",

      wallet: wallet.publicKey.toString(),

      payer: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",

      profileIdentity: "main",

      userInfo: {
        name: "Honeycomb Developer",

        bio: "This user is created for testing purposes",

        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
      },
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log("New user with profile transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const findUsers = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const usersArray = await client

      .findUsers({
        // All filters below are optional

        wallets: [wallet.publicKey?.toBase58()], // String array of users' wallet addresses

        // addresses: ["69GyuuMHVSXCNVf6htoBfbAFdduV6tjJoQ2fHYtYnqwo"], // String array of Honeycomb Protocol user account addresses

        ids: [], // Integer array of Honeycomb Protocol user account IDs

        includeProof: true, // Optional, set to true if you want to include the proof of the user's account
      })

      .then(({ user }) => user); // This will be an array of users

    console.log("Found users:", usersArray);
  };

  const findProfiles = async () => {
    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    console.log(PROJECT_ADDRESS)

    const profilesArray = await client

      .findProfiles({
        // All filters below are optional

        // userIds: [740], // Integer array of Honeycomb Protocol user account IDs

        projects: PROJECT_ADDRESS, // String array of project addresses

        // addresses: ["G8KgdHdWc8ruPuxfvJKFVFypcwtJMwbC579v4WyLJUAa"], // String array of Honeycomb Protocol profile account addresses

        identities: [], // String array of profile identities

        includeProof: true, // Optional, set to true if you want to include the proof of the profile's account
      })

      .then(({ profile }) => profile); // This will be an array of profiles,

    console.log("Found profiles:", profilesArray);
  };

  const createProfile = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    const {
      createNewProfileTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createNewProfileTransaction(
      {
        project: PROJECT_ADDRESS, // The project's public key

        payer: wallet.publicKey.toString(), // The transaction payer's public key, the profile will also be created for this payer

        identity: "main", // Identity type in string, the value depends on the project's needs

        info: {
          // Optional, profile information, all values in the object are optional

          bio: "My name is John Doe",

          name: "John Doe",

          pfp: "link-to-pfp",
        },
      },

      {
        fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`, // Required, you'll need to authenticate the user with our Edge Client and provide the resulting access token here, otherwise this operation will fail
          },
        },
      }
    );

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log("New profile transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

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

    console.log("Auth request message:", authRequest);

    // Convert the auth request into a UInt8Array

    const encodedMessage = new TextEncoder().encode(authRequest);

    // Sign the message

    if (!wallet.signMessage) {
      alert("Your wallet does not support message signing.");

      return;
    }

    const signedUIntArray = await wallet.signMessage(encodedMessage);

    // Convert the signed message into a base58 encoded string

    const signature = base58.encode(signedUIntArray);

    // Send the signed message to the server

    const { authConfirm } = await client.authConfirm({
      wallet: wallet.publicKey.toString(),

      signature,
    });

    console.log("Auth confirm response:", authConfirm);

    if (authConfirm.accessToken) {
      setAccesstoken(authConfirm.accessToken);

      console.log("Access token:", authConfirm.accessToken);
    }
  };

  const updateProfile = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const {
      createUpdateProfileTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createUpdateProfileTransaction(
      {
        payer: wallet.publicKey.toString(),

        profile: "G8KgdHdWc8ruPuxfvJKFVFypcwtJMwbC579v4WyLJUAa",

        info: {
          bio: "This is Edoye User profile",

          name: "User",

          pfp: "link-to-pfp",
        },

        customData: {
          add: {
            // Here you can add any custom data to a user's profile, the format is given below (please always use key: ["string"])

            location: ["San Francisco, CA"],

            website: ["https://johndoe.dev"],

            github: ["https://github.com/johndoe"],

            stars: ["55"],
          },
        },
      },

      {
        fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`, // Required, you'll need to authenticate the user with our Edge Client and provide the resulting access token here, otherwise this operation will fail
          },
        },
      }
    );

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log("Update profile transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const addXP = async () => {
    try {
      if (!wallet.publicKey) {
        alert("Wallet not connected");
        return;
      }
    
      // Call the server API to mint resources
      const mintResponse = await fetch("/api/mint-resource", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletPublicKey: wallet.publicKey.toString(),
          amount: 500,
        }),
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        toast.error(errorData.error || "Failed to mint resources");
        return;
      }

      const mintData = await mintResponse.json();
      
      if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
        toast.success("Successfully claimed 500 XP!");
        // router.push("/lobby");
      } else {
        throw new Error("Transaction failed");
      }
   } catch (error) {
     toast.error(`Error Claiming XP: ${error instanceof Error ? error.message : 'Unknown error'}`);
     return;
   } 
};


  const createAssemblerConfig = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    const {
      createCreateAssemblerConfigTransaction: {
        assemblerConfig: assemblerConfigAddress, // This is the assembler config address once it'll be created

        tx: txResponse,
      },
    } = await client.createCreateAssemblerConfigTransaction({
      project: process.env.PROJECT_ADDRESS as string,

      authority: process.env.PROJECT_AUTHORITY as string, // The public key of the project authority

      // payer: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // Optional payer

      treeConfig: {
        // This tree is used to store character traits and their necessary information

        // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)

        basic: {
          numAssets: 100000, // The desired number of character information this tree will be able to store
        },

        // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)

        // advanced: {

        //   maxDepth: 20, // Max depth of the tree

        //   maxBufferSize: 64, // Max buffer size of the tree

        //   canopyDepth: 14, // Canopy depth of the tree

        // },
      },

      ticker: "STW1", // Provide a unique ticker for the config (the ticker ID only needs to be unique within the project)

      order: order, // Provide the character traits here; the order matters, in the example order, the background image will be applied and then the skin, expression, clothes, armor, weapon, and shield (if you need your character's expression to appear over the skin, the skin needs to come first in the order)
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    setAssemblerConfigAddress(assemblerConfigAddress); // Store the assembler config address in state

    console.log("Create assembler config transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const addTraitsAndUri = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!assemblerConfigAddress) {
    //   alert("Assembler config address not set!");

    //   return;
    // }

    // handleGenerate();

    const { createAddCharacterTraitsTransactions: txResponse } =
      await client.createAddCharacterTraitsTransactions({
        // traits: [
        //   // Attack options

        //   {
        //     layer: "Weapon",
        //     name: "Slash",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },

        //   {
        //     layer: "Weapon",
        //     name: "Lightning",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },

        //   {
        //     layer: "Weapon",
        //     name: "Poison",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },

        //   {
        //     layer: "Weapon",
        //     name: "Fireball",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },

        //   // Defense options

        //   {
        //     layer: "Armor",
        //     name: "Block",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },

        //   {
        //     layer: "Shield",
        //     name: "Dodge",
        //     uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        //   },
        // ],
        
        traits: [
          // Village traits
          { layer: "Village", name: "Hidden Leaf", uri: traitUri },
          { layer: "Village", name: "Hidden Sand", uri: traitUri },
          { layer: "Village", name: "Hidden Mist", uri: traitUri },
          { layer: "Village", name: "Hidden Cloud", uri: traitUri },

          // Weapon traits
          // { layer: "Weapon", name: "Kunai", uri: traitUri },
          // { laye r: "Weapon", name: "Shuriken", uri: traitUri },
          // { layer: "Weapon", name: "Katana", uri: traitUri },
          // { layer: "Weapon", name: "Scythe", uri: traitUri },

          // Chakra traits
          { layer: "Chakra", name: "Fire", uri: traitUri },
          { layer: "Chakra", name: "Water", uri: traitUri },
          { layer: "Chakra", name: "Earth", uri: traitUri },
          { layer: "Chakra", name: "Lightning", uri: traitUri },
          { layer: "Chakra", name: "Wind", uri: traitUri },
        ],

        assemblerConfig: ASSEMBLER_CONFIG_ADDRESS, // Assembler config address as a string

        authority: PROJECT_AUTHORITY, // Authority public key as a string, this user will be the authority of the traits

        payer: wallet.publicKey.toBase58(), // Payer public key as a string, this user will pay for the transaction
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log("Add traits transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const createCharacterModel = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    // if (!assemblerConfigAddress) {
    //   alert("Assembler config address not set!");

    //   return;
    // }

    const {
      createCreateCharacterModelTransaction: {
        characterModel: characterModelAddress, // This is the character model address once it'll be created

        tx: txResponse,
      },
    } = await client.createCreateCharacterModelTransaction({
      project: PROJECT_ADDRESS,

      authority: PROJECT_AUTHORITY, // Authority public key as a string, this user will be the authority of the character model

      // payer: adminPublicKey.toString(), // Optional, use this if you want a different wallet to pay the transaction fee, by default the authority pays for this tx

      mintAs: {
        // Optional, you can define the underlying protocol, default is MplCore

        kind: MintAsKind.MplCore,

        // Uncomment the following config if you are using MplBubblegum as the underlying protocol in kind

        // mplBubblegum: {

        //   maxDepth: 3,

        //   maxBufferSize: 8,

        // }
      },

      config: {
        kind: "Assembled",

        assemblerConfigInput: {
          assemblerConfig: ASSEMBLER_CONFIG_ADDRESS, // Assembler config address as a string, this is the assembler config that will be used to create the character model

          collectionName: "Hidden Cloud Ninja with Wind Chakra Nature",

          name: "Assembled Character NFT for StakeWars",

          symbol: "HCWi",

          description: "This is a character model for ninja characters that are from the hidden cloud village with wind chakra nature",

          sellerFeeBasisPoints: 0,

          creators: [
            {
              address: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",

              share: 100,
            },
          ],
        },
      },

      attributes: [["Village", "Hidden Cloud"], ["Chakra", "Wind"]],

      // cooldown: { // Optional, add a cool down period (in seconds) before the characters can be unwrapped

      //   ejection: 1, // Ejection/unwrap cool down (in seconds)

      // }
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log("Create character model transaction response:", txResponse);

    setCharacterModelAddress(characterModelAddress); // Store the character model address in state
    console.log('Character address:', characterModelAddress)
  };

  const createCharacterTree = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!characterModelAddress) {
    //   alert("Character model address not set!");

    //   return;
    // }

    // if (!projectAddress) {
    //   alert("Project address not set!");

    //   return;
    // }

    const { createCreateCharactersTreeTransaction: txResponse } =
      await client.createCreateCharactersTreeTransaction({
        authority: wallet.publicKey.toString(), // Authority public key as a string, this user will be the authority of the characters tree

        project: PROJECT_ADDRESS, // Project public key as a string

        characterModel: characterModelAddress as string,

        // payer: adminPublicKey.toString(), // Optional, only use if you want to pay from a different wallet

        treeConfig: {
          // Tree configuration, this affects how many characters this tree can store

          basic: {
            numAssets: 100000,
          },

          // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)

          // advanced: {

          //   maxDepth: 3,

          //   maxBufferSize: 8,

          //   canopyDepth: 3,

          // },
        },
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse.tx // Pass only the transaction object
    );

    setCharacterModelTreeAddress(txResponse.treeAddress)
    console.log("Character tree:", txResponse.treeAddress)
  };

  const makeCharacter = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    // if (!projectAddress || !assemblerConfigAddress) {
    //   alert("Project or assembler config address not set!");

    //   return;
    // }

    // if (!characterModelAddress) {
    //   alert("Character model address not set!");

    //   return;
    // }

    // handleGenerate()
    // console.log("assemble config", assembledAttribute)

    const { createAssembleCharacterTransaction: txResponse } =
      await client.createAssembleCharacterTransaction({
        project: PROJECT_ADDRESS, // Project public key as a string

        assemblerConfig: ASSEMBLER_CONFIG_ADDRESS, // Assembler config address as a string

        authority: wallet.publicKey.toString(), // Authority public key as a string, this user will be the authority of the character

        characterModel: characterModelAddress as string, // Character model public key as a string

        owner: wallet.publicKey.toBase58(), // User wallet public key as a string, this user will receive the character

        payer: wallet.publicKey.toString(), // User wallet public key as a string, this user will receive the character

        // attributes: assembledAttribute,
        attributes: [["Village", "Hidden Cloud"], ["Chakra", "Wind"]],
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );
  };

  const createCharacterModelWithNFT = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    if (!projectAddress) {
      alert("Project address not set!");

      return;
    }

    const {
      createCreateCharacterModelTransaction: {
        tx: txResponse, // This is the transaction response, you'll need to sign and send this transaction

        characterModel: characterModelAddress, // This is the character model address once it'll be created
      },
    } = await client.createCreateCharacterModelTransaction({
      authority: wallet.publicKey.toBase58(), // Project authority public key as a string

      project: projectAddress,

      // payer: adminPublicKey.toString(), // Optional, if you want to pay from a different wallet

      config: {
        kind: "Wrapped",

        criterias: [
          {
            kind: "Collection", // Can be Collection, Creator, or MerkleTree

            params: "GyTeRgX6xH6MvB2AVRN3szidvT4RKvzCmJvnzoKhSQbs", // Provide the relevant address here
          },
        ],
      },

      cooldown: {
        // Optional, add a cool down period (in seconds) before the characters can be unwrapped

        ejection: 1, // Ejection/unwrap cool down (in seconds)
      },
    });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse // Pass only the transaction object
    );

    console.log(
      "Create character model with NFT transaction response:",
      txResponse
    );

    console.log("Response after sending transaction:", response);

    setCharacterModelWithNFTAddress(characterModelAddress); // Store the character model address in state
  };

  const createCharacterTreeWithNFT = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    if (!projectAddress) {
      alert("Project address not set!");

      return;
    }

    if (!characterModelWithNFTAddress) {
      alert("Character model with NFT address not set!");

      return;
    }

    const { createCreateCharactersTreeTransaction: txResponse } =
      await client.createCreateCharactersTreeTransaction({
        authority: wallet.publicKey.toString(), // Authority public key as a string, this user will be the authority of the characters tree

        project: projectAddress, // Project public key as a string

        characterModel: characterModelWithNFTAddress,

        // payer: adminPublicKey.toString(), // Optional, only use if you want to pay from a different wallet

        treeConfig: {
          // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)

          basic: {
            numAssets: 100000, // The desired number of characters this tree will be able to store
          },

          // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)

          // advanced: {

          //   canopyDepth: 20,

          //   maxBufferSize: 64,

          //   maxDepth: 14,

          // }
        },
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup

      wallet, // The wallet you got from the useWallet hook

      txResponse.tx // Pass only the transaction object
    );

    console.log(
      "Create characters tree with NFT transaction response:",
      txResponse
    );

    console.log("Response after sending transaction:", response);
  };

  const wrapAssetsToCharacter = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    if (!projectAddress) {
      alert("Project address not set!");

      return;
    }

    if (!characterModelWithNFTAddress) {
      alert("Character model with NFT address not set!");

      return;
    }

    const { createWrapAssetsToCharacterTransactions: txResponse } =
      await client.createWrapAssetsToCharacterTransactions({
        project: projectAddress,

        mintList: ["5QCCugfKsSrR4W8sbycEtEnYEi4tXgGny31pom9V7n4i"], // Provide NFT addresses here,

        wallet: wallet.publicKey.toString(), // User's wallet public key as a string

        characterModel: characterModelWithNFTAddress,
      });

    const response = await sendClientTransactions(
      client,

      wallet,

      txResponse
    );

    console.log("Wrap assets to character transaction response:", txResponse);

    console.log("Response after sending transaction:", response);
  };

  const findCharacters = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");

      return;
    }

    const result = await client
      .findCharacters({
        trees: [characterAdressess[0].treeAdress as string],
        // wallets: [wallet.publicKey.toBase58()],
      })
      .then(({ character }) => character);

    console.log("Found characters:", result);
  };

  const updateCharacterTraits = async (count: number) => {
  if (!wallet.publicKey || !projectAddress || !assemblerConfigAddress || !characterModelAddress) {
    alert("Missing required data");
    return;
  }

  const attributes = generateRandomTraitsTuple(count); // ← Use the generated traits here

  console.log(attributes)

  const { createUpdateCharacterTraitsTransaction: txResponse } =
    await client.createUpdateCharacterTraitsTransaction({
      project: projectAddress.toString(),
      authority: wallet.publicKey.toString(),
      assemblerConfig: assemblerConfigAddress.toString(),
      characterAddress: "5tc7dhMh8a14df2xFCY4ksiigqiqY8M4zsTA5UTMsor9",
      characterModel: characterModelAddress.toString(),
      attributes,
      // attributes:[[ "Village", "Hidden Cloud" ], [ "Weapon", "Shuriken" ], [ "Chakra", "Wind" ]]
    });

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("Update character traits response:", response);
};

  const createResource = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const {
    createCreateNewResourceTransaction: {
        resource: resourceAddress, // This is the resource address once it'll be created
        tx: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    },
} = await client.createCreateNewResourceTransaction({
    project: PROJECT_ADDRESS,
    authority: wallet.publicKey.toString(),
    // delegateAuthority: delegateAuthorityPublicKey.toString(), // Optional, resource delegate authority public key
    payer: wallet.publicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
    params: {
            name: "Chakra", // Name of the resource
            decimals: 6, // Number of decimal places the resource can be divided into
            symbol: "CHK", // Symbol of the resource
            uri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg", // URI of the resource
            storage: ResourceStorageEnum.LedgerState,
    }
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("Create resource response:", response);
  console.log("Resource address:", resourceAddress);
};

  const createResourceTree = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const {
  createCreateNewResourceTreeTransaction: {
    treeAddress: merkleTreeAddress, // This is the merkle tree address once it'll be created
    tx: txResponse, // This is the transaction response, you'll need to sign and send this transaction
  },
} = await client.createCreateNewResourceTreeTransaction({
    project: PROJECT_ADDRESS,
    authority: wallet.publicKey.toString(),
    // delegateAuthority: delegateAuthorityPublicKey.toString(), // Optional
    // payer: adminPublicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
    resource: "BGMzmEkoeVC3UXKLjW3tvAEkbs2uuMAihEd9buacH82u",
    treeConfig: {
      // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)
      basic: { 
        numAssets: 100000, // The desired number of resources this tree will be able to store
      },
      // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)
      // advanced: {
      //   maxDepth: 20,
      //   maxBufferSize: 64,
      //   canopyDepth: 14,
      // }
    }
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("Create resource tree response:", response);
  console.log("Resource tree address:", merkleTreeAddress);
};

  const mintResource = async () => {
  if (!wallet.publicKey) {
    alert("Wallet not connected");
    return;
  }

  try {
    // Call the server API to mint resources
    const mintResponse = await fetch("/api/mint-resource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletPublicKey: wallet.publicKey.toString(),
        amount: 5,
      }),
    });

    if (!mintResponse.ok) {
      const errorData = await mintResponse.json();
      alert(errorData.error || "Failed to mint resources");
      return;
    }

    const mintData = await mintResponse.json();
    console.log("Mint resource response:", mintData);
    
    if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
      alert("Successfully minted 5 resources!");
    } else {
      alert("Transaction failed");
    }
  } catch (error) {
    console.error("Mint resource error:", error);
    alert("Failed to mint resources");
  }
};

  const createFaucet = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS || !CHARACTER_MODEL_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const { 
  createInitializeFaucetTransaction: { 
      faucet: faucetAddress, // This is the faucet address once it'll be created
      tx: txResponse  // This is the transaction response, you'll need to sign and send this transaction
  },
} = await client.createInitializeFaucetTransaction({
    resource: CHAKRA_RESOURCE_ADDRESS, // Resource public key as a string
    amount: 100000, // Amount of the resource to make available in the faucet
    authority: PROJECT_AUTHORITY, // Project authority's public key
    repeatInterval: 20, // The interval in seconds between faucet requests
    // payer: adminPublicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("create fauscet response:", response);
  console.log("faucetAddress", faucetAddress);
};

  const burnResource = async () => {
  if (!wallet.publicKey) {
    alert("Missing required data");
    return;
  }

  try {
    const response = await fetch("/api/burn-resource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 250,
        userPublicKey: wallet.publicKey.toString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.error || "Failed to burn resource");
      return;
    }

    const data = await response.json();
    console.log("Burn resource response:", data);
    
    if (data.transactionResult && data.transactionResult.status === "Success") {
      toast.success("Resource burned successfully!");
    } else {
      toast.error("Failed to burn resource");
    }
  } catch (error) {
    console.error("Burn resource error:", error);
    toast.error("Failed to burn resource");
  }
};

  const transferResourceWithAdminPayer = async () => {
  if (!wallet.publicKey) {
    alert("Wallet not connected");
    return;
  }

  try {
    // Create transfer transaction - user signs, admin pays gas
    const { createTransferResourceTransaction: txResponse } = 
      await client.createTransferResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: wallet.publicKey.toString(), // Sender's public key (user signs)
        recipient: PROJECT_AUTHORITY, // Recipient's public key (where chakra goes)
        amount: "10", // Amount of the resource to transfer (10 chakra for testing)
      });

    // User signs the transaction using sendClientTransactions
    const response = await sendClientTransactions(client, wallet, txResponse);
    
    console.log("Transfer resource response:", response);
    
    if (response && response[0]?.responses && response[0].responses[0]?.status === "Success") {
      toast.success("Successfully transferred 10 chakra to PROJECT_AUTHORITY! (Admin paid gas)");
      console.log("Transfer signature:", response[0].responses[0].signature);
    } else {
      toast.error("Transfer failed");
    }
  } catch (error) {
    console.error("Transfer resource error:", error);
    toast.error(`Failed to transfer resource: ${error}`);
  }
};

  const equipResource = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS || !CHARACTER_MODEL_ADDRESS) {
    alert("Missing required data");
    return;
  }

  console.log("resource:", CHAKRA_RESOURCE_ADDRESS)

  const { 
    createEquipResourceOnCharacterTransaction: txResponse // The transaction response that you have to get signed and send the transaction
} =
await client.createEquipResourceOnCharacterTransaction({
    characterModel: characterAdressess[0].address, // The address of the character model
    characterAddress: "2DCCUxXHybhgerZgtkPRzySDwFcVwf4R3nt8v3mV5UQk", // The character the resource is being equipped to
    resource: CHAKRA_RESOURCE_ADDRESS, // The address of the resource being equipped
    owner: wallet.publicKey.toString(), // The public key of the owner
    amount: "1", // The amount of the resource being equipped
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("Equip resource response:", response);
};

  const unEquipResource = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS || !CHARACTER_MODEL_ADDRESS) {
    alert("Missing required data");
    return;
  }

  console.log("resource:", CHAKRA_RESOURCE_ADDRESS)

  const { 
    createDismountResourceOnCharacterTransaction: txResponse // The transaction response that you have to get signed and send the transaction
} =
await client.createDismountResourceOnCharacterTransaction({
    characterModel: characterAdressess[0].address, // The address of the character model
    characterAddress: "2DCCUxXHybhgerZgtkPRzySDwFcVwf4R3nt8v3mV5UQk", // The character the resource is being equipped to
    resource: CHAKRA_RESOURCE_ADDRESS, // The address of the resource being equipped
    owner: wallet.publicKey.toString(), // The public key of the owner
    amount: "1", // The amount of the resource being equipped
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("UnEquip resource response:", response);
};

  const createMissionPool = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const {
  createCreateMissionPoolTransaction: {
      missionPoolAddress, // The address of the mission pool
      tx, // The transaction response, you'll need to sign and send this transaction
  },
} = await client.createCreateMissionPoolTransaction({
    data: {
        name: "Test Mission Pool4",
        project: PROJECT_ADDRESS,
        payer: PROJECT_AUTHORITY,
        authority: PROJECT_AUTHORITY,
        characterModel: "D5ufc817pv8q9EZSACGnG2mzr56nJwsMdch4JggAQME2", //hidden cloud water
    },
});

  const response = await sendClientTransactions(client, wallet, tx);
  console.log("create mission response:", response);
  console.log("Mission Pool response:", missionPoolAddress);
};

  const createDelegateAuthority = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const {
  createCreateDelegateAuthorityTransaction: txResponse // This is the transaction response, you'll need to sign and send this transaction
} = await client.createCreateDelegateAuthorityTransaction({
  authority: PROJECT_AUTHORITY,
  delegate: PROJECT_AUTHORITY,
  project: PROJECT_ADDRESS,
  // payer: txPayerPublicKey.toString(), // Optional, the transaction payer's public key
  serviceDelegations: {
      HiveControl: [ // Put the service name here, for example: HiveControl
        {
          // Each service's permissions enum can be imported from @honeycomb-protocol/edge-client
          permission: HiveControlPermissionInput.ManageProjectDriver,
          // In some cases an index will also be required in this object, for example: index: 0
        }
      ]
    }
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("createDelegateAuthority resource response:", response);
};

  const createMission = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const {
  createCreateMissionTransaction: {
      missionAddress, // The address of the mission
      tx, // The transaction response, you'll need to sign and send this transaction
  },
} = await client.createCreateMissionTransaction({
    data: {
        name: "Test mission2",
        project: PROJECT_ADDRESS,
        cost: {
            address: 'BGMzmEkoeVC3UXKLjW3tvAEkbs2uuMAihEd9buacH82u',//resourceAddress.toString()
            amount: "0",
        },
        duration: "30", // 1 day
        minXp: "10", // Minimum XP required to participate in the mission
        rewards: [
            {
                kind: RewardKind.Xp,
                max: "10",
                min: "10",
            },
            {
                kind: RewardKind.Resource,
                max: "10", 
                min: "10", 
                resource: 'BGMzmEkoeVC3UXKLjW3tvAEkbs2uuMAihEd9buacH82u',//resourceAddress.toString()
            },
        ],
        missionPool: '6gzDcJ6obkcsM1AkBDAYQCmiuf4sqU2VyvqBsxqc3gqQ',//missionPoolAddress.toString()
        authority: PROJECT_AUTHORITY,
        payer: PROJECT_AUTHORITY,
    },
});

  const response = await sendClientTransactions(client, wallet, tx);
  console.log("Create mission response:", response);
  console.log("create mission response:", missionAddress);
};

  const sendCharacterOnMission = async () => {
  if (!wallet.publicKey || !PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
    alert("Missing required data");
    return;
  }

  const matchingProfile = user?.profiles?.find(
  (profile) => profile?.project === PROJECT_ADDRESS
);

console.log("user id:", matchingProfile?.userId ?? "No matching user ID");
console.log("profile:", matchingProfile ?? "No matching profile");

  const {
  createSendCharactersOnMissionTransaction: txResponse // This is the transaction response, you'll need to sign and send this transaction 
} = await client.createSendCharactersOnMissionTransaction({
    data: {
        mission: "A2ikXUGuV7pufY7rH4df7gp1QAQmnzRqesCtzUMXDyy6",
        characterAddresses: ["8sKTLzchpcjoY98VgKntJq3UmNCEiDXUgDkjwZJnDYcc"],
        authority: wallet.publicKey.toString(),
        payer: PROJECT_AUTHORITY, // Optional
        userId: 840
    },
    lutAddresses: ["uqEc8rH4DitgDyJrEmoDFpD3eKuvVJ6GP7uDXrAzqgZ"]
});

  const response = await sendClientTransactions(client, wallet, txResponse);
  console.log("Burn resource response:", response);
};

  return (
    <div className="p-4">
      {wallet.publicKey ? (
        <p className="mb-2 text-black">
          Balance: {balance !== null ? `${balance} SOL` : "Loading..."}
        </p>
      ) : (
        <p className="mb-2 text-white">Wallet not connected</p>
      )}

      <button
        className="p-2 bg-amber-600 text-white rounded-lg"
        onClick={handleCreateProject}
      >
        Create Project
      </button>

      <button
        className="p-2 bg-amber-700 text-white rounded-lg"
        onClick={handleCreateChangeProjectDriverTransaction}
      >
        Changing the project driver
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createUser}
      >
        Create a User
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={findUsers}
      >
        Find User
      </button>

      <button
        className="p-2 bg-amber-900 text-white rounded-lg"
        onClick={authenticateWithEdgeClient}
      >
        Authenticate with Edge client
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createProfileTree}
      >
        Create profile tree
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createProfile}
      >
        Create profile
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={findProfiles}
      >
        Find profile
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={updateProfile}
      >
        Update profile
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={addXP}
      >
        add 100XP to profile
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createAssemblerConfig}
      >
        Create assembler config
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={addTraitsAndUri}
      >
        Add Traits
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createCharacterModel}
      >
        Create Character Model
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createCharacterTree}
      >
        Create Character Trees
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={makeCharacter}
      >
        Make Character
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createCharacterModelWithNFT}
      >
        Create Character with NFT
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createCharacterTreeWithNFT}
      >
        Create CharacterTree with NFT
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={wrapAssetsToCharacter}
      >
        Wrap characters to NFT
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={findCharacters}
      >
        find Characters
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={() => updateCharacterTraits(2)}
      >
        Update Character
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createResource}
      >
        Create Resource
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createResourceTree}
      >
        Create Resource Tree
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={mintResource}
      >
        Mint Resource
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={burnResource}
      >
        Burn Resource
      </button>

      <button
        className="p-2 bg-green-600 text-white rounded-lg"
        onClick={transferResourceWithAdminPayer}
      >
        Transfer Resource (Admin Pays Gas)
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={equipResource}
      >
        Eqip Resource
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={unEquipResource}
      >
        Uneqip Resource
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={claimBadge}
      >
        Claim Badge
      </button>
      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createMissionPool}
      >
        Create mission pool
      </button>
      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createMission}
      >
        Create mission
      </button>
      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={sendCharacterOnMission}
      >
        Send character on mission
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createDelegateAuthority}
      >
        Create delegate authority
      </button>

      <button
        className="p-2 bg-amber-800 text-white rounded-lg"
        onClick={createFaucet}
      >
        Create Resource Faucet
      </button>
    </div>
  );
}
