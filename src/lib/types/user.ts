import { Profile } from "@honeycomb-protocol/edge-client";

export type User = {
  __typename?: 'User';
  address: Uint8Array;
  id: number;
  info: UserInfo;
  leaf_idx: bigint;
  profiles?: Profile[] | null;
  proof?: Proof | null;
  socialInfo: SocialInfo;
  tree_id: Uint8Array;
  wallets: Wallets;
};

export type UserInfo = {
  __typename?: 'UserInfo';
  bio: string;
  name: string;
  pfp: string;
  username: string;
};

export type UserInfoInput = {
  bio: string;
  name: string;
  pfp: string;
};

export type SocialInfo = {
  __typename?: 'SocialInfo';
  civic?: (CivicInfo | null)[] | null;
  discord?: string | null;
  steam?: string | null;
  twitter?: string | null;
};

export enum CivicGateway {
  IdVerificationPass = "IdVerificationPass",
  LivenessPass = "LivenessPass",
  UniquenessPass = "UniquenessPass"
}

export type CivicInfo = {
  __typename?: 'CivicInfo';
  expiry?: string | null;
  gatekeeperNetwork: CivicGateway;
  walletIndex: number;
};

export type CivicInfoInput = {
  gatekeeperNetwork: CivicGateway;
  wallet: string;
};

export type Wallets = {
  __typename?: 'Wallets';
  shadow: string; 
  wallets: string[]; 
};

export type Proof = {
  __typename?: 'Proof';
  canopy_depth: number;
  leaf: Uint8Array;
  leaf_index: bigint;
  maxDepth: number;
  node_index: bigint;
  proof: Uint8Array[];
  root: Uint8Array;
  tree_id: Uint8Array;
};

export type PlatformData = {
  __typename?: 'PlatformData';
  achievements: number[];
  custom: Record<string, string>; 
  xp: bigint;
};

export type ProfileInfo = {
  __typename?: 'ProfileInfo';
  bio?: string | null;
  name?: string | null;
  pfp?: string | null;
};
