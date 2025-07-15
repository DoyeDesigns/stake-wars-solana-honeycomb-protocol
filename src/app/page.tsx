"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { client } from "@/utils/constants/client";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BadgesCondition } from "@honeycomb-protocol/edge-client";
import base58 from "bs58";
import { MintAsKind } from "@honeycomb-protocol/edge-client";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [accessToken, setAccesstoken] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.publicKey) {
        const lamports = await connection.getBalance(wallet.publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
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
      name: "Test Project", // Name of the project
      authority: wallet.publicKey.toBase58(), // Public key of the project authority, this authority has complete control over the project
      payer: wallet.publicKey.toBase58(), // Optional public key of the payer, the payer pays the transaction fees for creating this project
      profileDataConfig: {
        achievements: [
          // Specify an array of achievements that you want to be able to set on your users' profiles
          "Pioneer",
          "jonin",
          "chunin",
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
  };

  const handleCreateChangeProjectDriverTransaction = async () => {
    const {
      createChangeProjectDriverTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createChangeProjectDriverTransaction({
      authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // Provide the project authority's public key
      project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6", // The project's public key
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

    const {
      createCreateProfilesTreeTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createCreateProfilesTreeTransaction({
      payer: wallet.publicKey.toString(),
      project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
      treeConfig: {
        // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)
        basic: {
          numAssets: 100000, // The desired number of profiles this tree will be able to store
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
    const usersArray = await client
      .findUsers({
        // All filters below are optional
        wallets: ["7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7"], // String array of users' wallet addresses
        // addresses: ["69GyuuMHVSXCNVf6htoBfbAFdduV6tjJoQ2fHYtYnqwo"], // String array of Honeycomb Protocol user account addresses
        ids: [], // Integer array of Honeycomb Protocol user account IDs
        includeProof: true, // Optional, set to true if you want to include the proof of the user's account
      })
      .then(({ user }) => user); // This will be an array of users

    console.log("Found users:", usersArray);
  };

  const findProfiles = async () => {
    const profilesArray = await client
      .findProfiles({
        // All filters below are optional
        // userIds: [740], // Integer array of Honeycomb Protocol user account IDs
        projects: ["5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6"], // String array of project addresses
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

    const {
      createNewProfileTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    } = await client.createNewProfileTransaction(
      {
        project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6", // The project's public key
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
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createUpdatePlatformDataTransaction: txResponse } =
      await client.createUpdatePlatformDataTransaction({
        profile: "G8KgdHdWc8ruPuxfvJKFVFypcwtJMwbC579v4WyLJUAa", // The profile's public key
        authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // The public key of the project authority
        platformData: {
          addXp: "100", // Optional, how much XP to award to the player
          addAchievements: [1], // Optional, an array containing indexes of the achievements to add
          custom: {
            // Optional, add/remove any custom data to the profile
            add: [["location", "San Francisco, CA"]],
          },
        },
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse // Pass only the transaction object
    );

    console.log("Update platform data transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  };

  const createAssemblerConfig = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createCreateAssemblerConfigTransaction: txResponse } =
      await client.createCreateAssemblerConfigTransaction({
        project: "AeWdewLTQXP3FuwKDGr475zsngppXEUYythQkatKBBYu",
        authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // The public key of the project authority
        // payer: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // Optional payer
        treeConfig: {
          // This tree is used to store character traits and their necessary information
          // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)
          // basic: {
          //   numAssets: 10000, // The desired number of character information this tree will be able to store
          // },
          // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)
          advanced: {
            maxDepth: 20, // Max depth of the tree
            maxBufferSize: 64, // Max buffer size of the tree
            canopyDepth: 14, // Canopy depth of the tree
          },
        },
        ticker: "testing1", // Provide a unique ticker for the config (the ticker ID only needs to be unique within the project)
        order: [
          "Background",
          "Skin",
          "Expression",
          "Clothes",
          "Armor",
          "Weapon",
          "Shield",
        ], // Provide the character traits here; the order matters, in the example order, the background image will be applied and then the skin, expression, clothes, armor, weapon, and shield (if you need your character's expression to appear over the skin, the skin needs to come first in the order)
      });

    const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse.tx // Pass only the transaction object
    );

    console.log("Create assembler config transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  };

  const addTraitsAndUri = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

   const { createAddCharacterTraitsTransactions: txResponse } = await client.createAddCharacterTraitsTransactions({
  traits: [
  // Attack options
  { layer: "Attack1", name: "Slash", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },
  { layer: "Attack2", name: "Lightning", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },
  { layer: "Attack3", name: "Poison", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },
  { layer: "Attack4", name: "Fireball", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },

  // Defense options
  { layer: "Defense1", name: "Block", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },
  { layer: "Defense2", name: "Dodge", uri: "https://bronze-tired-quelea-579.mypinata.cloud/ipfs/bafkreibiy2gxpwpn47wzqeyeq5jxntj4rtg2uvkl5psfooysv6lc4ji2cy" },
],
  assemblerConfig: "DTRjHc6CG9RTydTaWdiZFzqQNLEpGwRk9ufKnMvaCyNB",
  authority: '7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7',
  payer: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",
});

const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse // Pass only the transaction object
    );

    console.log("Add traits transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  }

  const createCharacterModel = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createCreateCharacterModelTransaction: txResponse } = await client.createCreateCharacterModelTransaction({
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
  authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",
  // payer: adminPublicKey.toString(), // Optional, use this if you want a different wallet to pay the transaction fee, by default the authority pays for this tx
  mintAs: { // Optional, you can define the underlying protocol, default is MplCore
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
      assemblerConfig: "DTRjHc6CG9RTydTaWdiZFzqQNLEpGwRk9ufKnMvaCyNB",
      collectionName: "Assembled NFT Collection",
      name: "Assembled Character NFT 0",
      symbol: "ACNFT",
      description: "Creating this NFT with assembler",
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",
          share: 100,
        },
      ],
    },
  },
  attributes: [
  ["Attack1", "Fireball"],
  ["Attack2", "Lightning"],
  ["Attack3", "Poison"],
  ["Attack4", "Slash"],
  ["Defense1", "Block"],
  ["Defense2", "Dodge"],
],
  // cooldown: { // Optional, add a cool down period (in seconds) before the characters can be unwrapped
  //   ejection: 1, // Ejection/unwrap cool down (in seconds)
  // }
});

const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse.tx // Pass only the transaction object
    );

    console.log("Create character model transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  }

  const createCharacterTree = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createCreateCharactersTreeTransaction: txResponse } = await client.createCreateCharactersTreeTransaction({
  authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
  characterModel: characterModelAddress.toString(),
  // payer: adminPublicKey.toString(), // Optional, only use if you want to pay from a different wallet
  treeConfig: { // Tree configuration, this affects how many characters this tree can store
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

    console.log("Create characters tree transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  }

  const makeCharacter = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createAssembleCharacterTransaction: txResponse } = await client.createAssembleCharacterTransaction({
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6", // Project public key as a string
  assemblerConfig: "DTRjHc6CG9RTydTaWdiZFzqQNLEpGwRk9ufKnMvaCyNB", // Assembler config address as a string
  characterModel: "", // Character model public key as a string
  wallet: wallet.publicKey.toString(), // User wallet public key as a string, this user will receive the character
  payer: wallet.publicKey.toString(), // User wallet public key as a string, this user will receive the character
  attributes: [ // Define the character's attributes here in string tuple format
    ["Weapon", "Bow"],
    ["Armor", "Helmet"],
  ],
});

const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse // Pass only the transaction object
    );

    console.log("Assemble character transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  }

  const createCharacterModelWithNFT = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

   const { createCreateCharacterModelTransaction: txResponse } = await client.createCreateCharacterModelTransaction({
  authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7", // Project authority public key as a string
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
  // payer: adminPublicKey.toString(), // Optional, if you want to pay from a different wallet
  config: {
    kind: "Wrapped",
    criterias: [
      {
        kind: "Collection", // Can be Collection, Creator, or MerkleTree
        params: "CYeV3G456or8Dfo1NUhsVX9mwUyDFjWNLo5KJQ4udWU5", // Provide the relevant address here
      }
    ]
  },
  cooldown: { // Optional, add a cool down period (in seconds) before the characters can be unwrapped
    ejection: 1, // Ejection/unwrap cool down (in seconds)
  }
});

const response = await sendClientTransactions(
      client, // The client instance you created earlier in the setup
      wallet, // The wallet you got from the useWallet hook
      txResponse.tx // Pass only the transaction object
    );

    console.log("Create character model with NFT transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
  }

  const createCharacterTreeWithNFT = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createCreateCharactersTreeTransaction: txResponse } = await client.createCreateCharactersTreeTransaction({
  authority: "7bE7J6BYD7Mk3LHa3H7TcANkhUfGt9cdJDaFmry7zax7",
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
  characterModel: "CMSwAbkQ4b4EHrrZWvUbMYmC1wViGWMizcTbFTdSYH3z",
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

    console.log("Create characters tree with NFT transaction response:", txResponse);
    console.log("Response after sending transaction:", response);
}


const wrapAssetsToCharacter = async () => {
  if (!wallet.publicKey) {
    alert("Wallet not connected!");
    return;
  }

  const { createWrapAssetsToCharacterTransactions: txResponse } = await client.createWrapAssetsToCharacterTransactions({
  project: "5EbCTWoHQW6fKP6kJbx2MuJbpE5ntmPekcznaVSrrpp6",
  mintList: ["CYeV3G456or8Dfo1NUhsVX9mwUyDFjWNLo5KJQ4udWU5"], // Provide NFT addresses here,
  wallet: wallet.publicKey.toString(), // User's wallet public key as a string
  characterModel: "EHxdPL8Fk7kCXWLpQdTgBz8356SY96bmmqFZXVfcoSA4",
});

  const response = await sendClientTransactions(
    client,
    wallet,
    txResponse
  );

  console.log("Wrap assets to character transaction response:", txResponse);
  console.log("Response after sending transaction:", response);
}

const findCharacters = async () => {
  if (!wallet.publicKey) {
    alert("Wallet not connected!");
    return;
  }

  const result = await client.findCharacters({
  addresses: [], // String array of character addresses
  includeProof: true, // Boolean to include proof or not
  filters: {}, // Available filters are usedBy, owner, and source
  mints: ["7A8Ko711UwqcyUcWGtHSQWdhgFZT2sQEW2mjvJGyDbkv"], // Array of NFT mint public keys as a string
  trees: [], // Array of character model merkle tree public keys as a string
  wallets: [], // Array of wallet public keys as a string (wallets that own the characters)
  attributeHashes: [] // Array of attribute hashes as a string
}).then(({ character }) => character);

console.log("Found characters:", result); 
}

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
      
    </div>
  );
}
