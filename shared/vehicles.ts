export const vehicleBrands = [
  { value: "chevrolet", label: "Chevrolet" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "fiat", label: "Fiat" },
  { value: "ford", label: "Ford" },
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "hyundai", label: "Hyundai" },
  { value: "renault", label: "Renault" },
  { value: "nissan", label: "Nissan" },
  { value: "jeep", label: "Jeep" },
  { value: "peugeot", label: "Peugeot" },
  { value: "citroen", label: "Citroën" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "audi", label: "Audi" },
  { value: "mitsubishi", label: "Mitsubishi" },
  { value: "kia", label: "Kia" },
  { value: "chery", label: "Chery" },
  { value: "caoa", label: "Caoa Chery" },
  { value: "outro", label: "Outro" },
];

export const vehicleModels: Record<string, string[]> = {
  chevrolet: [
    "Onix", "Onix Plus", "Tracker", "S10", "Spin", "Montana",
    "Cruze", "Equinox", "Trailblazer", "Blazer", "Prisma",
    "Cobalt", "Classic", "Celta", "Corsa", "Astra", "Vectra",
    "Meriva", "Zafira", "Agile", "Captiva", "Trax", "Joy"
  ],
  volkswagen: [
    "Gol", "Voyage", "Polo", "Virtus", "T-Cross", "Nivus",
    "Saveiro", "Amarok", "Tiguan", "Taos", "Jetta", "Golf",
    "Fox", "Crossfox", "Spacefox", "Up!", "Fusca", "Passat",
    "Parati", "Kombi", "Santana", "Quantum", "Logus"
  ],
  fiat: [
    "Argo", "Cronos", "Mobi", "Toro", "Strada", "Fiorino",
    "Pulse", "Fastback", "Uno", "Palio", "Siena", "Weekend",
    "Punto", "Linea", "Bravo", "Stilo", "Marea", "Grand Siena",
    "Idea", "Doblo", "Ducato", "500", "Panda", "Tipo"
  ],
  ford: [
    "Ka", "Ka Sedan", "Fiesta", "EcoSport", "Territory", "Ranger",
    "Focus", "Fusion", "Edge", "Expedition", "Bronco", "Escort",
    "Courier", "F-250", "F-350", "F-1000", "Maverick"
  ],
  toyota: [
    "Corolla", "Hilux", "SW4", "RAV4", "Yaris", "Corolla Cross",
    "Etios", "Etios Sedan", "Camry", "Prius", "C-HR", "Land Cruiser",
    "Fielder", "Bandeirante"
  ],
  honda: [
    "Civic", "City", "HR-V", "WR-V", "CR-V", "Fit", "Accord",
    "New Civic", "Pilot", "Odyssey"
  ],
  hyundai: [
    "HB20", "HB20S", "Creta", "Tucson", "Santa Fe", "i30",
    "Elantra", "Azera", "ix35", "Veloster", "Kauai", "Palisade"
  ],
  renault: [
    "Kwid", "Sandero", "Logan", "Stepway", "Duster", "Captur",
    "Oroch", "Kardian", "Arkana", "Koleos", "Fluence", "Clio",
    "Megane", "Scenic", "Symbol", "Master", "Kangoo"
  ],
  nissan: [
    "Versa", "Kicks", "Frontier", "Sentra", "March", "Livina",
    "Tiida", "Altima", "Pathfinder", "X-Trail", "Leaf"
  ],
  jeep: [
    "Renegade", "Compass", "Commander", "Grand Cherokee", "Wrangler",
    "Cherokee"
  ],
  peugeot: [
    "208", "2008", "3008", "5008", "Partner", "Expert",
    "207", "206", "307", "308", "408", "Hoggar"
  ],
  citroen: [
    "C3", "C4 Cactus", "Aircross", "Jumper", "Berlingo",
    "C4 Lounge", "C4 Picasso", "Xsara", "Xantia"
  ],
  bmw: [
    "Série 1", "Série 2", "Série 3", "Série 4", "Série 5",
    "Série 6", "Série 7", "X1", "X2", "X3", "X4", "X5",
    "X6", "X7", "Z4", "i3", "i4", "iX"
  ],
  mercedes: [
    "Classe A", "Classe B", "Classe C", "Classe E", "Classe S",
    "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS",
    "EQC", "EQA", "EQS", "Sprinter"
  ],
  audi: [
    "A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7",
    "Q8", "TT", "R8", "e-tron"
  ],
  mitsubishi: [
    "L200", "Pajero", "ASX", "Eclipse Cross", "Outlander",
    "Lancer", "Space Wagon"
  ],
  kia: [
    "Picanto", "Rio", "Cerato", "Stonic", "Seltos", "Sportage",
    "Sorento", "Carnival", "Soul", "Stinger", "EV6"
  ],
  chery: [
    "Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 5", "Tiggo 7",
    "Tiggo 8", "Arrizo 5", "Arrizo 6", "QQ"
  ],
  caoa: [
    "Tiggo 2", "Tiggo 3X", "Tiggo 5X", "Tiggo 7", "Tiggo 8"
  ],
  outro: [
    "Outro modelo"
  ]
};

export function formatPlate(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  }
}

export function validatePlate(plate: string): boolean {
  const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
  
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
  
  return mercosulPattern.test(cleanPlate) || oldPattern.test(cleanPlate);
}
