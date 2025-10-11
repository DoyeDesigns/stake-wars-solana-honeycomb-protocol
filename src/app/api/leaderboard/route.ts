import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

const ranks = [
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
];

interface ProfileCustomData {
  wins?: number;
  losses?: number;
  totalGames?: number;
  xp?: number;
  level?: number;
  [key: string]: unknown;
}

interface LeaderboardProfile {
  address: string;
  walletAddress: string;
  identity: string;
  userId: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  xp: number;
  level: number;
  rankName: string;
  rank: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'wins'; // wins, winRate, xp, level
    const limitCount = parseInt(searchParams.get('limit') || '100');

    console.log("Fetching leaderboard for project:", PROJECT_ADDRESS);

    if (!PROJECT_ADDRESS) {
      return NextResponse.json(
        { error: "Project address not configured" },
        { status: 500 }
      );
    }

    // Fetch all profiles for this project
    const { profile: profilesArray } = await client.findProfiles({
      projects: [PROJECT_ADDRESS], // Only get profiles from our project
      includeProof: false, // We don't need proofs for leaderboard
    });

    console.log(`Found ${profilesArray?.length || 0} profiles`);
    console.log("Profiles:", profilesArray);

    // Log first 3 profiles for inspection
    if (profilesArray && profilesArray.length > 0) {
      console.log("\n=== RAW PROFILE DATA (First 3 profiles) ===");
      profilesArray.slice(0, 3).forEach((profile, index) => {
        console.log(`\nProfile ${index + 1}:`);
        console.log("Address:", profile.address);
        console.log("Identity:", profile.identity);
        console.log("UserId:", profile.userId);
        console.log("CustomData (wins/losses):", profile.customData);
        console.log("PlatformData (xp/level):", profile.platformData);
        console.log("Full profile object:", JSON.stringify(profile, null, 2));
      });
      console.log("\n=== END RAW PROFILE DATA ===\n");

      // Fetch user data for these profiles
      try {
        const userIds = profilesArray
          .slice(0, 5) // Get user data for top 5 profiles
          .map(p => p.userId)
          .filter(Boolean);

        if (userIds.length > 0) {
          console.log("\n=== FETCHING USER DATA ===");
          console.log("UserIds to fetch:", userIds);

          const { user: usersArray } = await client.findUsers({
            ids: userIds.map(id => Number(id)),
            includeProof: false,
          });

          console.log(`\nFound ${usersArray?.length || 0} users`);
          
          if (usersArray && usersArray.length > 0) {
            usersArray.forEach((user, index) => {
              console.log(`\n--- USER ${index + 1} DATA ---`);
              console.log("User ID:", user.id);
              console.log("Wallet:", user.wallets);
              console.log("Address:", user.address);
              console.log("Info:", user.info);
              console.log("Full user object:", JSON.stringify(user, null, 2));
            });
          } else {
            console.log("No users found for the given IDs");
          }
          console.log("\n=== END USER DATA ===\n");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    if (!profilesArray || profilesArray.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        count: 0,
      });
    }

    // Fetch user data for all profiles to get wallet addresses
    const userIdToWalletMap = new Map<string, string>();
    try {
      const userIds = profilesArray
        .map(p => p.userId)
        .filter(Boolean);

      if (userIds.length > 0) {
        console.log("\n=== FETCHING ALL USER DATA FOR WALLET ADDRESSES ===");
        const { user: usersArray } = await client.findUsers({
          ids: userIds.map(id => Number(id)),
          includeProof: false,
        });

        if (usersArray && usersArray.length > 0) {
          usersArray.forEach((user) => {
            const walletAddress = user.wallets?.wallets?.[0] || '';
            if (walletAddress) {
              userIdToWalletMap.set(String(user.id), walletAddress);
            }
          });
          console.log(`Mapped ${userIdToWalletMap.size} users to wallet addresses`);
        }
        console.log("=== END FETCHING USER DATA ===\n");
      }
    } catch (error) {
      console.error("Error fetching user wallet addresses:", error);
    }

    // Process profiles and extract stats from customData and platformData
    const processedProfiles: LeaderboardProfile[] = profilesArray
      .map((profile, index) => {
        // Parse customData if it's a string (for wins/losses)
        let customData: ProfileCustomData = {};
        
        try {
          if (typeof profile.customData === 'string') {
            customData = JSON.parse(profile.customData);
          } else if (typeof profile.customData === 'object' && profile.customData !== null) {
            customData = profile.customData as ProfileCustomData;
          }
          
          // Log parsed data for first 3 profiles
          if (index < 3) {
            console.log(`Profile ${index + 1} customData:`, customData);
            console.log(`Profile ${index + 1} platformData:`, profile.platformData);
          }
        } catch (error) {
          console.error(`Failed to parse customData for profile ${profile.address}:`, error);
          customData = {};
        }

        // Get stats from customData (wins/losses)
        const wins = Number(customData.wins) || 0;
        const losses = Number(customData.losses) || 0;
        const totalGames = wins + losses;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
        
        // Get XP from platformData
        const xp = Number(profile.platformData?.xp) || 0;
        
        // Calculate level based on XP (same as NinjaRanks)
        const xpPerLevel = 500;
        const thresholds = ranks.map((_, i) => xpPerLevel * (i + 1));
        const currentLevelIndex = thresholds.findIndex((reqXp) => xp < reqXp);
        const level = currentLevelIndex === -1 ? ranks.length : currentLevelIndex + 1;
        const rankName = ranks[currentLevelIndex === -1 ? ranks.length - 1 : currentLevelIndex] || "Academy Student";

        // Get wallet address from user data map
        const walletAddress = userIdToWalletMap.get(String(profile.userId)) || profile.address;

        return {
          address: profile.address,
          walletAddress,
          identity: profile.identity || 'Anonymous',
          userId: profile.userId ? String(profile.userId) : '',
          wins,
          losses,
          totalGames,
          winRate: Math.round(winRate * 100) / 100, // Round to 2 decimals
          xp,
          level,
          rankName,
          rank: 0, // Will be set after sorting
        };
      })
      .filter((profile) => {
        // Only include profiles with at least some activity
        return profile.totalGames > 0 || profile.xp > 0;
      });

    // Sort based on requested criteria
    processedProfiles.sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          // Sort by win rate, then by total games (tiebreaker)
          if (b.winRate !== a.winRate) {
            return b.winRate - a.winRate;
          }
          return b.totalGames - a.totalGames;
        
        case 'xp':
          return b.xp - a.xp;
        
        case 'level':
          // Sort by level, then by XP (tiebreaker)
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.xp - a.xp;
        
        case 'wins':
        default:
          // Sort by wins, then by win rate (tiebreaker)
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          return b.winRate - a.winRate;
      }
    });

    // Assign ranks
    processedProfiles.forEach((profile, index) => {
      profile.rank = index + 1;
    });

    // Apply limit
    const limitedProfiles = processedProfiles.slice(0, limitCount);

    // Log final processed leaderboard (first 5 entries)
    console.log("\n=== PROCESSED LEADERBOARD (Top 5) ===");
    limitedProfiles.slice(0, 5).forEach((profile) => {
      console.log(`\nRank #${profile.rank}: ${profile.walletAddress}`);
      console.log(`  Wins: ${profile.wins}, Losses: ${profile.losses}`);
      console.log(`  Win Rate: ${profile.winRate}%`);
      console.log(`  Level: ${profile.level} (${profile.rankName}), XP: ${profile.xp}`);
      console.log(`  Total Games: ${profile.totalGames}`);
    });
    console.log("\n=== END PROCESSED LEADERBOARD ===\n");

    return NextResponse.json({
      success: true,
      leaderboard: limitedProfiles,
      count: limitedProfiles.length,
      totalProfiles: processedProfiles.length,
      sortBy,
    });

  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: `Failed to fetch leaderboard: ${error}` },
      { status: 500 }
    );
  }
}

