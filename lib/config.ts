export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PrepRadar";
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "");
export const DISCLAIMER = "Questions are reported by candidates and prep sources. Verify them before you rely on them.";
export const PRIVACY_NOTICE =
  "Your saved questions and progress are stored only in this browser. When you search, your topic and optional company are sent through this app's server route to OpenRouter and the selected model and search providers. Nothing is stored on our server.";
export const TOPIC_CHIPS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two pointers",
  "Sliding window",
  "Linked list",
  "Stack",
  "Binary search",
  "Trees",
  "Graphs",
  "Heap",
  "Backtracking",
  "Dynamic programming",
  "Greedy",
];
export const COMPANY_CHIPS = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Uber"];
