// Postal-code validation per country, plus India state→PIN-prefix mapping.

const COUNTRY_POSTAL_REGEX: Record<string, { re: RegExp; example: string }> = {
  India: { re: /^[1-9]\d{5}$/, example: "6 digits, e.g. 110001" },
  "United States": { re: /^\d{5}(-\d{4})?$/, example: "5 digits, e.g. 90210" },
  Canada: { re: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, example: "A1A 1A1" },
  "United Kingdom": {
    re: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    example: "e.g. SW1A 1AA",
  },
  Australia: { re: /^\d{4}$/, example: "4 digits" },
  Germany: { re: /^\d{5}$/, example: "5 digits" },
  France: { re: /^\d{5}$/, example: "5 digits" },
  Italy: { re: /^\d{5}$/, example: "5 digits" },
  Spain: { re: /^\d{5}$/, example: "5 digits" },
  Netherlands: { re: /^\d{4}\s?[A-Za-z]{2}$/, example: "1234 AB" },
  Belgium: { re: /^\d{4}$/, example: "4 digits" },
  Switzerland: { re: /^\d{4}$/, example: "4 digits" },
  Austria: { re: /^\d{4}$/, example: "4 digits" },
  Portugal: { re: /^\d{4}-\d{3}$/, example: "1234-567" },
  Ireland: { re: /^[A-Za-z]\d{2}\s?[A-Za-z\d]{4}$/, example: "D02 X285" },
  Sweden: { re: /^\d{3}\s?\d{2}$/, example: "123 45" },
  Norway: { re: /^\d{4}$/, example: "4 digits" },
  Denmark: { re: /^\d{4}$/, example: "4 digits" },
  Finland: { re: /^\d{5}$/, example: "5 digits" },
  Poland: { re: /^\d{2}-\d{3}$/, example: "12-345" },
  "Czech Republic": { re: /^\d{3}\s?\d{2}$/, example: "123 45" },
  Czechia: { re: /^\d{3}\s?\d{2}$/, example: "123 45" },
  Hungary: { re: /^\d{4}$/, example: "4 digits" },
  Romania: { re: /^\d{6}$/, example: "6 digits" },
  Greece: { re: /^\d{3}\s?\d{2}$/, example: "123 45" },
  Russia: { re: /^\d{6}$/, example: "6 digits" },
  Ukraine: { re: /^\d{5}$/, example: "5 digits" },
  Turkey: { re: /^\d{5}$/, example: "5 digits" },
  Brazil: { re: /^\d{5}-?\d{3}$/, example: "12345-678" },
  Mexico: { re: /^\d{5}$/, example: "5 digits" },
  Argentina: { re: /^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/, example: "C1425CLA" },
  Chile: { re: /^\d{7}$/, example: "7 digits" },
  Colombia: { re: /^\d{6}$/, example: "6 digits" },
  Japan: { re: /^\d{3}-?\d{4}$/, example: "123-4567" },
  China: { re: /^\d{6}$/, example: "6 digits" },
  "South Korea": { re: /^\d{5}$/, example: "5 digits" },
  Singapore: { re: /^\d{6}$/, example: "6 digits" },
  Malaysia: { re: /^\d{5}$/, example: "5 digits" },
  Indonesia: { re: /^\d{5}$/, example: "5 digits" },
  Thailand: { re: /^\d{5}$/, example: "5 digits" },
  Philippines: { re: /^\d{4}$/, example: "4 digits" },
  Vietnam: { re: /^\d{6}$/, example: "6 digits" },
  Pakistan: { re: /^\d{5}$/, example: "5 digits" },
  Bangladesh: { re: /^\d{4}$/, example: "4 digits" },
  "Sri Lanka": { re: /^\d{5}$/, example: "5 digits" },
  Nepal: { re: /^\d{5}$/, example: "5 digits" },
  "United Arab Emirates": { re: /^.{0,10}$/, example: "Optional" },
  "Saudi Arabia": { re: /^\d{5}(-\d{4})?$/, example: "5 digits" },
  Israel: { re: /^\d{5}(\d{2})?$/, example: "5 or 7 digits" },
  Egypt: { re: /^\d{5}$/, example: "5 digits" },
  "South Africa": { re: /^\d{4}$/, example: "4 digits" },
  Nigeria: { re: /^\d{6}$/, example: "6 digits" },
  Kenya: { re: /^\d{5}$/, example: "5 digits" },
  "New Zealand": { re: /^\d{4}$/, example: "4 digits" },
};

