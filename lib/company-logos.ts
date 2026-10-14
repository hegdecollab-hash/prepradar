import { LOGOS } from "./company-logos.generated";

/** Normalized company name -> simple-icons slug. Only companies with a bundled logo. */
const ALIASES: Record<string, string> = {
  google: "google",
  alphabet: "google",
  "google deepmind": "google",
  youtube: "google",
  meta: "meta",
  facebook: "meta",
  "meta platforms": "meta",
  instagram: "meta",
  whatsapp: "meta",
  apple: "apple",
  uber: "uber",
  netflix: "netflix",
  "goldman sachs": "goldmansachs",
  goldman: "goldmansachs",
  atlassian: "atlassian",
  airbnb: "airbnb",
  nvidia: "nvidia",
  intel: "intel",
  paypal: "paypal",
  stripe: "stripe",
  spotify: "spotify",
  x: "x",
  twitter: "x",
  "x twitter": "x",
  tesla: "tesla",
  samsung: "samsung",
  "samsung r d": "samsung",
  cisco: "cisco",
  snap: "snapchat",
  snapchat: "snapchat",
  doordash: "doordash",
  shopify: "shopify",
  zoho: "zoho",
  swiggy: "swiggy",
  zomato: "zomato",
  paytm: "paytm",
  phonepe: "phonepe",
  razorpay: "razorpay",
  visa: "visa",
  mastercard: "mastercard",
  github: "github",
  dropbox: "dropbox",
  pinterest: "pinterest",
  reddit: "reddit",
  lyft: "lyft",
  bytedance: "bytedance",
  tiktok: "tiktok",
  qualcomm: "qualcomm",
  vmware: "vmware",
  sap: "sap",
  "sap labs": "sap",
  intuit: "intuit",
  ebay: "ebay",
  expedia: "expedia",
  coinbase: "coinbase",
  robinhood: "robinhood",
  databricks: "databricks",
  snowflake: "snowflake",
  palantir: "palantir",
  infosys: "infosys",
  tcs: "tcs",
  "tata consultancy services": "tcs",
  wipro: "wipro",
  accenture: "accenture",
  amazon: "amazon",
  "amazon com": "amazon",
  aws: "amazonwebservices",
  "amazon web services": "amazonwebservices",
  microsoft: "microsoft",
  adobe: "adobe",
  salesforce: "salesforce",
  oracle: "oracle",
  "oracle cloud": "oracle",
  flipkart: "flipkart",
  linkedin: "linkedin",
  ibm: "ibm",
  walmart: "walmart",
  "walmart global tech": "walmart",
  twilio: "twilio",
  yahoo: "yahoo",
  docusign: "docusign",
};

export const normalizeCompany = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|technologies|india|labs?)\b\.?/g, (m) =>
      m.startsWith("lab") ? m : "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export interface CompanyLogo {
  title: string;
  path: string;
  color: string;
}

/** Brand color, darkened to charcoal when too light to read on a white tile. */
function readable(hex: string): string {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? "#1f1f23" : `#${hex}`;
}

export function getCompanyLogo(name: string): CompanyLogo | null {
  const key = normalizeCompany(name);
  const slug = ALIASES[key] ?? ALIASES[key.split(" ")[0]] ?? null;
  const logo = slug ? LOGOS[slug] : undefined;
  return logo ? { title: logo.title, path: logo.path, color: readable(logo.hex) } : null;
}
