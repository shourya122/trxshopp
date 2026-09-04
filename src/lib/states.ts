// States / provinces for common countries. Keyed by country NAME (matches the
// values stored in the address form). Countries not in this map fall back to a
// free-text input.

export const STATES_BY_COUNTRY: Record<string, string[]> = {
  India: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  ],
  "United States": [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
    "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
    "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
    "District of Columbia",
  ],
  Canada: [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
    "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan",
    "Northwest Territories","Nunavut","Yukon",
  ],
  Australia: [
    "Australian Capital Territory","New South Wales","Northern Territory",
    "Queensland","South Australia","Tasmania","Victoria","Western Australia",
  ],
  "United Kingdom": ["England","Scotland","Wales","Northern Ireland"],
  Germany: [
    "Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg",
    "Hesse","Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia",
    "Rhineland-Palatinate","Saarland","Saxony","Saxony-Anhalt",
    "Schleswig-Holstein","Thuringia",
  ],
  Brazil: [
    "Acre","Alagoas","Amapá","Amazonas","Bahia","Ceará","Distrito Federal",
    "Espírito Santo","Goiás","Maranhão","Mato Grosso","Mato Grosso do Sul",
    "Minas Gerais","Pará","Paraíba","Paraná","Pernambuco","Piauí",
    "Rio de Janeiro","Rio Grande do Norte","Rio Grande do Sul","Rondônia",
    "Roraima","Santa Catarina","São Paulo","Sergipe","Tocantins",
  ],
  Mexico: [
    "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
    "Chihuahua","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo",
    "Jalisco","Mexico City","México","Michoacán","Morelos","Nayarit","Nuevo León",
    "Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa",
    "Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
  ],
  "United Arab Emirates": [
    "Abu Dhabi","Ajman","Dubai","Fujairah","Ras Al Khaimah","Sharjah","Umm Al Quwain",
  ],
  "South Africa": [
    "Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga",
    "Northern Cape","North West","Western Cape",
  ],
  Italy: [
    "Abruzzo","Aosta Valley","Apulia","Basilicata","Calabria","Campania",
    "Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardy",
    "Marche","Molise","Piedmont","Sardinia","Sicily","Trentino-South Tyrol",
    "Tuscany","Umbria","Veneto",
  ],
  Spain: [
    "Andalusia","Aragon","Asturias","Balearic Islands","Basque Country",
    "Canary Islands","Cantabria","Castile and León","Castilla-La Mancha",
    "Catalonia","Extremadura","Galicia","La Rioja","Madrid","Murcia",
    "Navarre","Valencia","Ceuta","Melilla",
  ],
  France: [
    "Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Brittany","Centre-Val de Loire",
    "Corsica","Grand Est","Hauts-de-France","Île-de-France","Normandy",
    "Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur",
  ],
  Japan: [
    "Aichi","Akita","Aomori","Chiba","Ehime","Fukui","Fukuoka","Fukushima","Gifu",
    "Gunma","Hiroshima","Hokkaido","Hyogo","Ibaraki","Ishikawa","Iwate","Kagawa",
    "Kagoshima","Kanagawa","Kochi","Kumamoto","Kyoto","Mie","Miyagi","Miyazaki",
    "Nagano","Nagasaki","Nara","Niigata","Oita","Okayama","Okinawa","Osaka","Saga",
    "Saitama","Shiga","Shimane","Shizuoka","Tochigi","Tokushima","Tokyo","Tottori",
    "Toyama","Wakayama","Yamagata","Yamaguchi","Yamanashi",
  ],
};

export function statesFor(country: string): string[] {
  return STATES_BY_COUNTRY[country] ?? [];
}