// First digit of an Indian PIN ↔ allowed states (postal circles).
const INDIA_PIN_PREFIX_BY_STATE: Record<string, string[]> = {
  Delhi: ["1"], Haryana: ["1"], Punjab: ["1"], "Himachal Pradesh": ["1"],
  "Jammu and Kashmir": ["1"], Ladakh: ["1"], Chandigarh: ["1"],
  "Uttar Pradesh": ["2"], Uttarakhand: ["2"],
  Rajasthan: ["3"], Gujarat: ["3"], "Dadra and Nagar Haveli and Daman and Diu": ["3"],
  Chhattisgarh: ["4"], "Madhya Pradesh": ["4"], Maharashtra: ["4"], Goa: ["4"],
  "Andhra Pradesh": ["5"], Karnataka: ["5"], Telangana: ["5"],
  Kerala: ["6"], "Tamil Nadu": ["6"], Puducherry: ["6"], Lakshadweep: ["6"],
  "West Bengal": ["7"], Odisha: ["7"], "Arunachal Pradesh": ["7"], Assam: ["7"],
  Manipur: ["7"], Meghalaya: ["7"], Mizoram: ["7"], Nagaland: ["7"], Sikkim: ["7"],
  Tripura: ["7"], "Andaman and Nicobar Islands": ["7"],
  Bihar: ["8"], Jharkhand: ["8"],
};

// US ZIP first-digit ranges by state (approximate — covers each state's primary block).
const US_ZIP_PREFIX_BY_STATE: Record<string, string[]> = {
  Massachusetts: ["0"], "Rhode Island": ["0"], "New Hampshire": ["0"], Maine: ["0"],
  Vermont: ["0"], Connecticut: ["0"], "New Jersey": ["0"],
  "New York": ["1"], Pennsylvania: ["1"], Delaware: ["1"],
  "District of Columbia": ["2"], Maryland: ["2"], Virginia: ["2"], "West Virginia": ["2"],
  "North Carolina": ["2"], "South Carolina": ["2"],
  Florida: ["3"], Georgia: ["3"], Alabama: ["3"], Tennessee: ["3"], Mississippi: ["3"],
  Kentucky: ["4"], Ohio: ["4"], Indiana: ["4"], Michigan: ["4"],
  Iowa: ["5"], Wisconsin: ["5"], Minnesota: ["5"], "South Dakota": ["5"],
  "North Dakota": ["5"], Montana: ["5"],
  Illinois: ["6"], Missouri: ["6"], Kansas: ["6"], Nebraska: ["6"],
  Louisiana: ["7"], Arkansas: ["7"], Oklahoma: ["7"], Texas: ["7", "8"],
  Colorado: ["8"], Wyoming: ["8"], Idaho: ["8"], Utah: ["8"],
  Arizona: ["8"], "New Mexico": ["8"], Nevada: ["8", "9"],
  California: ["9"], Oregon: ["9"], Washington: ["9"], Alaska: ["9"], Hawaii: ["9"],
};

// Canada postal letter (first character) by province.
const CA_POSTAL_PREFIX_BY_STATE: Record<string, string[]> = {
  "Newfoundland and Labrador": ["A"],
  "Nova Scotia": ["B"],
  "Prince Edward Island": ["C"],
  "New Brunswick": ["E"],
  Quebec: ["G", "H", "J"],
  Ontario: ["K", "L", "M", "N", "P"],
  Manitoba: ["R"],
  Saskatchewan: ["S"],
  Alberta: ["T"],
  "British Columbia": ["V"],
  "Northwest Territories": ["X"], Nunavut: ["X"],
  Yukon: ["Y"],
};

// Australian 4-digit postcode ranges by state.
const AU_POSTAL_RANGES_BY_STATE: Record<string, Array<[number, number]>> = {
  "New South Wales": [[1000, 2599], [2619, 2899], [2921, 2999]],
  "Australian Capital Territory": [[200, 299], [2600, 2618], [2900, 2920]],
  Victoria: [[3000, 3999], [8000, 8999]],
  Queensland: [[4000, 4999], [9000, 9999]],
  "South Australia": [[5000, 5999]],
  "Western Australia": [[6000, 6999]],
  Tasmania: [[7000, 7999]],
  "Northern Territory": [[800, 999]],
};

