import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PROJECT_ADDRESS: process.env.PROJECT_ADDRESS,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_API_ID: process.env.FIREBASE_API_ID,
    PROFILE_TREE: process.env.PROFILE_TREE,
    PROJECT_AUTHORITY: process.env.PROJECT_AUTHORITY,
    ASSEMBLER_CONFIG_ADDRESS: process.env.ASSEMBLER_CONFIG_ADDRESS,
    CHARACTER_MODEL_ADDRESS: process.env.CHARACTER_MODEL_ADDRESS,
    CHARACTER_MODEL_TREE_ADDRESS: process.env.CHARACTER_MODEL_TREE_ADDRESS,
  },
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  }
};

export default nextConfig;
