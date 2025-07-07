// Test configuration and API key setup
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔧 Testing configuration...\n");

// Check environment variables
const apiKey = process.env.PERPLEXITY_API_KEY;
const model = process.env.PERPLEXITY_MODEL || "sonar-pro";

console.log("Environment Variables:");
console.log(`- PERPLEXITY_API_KEY: ${apiKey ? "✅ Set" : "❌ Not set"}`);
console.log(`- PERPLEXITY_MODEL: ${model}`);

if (!apiKey) {
  console.error("\n❌ ERROR: PERPLEXITY_API_KEY is not set!");
  console.error("Please create a .env file with your Perplexity API key:");
  console.error("PERPLEXITY_API_KEY=your_api_key_here");
  process.exit(1);
}

console.log("\n✅ Configuration looks good!");
console.log("You can now run your agent with: pnpm run dev");