// Germany PLZ (5 digits) — leading 2 digits by state.
const DE_POSTAL_PREFIX_BY_STATE: Record<string, string[]> = {
  "Schleswig-Holstein": ["22","23","24","25"],
  Hamburg: ["20","21","22"],
  "Lower Saxony": ["26","27","28","29","30","31","37","38","48","49"],
  Bremen: ["27","28"],
  "North Rhine-Westphalia": ["32","33","40","41","42","44","45","46","47","48","50","51","52","53","57","58","59"],
  Hesse: ["34","35","36","60","61","63","64","65"],
  "Rhineland-Palatinate": ["54","55","56","66","67","76"],
  Saarland: ["66"],
  "Baden-Württemberg": ["68","69","70","71","72","73","74","75","76","77","78","79","88","89"],
  Bavaria: ["80","81","82","83","84","85","86","87","90","91","92","93","94","95","96","97"],
  Berlin: ["10","12","13","14"],
  Brandenburg: ["03","14","15","16","17","19"],
  "Mecklenburg-Vorpommern": ["17","18","19","23"],
  Saxony: ["01","02","04","08","09"],
  "Saxony-Anhalt": ["06","39"],
  Thuringia: ["07","36","37","98","99"],
};

// Brazil CEP (first 5 digits) numeric ranges by state.
const BR_POSTAL_RANGES_BY_STATE: Record<string, Array<[number, number]>> = {
  "São Paulo": [[1000, 19999]],
  "Rio de Janeiro": [[20000, 28999]],
  "Espírito Santo": [[29000, 29999]],
  "Minas Gerais": [[30000, 39999]],
  Bahia: [[40000, 48999]],
  Sergipe: [[49000, 49999]],
  Pernambuco: [[50000, 56999]],
  Alagoas: [[57000, 57999]],
  Paraíba: [[58000, 58999]],
  "Rio Grande do Norte": [[59000, 59999]],
  Ceará: [[60000, 63999]],
  Piauí: [[64000, 64999]],
  Maranhão: [[65000, 65999]],
  Pará: [[66000, 68899]],
  Amapá: [[68900, 68999]],
  Amazonas: [[69000, 69299], [69400, 69899]],
  Roraima: [[69300, 69399]],
  Acre: [[69900, 69999]],
  "Distrito Federal": [[70000, 72799], [73000, 73699]],
  Goiás: [[72800, 72999], [73700, 76799]],
  Tocantins: [[77000, 77999]],
  "Mato Grosso": [[78000, 78899]],
  Rondônia: [[76800, 76999]],
  "Mato Grosso do Sul": [[79000, 79999]],
  Paraná: [[80000, 87999]],
  "Santa Catarina": [[88000, 89999]],
  "Rio Grande do Sul": [[90000, 99999]],
};

// UK outward-code area letters (1-2 leading letters) by constituent country.
const UK_POSTAL_AREAS_BY_STATE: Record<string, string[]> = {
  England: [
    "B","BA","BB","BD","BH","BL","BN","BR","BS","CA","CB","CH","CM","CO","CR","CT","CV","CW",
    "DA","DE","DH","DL","DN","DT","DY","E","EC","EN","EX","FY","GL","GU","HA","HD","HG","HP",
    "HR","HU","HX","IG","IP","KT","L","LA","LE","LN","LS","LU","M","ME","MK","N","NE","NG",
    "NN","NR","NW","OL","OX","PE","PL","PO","PR","RG","RH","RM","S","SE","SG","SK","SL","SM",
    "SN","SO","SP","SR","SS","ST","SW","TA","TF","TN","TQ","TR","TS","TW","UB","W","WA","WC",
    "WD","WF","WN","WR","WS","WV","YO",
  ],
  Scotland: ["AB","DD","DG","EH","FK","G","HS","IV","KA","KW","KY","ML","PA","PH","TD","ZE"],
  Wales: ["CF","LD","LL","NP","SA","SY"],
  "Northern Ireland": ["BT"],
};

