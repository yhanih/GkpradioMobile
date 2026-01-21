// Global cities and countries data for user location selection
export interface LocationOption {
  value: string;
  label: string;
  country?: string;
}

export const countries: LocationOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "IE", label: "Ireland" },
  { value: "PT", label: "Portugal" },
  { value: "GR", label: "Greece" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czech Republic" },
  { value: "HU", label: "Hungary" },
  { value: "RO", label: "Romania" },
  { value: "BG", label: "Bulgaria" },
  { value: "HR", label: "Croatia" },
  { value: "SI", label: "Slovenia" },
  { value: "SK", label: "Slovakia" },
  { value: "LT", label: "Lithuania" },
  { value: "LV", label: "Latvia" },
  { value: "EE", label: "Estonia" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "TW", label: "Taiwan" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  { value: "PH", label: "Philippines" },
  { value: "ID", label: "Indonesia" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "PE", label: "Peru" },
  { value: "VE", label: "Venezuela" },
  { value: "UY", label: "Uruguay" },
  { value: "PY", label: "Paraguay" },
  { value: "BO", label: "Bolivia" },
  { value: "EC", label: "Ecuador" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "GH", label: "Ghana" },
  { value: "EG", label: "Egypt" },
  { value: "MA", label: "Morocco" },
  { value: "TN", label: "Tunisia" },
  { value: "DZ", label: "Algeria" },
  { value: "ET", label: "Ethiopia" },
  { value: "UG", label: "Uganda" },
  { value: "TZ", label: "Tanzania" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "BW", label: "Botswana" },
  { value: "ZM", label: "Zambia" },
  { value: "MW", label: "Malawi" },
  { value: "RU", label: "Russia" },
  { value: "UA", label: "Ukraine" },
  { value: "TR", label: "Turkey" },
  { value: "IL", label: "Israel" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "QA", label: "Qatar" },
  { value: "KW", label: "Kuwait" },
  { value: "BH", label: "Bahrain" },
  { value: "OM", label: "Oman" },
  { value: "JO", label: "Jordan" },
  { value: "LB", label: "Lebanon" },
  { value: "SY", label: "Syria" },
  { value: "IQ", label: "Iraq" },
  { value: "IR", label: "Iran" },
  { value: "AF", label: "Afghanistan" },
  { value: "PK", label: "Pakistan" },
  { value: "BD", label: "Bangladesh" },
  { value: "LK", label: "Sri Lanka" },
  { value: "NP", label: "Nepal" },
  { value: "BT", label: "Bhutan" },
  { value: "MV", label: "Maldives" },
  { value: "NZ", label: "New Zealand" },
  { value: "FJ", label: "Fiji" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "SB", label: "Solomon Islands" },
  { value: "VU", label: "Vanuatu" },
  { value: "NC", label: "New Caledonia" },
  { value: "PF", label: "French Polynesia" },
].sort((a, b) => a.label.localeCompare(b.label));

export const cities: Record<string, LocationOption[]> = {
  US: [
    { value: "New York", label: "New York, NY" },
    { value: "Los Angeles", label: "Los Angeles, CA" },
    { value: "Chicago", label: "Chicago, IL" },
    { value: "Houston", label: "Houston, TX" },
    { value: "Phoenix", label: "Phoenix, AZ" },
    { value: "Philadelphia", label: "Philadelphia, PA" },
    { value: "San Antonio", label: "San Antonio, TX" },
    { value: "San Diego", label: "San Diego, CA" },
    { value: "Dallas", label: "Dallas, TX" },
    { value: "San Jose", label: "San Jose, CA" },
    { value: "Austin", label: "Austin, TX" },
    { value: "Jacksonville", label: "Jacksonville, FL" },
    { value: "Fort Worth", label: "Fort Worth, TX" },
    { value: "Columbus", label: "Columbus, OH" },
    { value: "Charlotte", label: "Charlotte, NC" },
    { value: "San Francisco", label: "San Francisco, CA" },
    { value: "Indianapolis", label: "Indianapolis, IN" },
    { value: "Seattle", label: "Seattle, WA" },
    { value: "Denver", label: "Denver, CO" },
    { value: "Washington", label: "Washington, DC" },
    { value: "Boston", label: "Boston, MA" },
    { value: "El Paso", label: "El Paso, TX" },
    { value: "Nashville", label: "Nashville, TN" },
    { value: "Detroit", label: "Detroit, MI" },
    { value: "Oklahoma City", label: "Oklahoma City, OK" },
    { value: "Portland", label: "Portland, OR" },
    { value: "Las Vegas", label: "Las Vegas, NV" },
    { value: "Memphis", label: "Memphis, TN" },
    { value: "Louisville", label: "Louisville, KY" },
    { value: "Baltimore", label: "Baltimore, MD" },
    { value: "Milwaukee", label: "Milwaukee, WI" },
    { value: "Albuquerque", label: "Albuquerque, NM" },
    { value: "Tucson", label: "Tucson, AZ" },
    { value: "Fresno", label: "Fresno, CA" },
    { value: "Atlanta", label: "Atlanta, GA" },
    { value: "Kansas City", label: "Kansas City, MO" },
    { value: "Colorado Springs", label: "Colorado Springs, CO" },
    { value: "Miami", label: "Miami, FL" },
    { value: "Raleigh", label: "Raleigh, NC" },
    { value: "Omaha", label: "Omaha, NE" },
    { value: "Long Beach", label: "Long Beach, CA" },
    { value: "Virginia Beach", label: "Virginia Beach, VA" },
    { value: "Oakland", label: "Oakland, CA" },
    { value: "Minneapolis", label: "Minneapolis, MN" },
    { value: "Tulsa", label: "Tulsa, OK" },
    { value: "Tampa", label: "Tampa, FL" },
    { value: "Arlington", label: "Arlington, TX" },
    { value: "New Orleans", label: "New Orleans, LA" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  CA: [
    { value: "Toronto", label: "Toronto, ON" },
    { value: "Montreal", label: "Montreal, QC" },
    { value: "Vancouver", label: "Vancouver, BC" },
    { value: "Calgary", label: "Calgary, AB" },
    { value: "Edmonton", label: "Edmonton, AB" },
    { value: "Ottawa", label: "Ottawa, ON" },
    { value: "Winnipeg", label: "Winnipeg, MB" },
    { value: "Quebec City", label: "Quebec City, QC" },
    { value: "Hamilton", label: "Hamilton, ON" },
    { value: "Kitchener", label: "Kitchener, ON" },
    { value: "London", label: "London, ON" },
    { value: "St. Catharines", label: "St. Catharines, ON" },
    { value: "Halifax", label: "Halifax, NS" },
    { value: "Victoria", label: "Victoria, BC" },
    { value: "Windsor", label: "Windsor, ON" },
    { value: "Saskatoon", label: "Saskatoon, SK" },
    { value: "Regina", label: "Regina, SK" },
    { value: "Sherbrooke", label: "Sherbrooke, QC" },
    { value: "St. John's", label: "St. John's, NL" },
    { value: "Barrie", label: "Barrie, ON" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  GB: [
    { value: "London", label: "London" },
    { value: "Birmingham", label: "Birmingham" },
    { value: "Manchester", label: "Manchester" },
    { value: "Glasgow", label: "Glasgow" },
    { value: "Liverpool", label: "Liverpool" },
    { value: "Leeds", label: "Leeds" },
    { value: "Sheffield", label: "Sheffield" },
    { value: "Edinburgh", label: "Edinburgh" },
    { value: "Bristol", label: "Bristol" },
    { value: "Cardiff", label: "Cardiff" },
    { value: "Leicester", label: "Leicester" },
    { value: "Coventry", label: "Coventry" },
    { value: "Bradford", label: "Bradford" },
    { value: "Belfast", label: "Belfast" },
    { value: "Nottingham", label: "Nottingham" },
    { value: "Kingston upon Hull", label: "Kingston upon Hull" },
    { value: "Newcastle upon Tyne", label: "Newcastle upon Tyne" },
    { value: "Stoke-on-Trent", label: "Stoke-on-Trent" },
    { value: "Southampton", label: "Southampton" },
    { value: "Derby", label: "Derby" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  AU: [
    { value: "Sydney", label: "Sydney, NSW" },
    { value: "Melbourne", label: "Melbourne, VIC" },
    { value: "Brisbane", label: "Brisbane, QLD" },
    { value: "Perth", label: "Perth, WA" },
    { value: "Adelaide", label: "Adelaide, SA" },
    { value: "Gold Coast", label: "Gold Coast, QLD" },
    { value: "Newcastle", label: "Newcastle, NSW" },
    { value: "Canberra", label: "Canberra, ACT" },
    { value: "Sunshine Coast", label: "Sunshine Coast, QLD" },
    { value: "Wollongong", label: "Wollongong, NSW" },
    { value: "Hobart", label: "Hobart, TAS" },
    { value: "Geelong", label: "Geelong, VIC" },
    { value: "Townsville", label: "Townsville, QLD" },
    { value: "Cairns", label: "Cairns, QLD" },
    { value: "Darwin", label: "Darwin, NT" },
    { value: "Toowoomba", label: "Toowoomba, QLD" },
    { value: "Ballarat", label: "Ballarat, VIC" },
    { value: "Bendigo", label: "Bendigo, VIC" },
    { value: "Albury", label: "Albury, NSW" },
    { value: "Launceston", label: "Launceston, TAS" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  // Add more major countries with their cities
  DE: [
    { value: "Berlin", label: "Berlin" },
    { value: "Hamburg", label: "Hamburg" },
    { value: "Munich", label: "Munich" },
    { value: "Cologne", label: "Cologne" },
    { value: "Frankfurt", label: "Frankfurt" },
    { value: "Stuttgart", label: "Stuttgart" },
    { value: "Düsseldorf", label: "Düsseldorf" },
    { value: "Dortmund", label: "Dortmund" },
    { value: "Essen", label: "Essen" },
    { value: "Leipzig", label: "Leipzig" },
    { value: "Bremen", label: "Bremen" },
    { value: "Dresden", label: "Dresden" },
    { value: "Hanover", label: "Hanover" },
    { value: "Nuremberg", label: "Nuremberg" },
    { value: "Duisburg", label: "Duisburg" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  FR: [
    { value: "Paris", label: "Paris" },
    { value: "Marseille", label: "Marseille" },
    { value: "Lyon", label: "Lyon" },
    { value: "Toulouse", label: "Toulouse" },
    { value: "Nice", label: "Nice" },
    { value: "Nantes", label: "Nantes" },
    { value: "Strasbourg", label: "Strasbourg" },
    { value: "Montpellier", label: "Montpellier" },
    { value: "Bordeaux", label: "Bordeaux" },
    { value: "Lille", label: "Lille" },
    { value: "Rennes", label: "Rennes" },
    { value: "Reims", label: "Reims" },
    { value: "Le Havre", label: "Le Havre" },
    { value: "Saint-Étienne", label: "Saint-Étienne" },
    { value: "Toulon", label: "Toulon" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  JP: [
    { value: "Tokyo", label: "Tokyo" },
    { value: "Yokohama", label: "Yokohama" },
    { value: "Osaka", label: "Osaka" },
    { value: "Nagoya", label: "Nagoya" },
    { value: "Sapporo", label: "Sapporo" },
    { value: "Fukuoka", label: "Fukuoka" },
    { value: "Kobe", label: "Kobe" },
    { value: "Kawasaki", label: "Kawasaki" },
    { value: "Kyoto", label: "Kyoto" },
    { value: "Saitama", label: "Saitama" },
    { value: "Hiroshima", label: "Hiroshima" },
    { value: "Sendai", label: "Sendai" },
    { value: "Kitakyushu", label: "Kitakyushu" },
    { value: "Chiba", label: "Chiba" },
    { value: "Sakai", label: "Sakai" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  BR: [
    { value: "São Paulo", label: "São Paulo" },
    { value: "Rio de Janeiro", label: "Rio de Janeiro" },
    { value: "Brasília", label: "Brasília" },
    { value: "Salvador", label: "Salvador" },
    { value: "Fortaleza", label: "Fortaleza" },
    { value: "Belo Horizonte", label: "Belo Horizonte" },
    { value: "Manaus", label: "Manaus" },
    { value: "Curitiba", label: "Curitiba" },
    { value: "Recife", label: "Recife" },
    { value: "Goiânia", label: "Goiânia" },
    { value: "Belém", label: "Belém" },
    { value: "Guarulhos", label: "Guarulhos" },
    { value: "Campinas", label: "Campinas" },
    { value: "São Luís", label: "São Luís" },
    { value: "São Gonçalo", label: "São Gonçalo" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
  
  IN: [
    { value: "Mumbai", label: "Mumbai" },
    { value: "Delhi", label: "Delhi" },
    { value: "Bangalore", label: "Bangalore" },
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Ahmedabad", label: "Ahmedabad" },
    { value: "Chennai", label: "Chennai" },
    { value: "Kolkata", label: "Kolkata" },
    { value: "Surat", label: "Surat" },
    { value: "Pune", label: "Pune" },
    { value: "Jaipur", label: "Jaipur" },
    { value: "Lucknow", label: "Lucknow" },
    { value: "Kanpur", label: "Kanpur" },
    { value: "Nagpur", label: "Nagpur" },
    { value: "Indore", label: "Indore" },
    { value: "Thane", label: "Thane" }
  ].sort((a, b) => a.label.localeCompare(b.label)),
};

// Function to get cities by country code
export function getCitiesByCountry(countryCode: string): LocationOption[] {
  return cities[countryCode] || [];
}

// Function to get country name by code
export function getCountryName(countryCode: string): string {
  const country = countries.find(c => c.value === countryCode);
  return country?.label || countryCode;
}

// Function to search cities globally
export function searchCities(searchTerm: string, countryCode?: string): LocationOption[] {
  const searchLower = searchTerm.toLowerCase();
  
  if (countryCode) {
    const countryCities = cities[countryCode] || [];
    return countryCities.filter(city => 
      city.label.toLowerCase().includes(searchLower) ||
      city.value.toLowerCase().includes(searchLower)
    );
  }
  
  // Search all cities across all countries
  const allCities: LocationOption[] = [];
  Object.entries(cities).forEach(([country, citiesList]) => {
    const matchingCities = citiesList
      .filter(city => 
        city.label.toLowerCase().includes(searchLower) ||
        city.value.toLowerCase().includes(searchLower)
      )
      .map(city => ({ 
        ...city, 
        country: getCountryName(country),
        label: `${city.value}, ${getCountryName(country)}`
      }));
    allCities.push(...matchingCities);
  });
  
  return allCities.slice(0, 20); // Limit results
}