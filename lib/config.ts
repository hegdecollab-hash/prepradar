export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PrepRadar";
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "");
export const DISCLAIMER = "Questions reported by candidates and prep sources. Verify before relying on them.";
export const PRIVACY_NOTICE =
  "Your saved questions and progress are stored only in this browser. When you search, your topic and optional company are sent through this app's server route to OpenRouter and the selected model and search providers. We do not store them on our server.";
export const WHATSAPP_URL = `https://wa.me/918500097071?text=${encodeURIComponent(
  "Hi FlowSite AI, I saw PrepRadar and would like a similar website. Can we discuss the scope?",
)}`;
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