function inRanges(code: string, ranges: Array<[number, number]>): boolean {
  const n = parseInt(code.replace(/\D+/g, "").slice(0, 5), 10);
  if (!Number.isFinite(n)) return false;
  return ranges.some(([a, b]) => n >= a && n <= b);
}

// Reject obvious spam: all-same digits (1111, 000000), trivial sequences
// (12345, 123456, 654321), or too few unique digits (e.g. 121212).
function isSpammyPostal(digits: string): boolean {
  if (digits.length < 3) return false;
  if (/^(\d)\1+$/.test(digits)) return true;
  const asc = "0123456789";
  const desc = "9876543210";
  if (asc.includes(digits) || desc.includes(digits)) return true;
  const unique = new Set(digits.split("")).size;
  if (digits.length >= 5 && unique <= 2) return true;
  return false;
}

export function validatePostal(country: string, state: string, postal: string): string | null {
  const trimmed = postal.trim();
  if (!trimmed) return "Postal code is required";
  const rule = COUNTRY_POSTAL_REGEX[country];
  if (rule && !rule.re.test(trimmed)) return `Invalid postal code (${rule.example})`;
  const digits = trimmed.replace(/\D+/g, "");
  if (digits && isSpammyPostal(digits)) return "Enter a real postal code";
  if (!state) return null;

  if (country === "India") {
    const allowed = INDIA_PIN_PREFIX_BY_STATE[state];
    if (allowed && !allowed.includes(trimmed[0])) {
      return `PIN does not match ${state} (must start with ${allowed.join("/")})`;
    }
  } else if (country === "United States") {
    const allowed = US_ZIP_PREFIX_BY_STATE[state];
    if (allowed && !allowed.includes(trimmed[0])) {
      return `ZIP does not match ${state} (must start with ${allowed.join("/")})`;
    }
  } else if (country === "Canada") {
    const allowed = CA_POSTAL_PREFIX_BY_STATE[state];
    const first = trimmed[0]?.toUpperCase();
    if (allowed && first && !allowed.includes(first)) {
      return `Postal code does not match ${state} (must start with ${allowed.join("/")})`;
    }
  } else if (country === "Australia") {
    const ranges = AU_POSTAL_RANGES_BY_STATE[state];
    if (ranges && !inRanges(trimmed, ranges)) {
      return `Postcode does not match ${state}`;
    }
  } else if (country === "Germany") {
    const allowed = DE_POSTAL_PREFIX_BY_STATE[state];
    if (allowed && !allowed.includes(trimmed.slice(0, 2))) {
      return `PLZ does not match ${state}`;
    }
  } else if (country === "Brazil") {
    const ranges = BR_POSTAL_RANGES_BY_STATE[state];
    if (ranges && !inRanges(trimmed, ranges)) {
      return `CEP does not match ${state}`;
    }
  } else if (country === "United Kingdom") {
    const areas = UK_POSTAL_AREAS_BY_STATE[state];
    const m = trimmed.toUpperCase().match(/^[A-Z]{1,2}/);
    if (areas && m && !areas.includes(m[0])) {
      return `Postcode does not match ${state}`;
    }
  }
  return null;
}


export function postalPlaceholder(country: string): string {
  return COUNTRY_POSTAL_REGEX[country]?.example ?? "";
}

// Max characters to allow in the postal input for a country (anti-spam clamp).
export function postalMaxLen(country: string): number {
  const src = COUNTRY_POSTAL_REGEX[country]?.re?.source ?? "";
  // Fallback generous cap; specific caps per known formats.
  const caps: Record<string, number> = {
    India: 6, "United States": 10, Canada: 7, "United Kingdom": 8,
    Australia: 4, Germany: 5, France: 5, Italy: 5, Spain: 5,
    Netherlands: 7, Belgium: 4, Switzerland: 4, Austria: 4,
    Portugal: 8, Ireland: 8, Sweden: 6, Norway: 4, Denmark: 4,
    Finland: 5, Poland: 6, "Czech Republic": 6, Czechia: 6,
    Hungary: 4, Romania: 6, Greece: 6, Russia: 6, Ukraine: 5,
    Turkey: 5, Brazil: 9, Mexico: 5, Argentina: 8, Chile: 7,
    Colombia: 6, Japan: 8, China: 6, "South Korea": 5, Singapore: 6,
    Malaysia: 5, Indonesia: 5, Thailand: 5, Philippines: 4, Vietnam: 6,
    Pakistan: 5, Bangladesh: 4, "Sri Lanka": 5, Nepal: 5,
    "United Arab Emirates": 10, "Saudi Arabia": 10, Israel: 7,
    Egypt: 5, "South Africa": 4, Nigeria: 6, Kenya: 5, "New Zealand": 4,
  };
  return caps[country] ?? Math.min(12, Math.max(4, src.length || 12));
}

