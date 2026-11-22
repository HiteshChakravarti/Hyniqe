// Labelled reference places for the accuracy benchmark. Kept separate from the
// engine's built-in gazetteer on purpose: most of these towns are NOT in it, so
// the benchmark measures how the engine copes with places it has never seen.
// Postcodes are format-valid examples for each town, used as ground truth for
// parsing (the benchmark checks extraction, not postal validity).

export interface BenchPlace {
  town: string;
  country: string;
  pc: string;
  region?: string;
  street: string;
}

export const PC_FIRST = new Set(['DE', 'FR', 'NL', 'ES', 'IT', 'CH', 'AT', 'BE', 'SE', 'DK', 'NO', 'FI', 'PL', 'PT', 'BR', 'MX', 'CN', 'TR', 'LU', 'CZ', 'SK', 'HU', 'RO', 'GR', 'HR', 'SI', 'BG', 'EE', 'LV', 'LT']);

export const PLACES: BenchPlace[] = [
  // United Kingdom & Ireland
  { town: 'Birmingham', country: 'GB', pc: 'B1 1AA', street: 'Colmore Row' },
  { town: 'Bristol', country: 'GB', pc: 'BS1 4DJ', street: 'Queen Square' },
  { town: 'Cardiff', country: 'GB', pc: 'CF10 1EP', street: 'Queen Street' },
  { town: 'Belfast', country: 'GB', pc: 'BT1 5GS', street: 'Donegall Place' },
  { town: 'Sheffield', country: 'GB', pc: 'S1 2HE', street: 'Fargate' },
  { town: 'Nottingham', country: 'GB', pc: 'NG1 5FS', street: 'Market Street' },
  { town: 'Edinburgh', country: 'GB', pc: 'EH1 1YZ', street: 'Princes Street' },
  { town: 'Southampton', country: 'GB', pc: 'SO14 7DU', street: 'Above Bar Street' },
  { town: 'Reading', country: 'GB', pc: 'RG1 2AG', street: 'Broad Street' },
  { town: 'Galway', country: 'IE', pc: 'H91 E2K3', street: 'Shop Street' },
  { town: 'Limerick', country: 'IE', pc: 'V94 T9PX', street: "O'Connell Street" },
  // Germany, Austria, Switzerland
  { town: 'Leipzig', country: 'DE', pc: '04109', street: 'Grimmaische Strasse' },
  { town: 'Dresden', country: 'DE', pc: '01067', street: 'Prager Strasse' },
  { town: 'Hannover', country: 'DE', pc: '30159', street: 'Georgstrasse' },
  { town: 'Nuremberg', country: 'DE', pc: '90402', street: 'Königstrasse' },
  { town: 'Bremen', country: 'DE', pc: '28195', street: 'Obernstrasse' },
  { town: 'Essen', country: 'DE', pc: '45127', street: 'Kettwiger Strasse' },
  { town: 'Bonn', country: 'DE', pc: '53111', street: 'Sternstrasse' },
  { town: 'Graz', country: 'AT', pc: '8010', street: 'Herrengasse' },
  { town: 'Salzburg', country: 'AT', pc: '5020', street: 'Getreidegasse' },
  { town: 'Linz', country: 'AT', pc: '4020', street: 'Landstrasse' },
  { town: 'Bern', country: 'CH', pc: '3011', street: 'Marktgasse' },
  { town: 'Lausanne', country: 'CH', pc: '1003', street: 'Rue de Bourg' },
  // France, Benelux
  { town: 'Bordeaux', country: 'FR', pc: '33000', street: 'rue Sainte-Catherine' },
  { town: 'Nantes', country: 'FR', pc: '44000', street: 'rue Crébillon' },
  { town: 'Nice', country: 'FR', pc: '06000', street: 'avenue Jean Médecin' },
  { town: 'Strasbourg', country: 'FR', pc: '67000', street: 'rue du Vieux-Marché-aux-Poissons' },
  { town: 'Montpellier', country: 'FR', pc: '34000', street: 'rue de la Loge' },
  { town: 'Rennes', country: 'FR', pc: '35000', street: 'rue Le Bastard' },
  { town: 'Groningen', country: 'NL', pc: '9711 AA', street: 'Herestraat' },
  { town: 'Tilburg', country: 'NL', pc: '5038 AA', street: 'Heuvelstraat' },
  { town: 'Haarlem', country: 'NL', pc: '2011 AA', street: 'Grote Houtstraat' },
  { town: 'Ghent', country: 'BE', pc: '9000', street: 'Veldstraat' },
  { town: 'Liège', country: 'BE', pc: '4000', street: 'Rue Pont d\'Avroy' },
  // Southern Europe
  { town: 'Seville', country: 'ES', pc: '41001', street: 'Calle Sierpes' },
  { town: 'Zaragoza', country: 'ES', pc: '50001', street: 'Calle Alfonso I' },
  { town: 'Bilbao', country: 'ES', pc: '48001', street: 'Gran Via' },
  { town: 'Málaga', country: 'ES', pc: '29001', street: 'Calle Larios' },
  { town: 'Naples', country: 'IT', pc: '80133', street: 'Via Toledo' },
  { town: 'Florence', country: 'IT', pc: '50122', street: 'Via dei Calzaiuoli' },
  { town: 'Bologna', country: 'IT', pc: '40121', street: 'Via Indipendenza' },
  { town: 'Genoa', country: 'IT', pc: '16121', street: 'Via XX Settembre' },
  { town: 'Braga', country: 'PT', pc: '4700-001', street: 'Avenida Central' },
  // Nordics & Central Europe
  { town: 'Malmö', country: 'SE', pc: '211 22', street: 'Södergatan' },
  { town: 'Uppsala', country: 'SE', pc: '753 20', street: 'Kungsgatan' },
  { town: 'Aarhus', country: 'DK', pc: '8000', street: 'Søndergade' },
  { town: 'Odense', country: 'DK', pc: '5000', street: 'Vestergade' },
  { town: 'Bergen', country: 'NO', pc: '5003', street: 'Torgallmenningen' },
  { town: 'Trondheim', country: 'NO', pc: '7011', street: 'Nordre gate' },
  { town: 'Tampere', country: 'FI', pc: '33100', street: 'Hämeenkatu' },
  { town: 'Espoo', country: 'FI', pc: '02100', street: 'Tapiontori' },
  { town: 'Wrocław', country: 'PL', pc: '50-001', street: 'ul. Świdnicka' },
  { town: 'Gdańsk', country: 'PL', pc: '80-001', street: 'ul. Długa' },
  { town: 'Poznań', country: 'PL', pc: '61-001', street: 'ul. Półwiejska' },
  // North America
  { town: 'Denver', country: 'US', region: 'CO', pc: '80202', street: 'Larimer Street' },
  { town: 'Phoenix', country: 'US', region: 'AZ', pc: '85004', street: 'Central Avenue' },
  { town: 'Portland', country: 'US', region: 'OR', pc: '97204', street: 'SW Broadway' },
  { town: 'Minneapolis', country: 'US', region: 'MN', pc: '55402', street: 'Nicollet Mall' },
  { town: 'Detroit', country: 'US', region: 'MI', pc: '48226', street: 'Woodward Avenue' },
  { town: 'Philadelphia', country: 'US', region: 'PA', pc: '19107', street: 'Market Street' },
  { town: 'Pittsburgh', country: 'US', region: 'PA', pc: '15222', street: 'Liberty Avenue' },
  { town: 'Nashville', country: 'US', region: 'TN', pc: '37203', street: 'Broadway' },
  { town: 'Salt Lake City', country: 'US', region: 'UT', pc: '84111', street: 'Main Street' },
  { town: 'San Diego', country: 'US', region: 'CA', pc: '92101', street: 'Broadway' },
  { town: 'Columbus', country: 'US', region: 'OH', pc: '43215', street: 'High Street' },
  { town: 'Raleigh', country: 'US', region: 'NC', pc: '27601', street: 'Fayetteville Street' },
  { town: 'Tampa', country: 'US', region: 'FL', pc: '33602', street: 'Franklin Street' },
  { town: 'Chicago', country: 'US', region: 'IL', pc: '60611', street: 'Michigan Avenue' },
  { town: 'Ottawa', country: 'CA', region: 'ON', pc: 'K1P 1J1', street: 'Sparks Street' },
  { town: 'Winnipeg', country: 'CA', region: 'MB', pc: 'R3C 0A1', street: 'Portage Avenue' },
  { town: 'Edmonton', country: 'CA', region: 'AB', pc: 'T5J 0N3', street: 'Jasper Avenue' },
  { town: 'Halifax', country: 'CA', region: 'NS', pc: 'B3J 1S9', street: 'Barrington Street' },
  { town: 'Toronto', country: 'CA', region: 'ON', pc: 'M5H 2N2', street: 'Bay Street' },
  { town: 'Guadalajara', country: 'MX', pc: '44100', street: 'Avenida Juárez' },
  { town: 'Puebla', country: 'MX', pc: '72000', street: 'Avenida Reforma' },
  // South America
  { town: 'Belo Horizonte', country: 'BR', pc: '30130-000', street: 'Avenida Afonso Pena' },
  { town: 'Curitiba', country: 'BR', pc: '80010-000', street: 'Rua XV de Novembro' },
  { town: 'Porto Alegre', country: 'BR', pc: '90010-000', street: 'Rua dos Andradas' },
  // India & South Asia
  { town: 'Jaipur', country: 'IN', pc: '302001', street: 'MI Road' },
  { town: 'Lucknow', country: 'IN', pc: '226001', street: 'Hazratganj' },
  { town: 'Indore', country: 'IN', pc: '452001', street: 'MG Road' },
  { town: 'Nagpur', country: 'IN', pc: '440001', street: 'Sitabuldi Main Road' },
  { town: 'Kochi', country: 'IN', pc: '682011', street: 'MG Road' },
  { town: 'Coimbatore', country: 'IN', pc: '641001', street: 'Avinashi Road' },
  { town: 'Surat', country: 'IN', pc: '395003', street: 'Ring Road' },
  { town: 'Chandigarh', country: 'IN', pc: '160017', street: 'Madhya Marg' },
  { town: 'Bhopal', country: 'IN', pc: '462001', street: 'Hamidia Road' },
  { town: 'Mumbai', country: 'IN', pc: '400051', street: 'Bandra Kurla Complex' },
  { town: 'Pune', country: 'IN', pc: '411057', street: 'Hinjewadi Phase 2' },
  // East & South-East Asia, Oceania
  { town: 'Yokohama', country: 'JP', pc: '220-0012', street: 'Minatomirai' },
  { town: 'Nagoya', country: 'JP', pc: '450-0002', street: 'Meieki' },
  { town: 'Fukuoka', country: 'JP', pc: '810-0001', street: 'Tenjin' },
  { town: 'Sapporo', country: 'JP', pc: '060-0001', street: 'Kita Ichijo Nishi' },
  { town: 'Chengdu', country: 'CN', pc: '610000', street: 'Chunxi Road' },
  { town: 'Hangzhou', country: 'CN', pc: '310000', street: 'Yan\'an Road' },
  { town: 'Busan', country: 'KR', pc: '48058', street: 'Centum Jungang-ro' },
  { town: 'Chiang Mai', country: 'TH', pc: '50200', street: 'Nimmanhaemin Road' },
  { town: 'Cebu City', country: 'PH', pc: '6000', street: 'Osmeña Boulevard' },
  { town: 'Singapore', country: 'SG', pc: '048616', street: 'Raffles Place' },
  { town: 'Adelaide', country: 'AU', region: 'SA', pc: '5000', street: 'King William Street' },
  { town: 'Canberra', country: 'AU', region: 'ACT', pc: '2600', street: 'Northbourne Avenue' },
  { town: 'Hobart', country: 'AU', region: 'TAS', pc: '7000', street: 'Elizabeth Street' },
  { town: 'Brisbane', country: 'AU', region: 'QLD', pc: '4000', street: 'Queen Street' },
  { town: 'Christchurch', country: 'NZ', pc: '8011', street: 'Colombo Street' },
  // Middle East & Africa
  { town: 'Dubai', country: 'AE', pc: '', street: 'Sheikh Zayed Road' },
  { town: 'Ajman', country: 'AE', pc: '', street: 'Sheikh Khalifa Bin Zayed Street' },
  { town: 'Doha', country: 'QA', pc: '', street: 'Al Corniche Street' },
  { town: 'Ankara', country: 'TR', pc: '06420', street: 'Atatürk Bulvarı' },
  { town: 'Izmir', country: 'TR', pc: '35210', street: 'Kıbrıs Şehitleri Caddesi' },
  { town: 'Durban', country: 'ZA', pc: '4001', street: 'Anton Lembede Street' },
  { town: 'Pretoria', country: 'ZA', pc: '0002', street: 'Church Street' },
  { town: 'Nairobi', country: 'KE', pc: '00100', street: 'Kenyatta Avenue' },
  { town: 'Mombasa', country: 'KE', pc: '80100', street: 'Moi Avenue' },
];
