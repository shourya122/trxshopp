// Strict email validation: format, disposable-domain block-list, and
// heuristics that reject obviously fake / random local parts like
// "198841814iwjsdjj@gmail.com".

const DISPOSABLE_DOMAINS = new Set<string>([
  "10minutemail.com","10minutemail.net","20minutemail.com","30minutemail.com",
  "mailinator.com","mailinator.net","mailinator2.com","mailnator.com",
  "guerrillamail.com","guerrillamail.net","guerrillamail.org","guerrillamail.biz",
  "guerrillamail.de","guerrillamailblock.com","sharklasers.com","grr.la",
  "tempmail.com","temp-mail.org","temp-mail.io","tempmailo.com","tempmail.dev",
  "tempmailaddress.com","tempmail.plus","tempmail.ninja","tmpmail.org","tmpmail.net",
  "trashmail.com","trashmail.net","trashmail.io","trashmail.de","trashmail.me",
  "yopmail.com","yopmail.net","yopmail.fr","cool.fr.nf","jetable.fr.nf",
  "getnada.com","nada.email","nadamail.com","dropmail.me","emailondeck.com",
  "moakt.com","moakt.co","disbox.net","disbox.org","fakemail.net","fakeinbox.com",
  "throwawaymail.com","throwaway.email","mytemp.email","tempinbox.com","tempinbox.co",
  "maildrop.cc","harakirimail.com","spam4.me","spamgourmet.com","mohmal.com",
  "mintemail.com","tempr.email","discard.email","discardmail.com","discardmail.de",
  "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org","mvrht.net",
  "einrot.com","einrot.de","spambox.us","spamex.com","mytrashmail.com",
  "mailcatch.com","mailnesia.com","tempemail.co","tempemail.com","tempemail.net",
  "burnermail.io","anonaddy.com","anonaddy.me","simplelogin.io","simplelogin.co",
  "duck.com","duckduckgo.com","proton.me.tempmail","mailtemp.info",
  "yopmail.info","dispostable.com","mailexpire.com","meltmail.com","spamherelots.com",
  "mailtothis.com","mail-temp.com","mailtemporaire.fr","tempemail.io","yopmailx.com",
  "throwam.com","mail.tm","mail.gw","freetempmail.online","emlpro.com",
  "getairmail.com","tempmailin.com","tempmails.net","onetimeemail.net","internxt.com",
]);

// Common role-based prefixes that suggest not a personal address
const ROLE_PREFIXES = new Set<string>([
  "admin","administrator","hostmaster","postmaster","webmaster","abuse",
  "noreply","no-reply","donotreply","test","testing","null","asdf","qwerty",
]);

// Popular provider domains — helps detect typos (kept small on purpose).
const KNOWN_PROVIDERS = [
  "gmail.com","googlemail.com","yahoo.com","yahoo.co.in","yahoo.co.uk",
  "outlook.com","hotmail.com","live.com","icloud.com","me.com","proton.me",
  "protonmail.com","aol.com","zoho.com","yandex.com","gmx.com","fastmail.com",
  "rediffmail.com",
];

const RFC_ISH =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$/;

function looksLikeGibberish(local: string): boolean {
  const s = local.toLowerCase();
  // Long run of consonants (no vowel/digit break) — random keyboard mash.
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(s)) return true;
  // Four+ identical chars in a row
  if (/(.)\1{3,}/.test(s)) return true;
  // Very low vowel ratio in long local parts
  const letters = s.replace(/[^a-z]/g, "");
  if (letters.length >= 8) {
    const vowels = (letters.match(/[aeiou]/g) || []).length;
    if (vowels / letters.length < 0.15) return true;
  }
  return false;
}

// Levenshtein for provider typo hints (tiny, small inputs only).
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export function suggestProvider(domain: string): string | null {
  const d = domain.toLowerCase();
  if (KNOWN_PROVIDERS.includes(d)) return null;
  for (const p of KNOWN_PROVIDERS) {
    if (editDistance(d, p) === 1) return p;
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return "Enter your email";
  if (email.length > 254) return "Email is too long";
  if (!RFC_ISH.test(email)) return "Enter a valid email address";

  const [local, domain] = email.split("@");
  if (!local || !domain) return "Enter a valid email address";
  if (local.length < 2) return "Email name is too short";
  if (local.length > 64) return "Email name is too long";
  if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return "Invalid email format";

  // Domain sanity: must have a TLD of 2+ letters (no digits-only TLD)
  const tld = domain.split(".").pop() || "";
  if (!/^[a-z]{2,}$/.test(tld)) return "Email domain looks invalid";

  // All-numeric local part like "198841814" — spam signal
  if (/^\d+$/.test(local)) return "Use your real email, not just numbers";

  // Digit-heavy random local part (long AND >60% digits)
  if (local.length >= 8) {
    const digits = (local.match(/\d/g) || []).length;
    if (digits / local.length > 0.6) return "Use your real email address";
  }

  if (looksLikeGibberish(local)) return "Email looks fake — use your real address";

  if (ROLE_PREFIXES.has(local)) return "Use a personal email address";

  if (DISPOSABLE_DOMAINS.has(domain))
    return "Temporary / disposable emails aren't allowed";

  const suggestion = suggestProvider(domain);
  if (suggestion) return `Did you mean @${suggestion}?`;

  return null;
}
