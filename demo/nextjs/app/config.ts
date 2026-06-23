export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.vercel.app" 
export const BOT_USERNAME = "App_Bot"

export const APP_CONFIG = {
  name: "Enter the app name here",
  description: "Include a description of the app here",
  url: APP_URL,
  icon: `${APP_URL}/icon.svg`,
  color: "#0f0f0f",
  botUsername: BOT_USERNAME,
  walletAddress: "UQD...",
  miniAppUrl: `https://t.me/${BOT_USERNAME}/App`, 
  botUrl: `https://t.me/${BOT_USERNAME}`, 
  manifestTonUrl: `${APP_URL}/api/ton-manifest.json`,    
} as const