// Strip disallowed characters and clamp length. Prevents spam / long payloads.
export function sanitizePostal(country: string, raw: string): string {
  const src = (COUNTRY_POSTAL_REGEX[country]?.re?.source ?? "").replace(/\\[dDwWsS]/g, "");
  const allowsLetters = /[A-Za-z]/.test(src);
  // Digit-only formats (e.g. India, US, DE): strip letters entirely.
  let v = raw.toUpperCase().replace(
    allowsLetters ? /[^A-Z0-9 \-]/g : /[^0-9 \-]/g,
    "",
  ).replace(/\s{2,}/g, " ");
  const max = postalMaxLen(country);
  if (v.length > max) v = v.slice(0, max);
  return v;
}


// Strip non-digits and the dial-code prefix.
export function normalizePhoneLocal(raw: string): string {
  return raw.replace(/\D+/g, "");
}

// Per-country local phone-number length + first-digit rules.
// Lengths exclude the international dial code.
type PhoneRule = { len: number[]; firstDigit?: RegExp; example: string };
export const COUNTRY_PHONE_RULES: Record<string, PhoneRule> = {
  India:           { len: [10],     firstDigit: /[6-9]/, example: "9876543210" },
  "United States": { len: [10],     firstDigit: /[2-9]/, example: "4155551234" },
  Canada:          { len: [10],     firstDigit: /[2-9]/, example: "4165551234" },
  "United Kingdom":{ len: [10, 11], firstDigit: /[1-9]/, example: "7400123456" },
  Australia:       { len: [9],      firstDigit: /[2-9]/, example: "412345678" },
  Germany:         { len: [10, 11], firstDigit: /[1-9]/, example: "1512345678" },
  France:          { len: [9],      firstDigit: /[1-9]/, example: "612345678" },
  Italy:           { len: [9, 10],  firstDigit: /[3]/,   example: "3123456789" },
  Spain:           { len: [9],      firstDigit: /[6-9]/, example: "612345678" },
  Netherlands:     { len: [9],      firstDigit: /[1-9]/, example: "612345678" },
  Brazil:          { len: [10, 11], firstDigit: /[1-9]/, example: "11987654321" },
  Mexico:          { len: [10],     firstDigit: /[1-9]/, example: "5512345678" },
  Japan:           { len: [10, 11], firstDigit: /[1-9]/, example: "9012345678" },
  China:           { len: [11],     firstDigit: /[1]/,   example: "13123456789" },
  Singapore:       { len: [8],      firstDigit: /[3689]/,example: "81234567" },
  "United Arab Emirates": { len: [9], firstDigit: /[5]/, example: "501234567" },
};

export function validatePhone(country: string, local: string): string | null {
  const digits = local.replace(/\D+/g, "");
  if (!digits) return "Phone number is required";
  if (/^(\d)\1+$/.test(digits)) return "Enter a real phone number";
  const rule = COUNTRY_PHONE_RULES[country];
  if (!rule) {
    if (digits.length < 6 || digits.length > 15) return "Phone must be 6–15 digits";
    return null;
  }
  if (!rule.len.includes(digits.length)) {
    return `Phone must be ${rule.len.join(" or ")} digits for ${country}`;
  }
  if (rule.firstDigit && !rule.firstDigit.test(digits[0])) {
    return `Phone must start with ${rule.firstDigit.source.replace(/[\[\]]/g, "")} for ${country}`;
  }
  return null;
}

export function phoneExample(country: string): string {
  return COUNTRY_PHONE_RULES[country]?.example ?? "";
}

export function phoneMaxLen(country: string): number {
  const r = COUNTRY_PHONE_RULES[country];
  return r ? Math.max(...r.len) : 15;
}
