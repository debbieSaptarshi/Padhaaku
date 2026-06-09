// Knowledge bank used by the local analyzer fallback.
// Each topic lists the key concepts a good explanation should contain,
// common misconceptions to watch for, and a short model answer.

export const TOPICS = {
  photosynthesis: {
    aliases: ["photosynthesis", "photo synthesis", "how plants make food"],
    label: "Photosynthesis",
    concepts: [
      {
        id: "sunlight",
        label: "Light energy",
        keywords: ["sunlight", "sun light", "light", "solar", "photons"],
        hint: "Photosynthesis is powered by light energy from the Sun.",
        importance: 2,
      },
      {
        id: "chlorophyll",
        label: "Chlorophyll / chloroplasts",
        keywords: ["chlorophyll", "chloroplast", "green pigment", "leaves green"],
        hint: "Chlorophyll (in chloroplasts) is the green pigment that captures light.",
        importance: 2,
      },
      {
        id: "co2",
        label: "Carbon dioxide intake",
        keywords: ["carbon dioxide", "co2", "co₂", "carbon-dioxide"],
        hint: "Plants take in carbon dioxide from the air (through stomata).",
        importance: 2,
      },
      {
        id: "water",
        label: "Water uptake",
        keywords: ["water", "h2o", "h₂o", "roots absorb"],
        hint: "Water is absorbed by the roots and transported to the leaves.",
        importance: 2,
      },
      {
        id: "glucose",
        label: "Glucose / sugar produced",
        keywords: ["glucose", "sugar", "food", "carbohydrate", "starch"],
        hint: "The plant builds glucose (sugar) — its food and stored energy.",
        importance: 3,
      },
      {
        id: "oxygen",
        label: "Oxygen released",
        keywords: ["oxygen", "o2", "o₂", "releases oxygen", "gives off oxygen"],
        hint: "Oxygen is released as a by-product.",
        importance: 2,
      },
    ],
    misconceptions: [
      {
        id: "soil-food",
        match: ["eat soil", "food from soil", "eats the soil", "get food from the soil", "nutrients are food"],
        label: "Plants don't get their food from soil",
        correction:
          "Plants make their own food (glucose) from CO₂ and water using light — soil mainly provides water and minerals, not food.",
      },
      {
        id: "breathe-co2-only",
        match: ["plants breathe in oxygen and release carbon dioxide", "plants only release carbon dioxide", "plants take in oxygen and give out carbon dioxide"],
        label: "Reversed gases",
        correction:
          "During photosynthesis plants take in carbon dioxide and release oxygen — the opposite of what you wrote.",
      },
      {
        id: "night",
        match: ["photosynthesis happens at night", "photosynthesis at night", "happens in the dark"],
        label: "Needs light",
        correction:
          "Photosynthesis needs light, so it happens in daylight, not in the dark.",
      },
    ],
    modelAnswer:
      "Photosynthesis is how green plants make their own food. Chlorophyll in the leaves captures light energy from the Sun. The plant takes in carbon dioxide from the air and water from the soil, and uses the light energy to convert them into glucose (sugar) for energy and growth. Oxygen is released as a by-product.",
  },

  "water cycle": {
    aliases: ["water cycle", "hydrological cycle", "rain cycle"],
    label: "The Water Cycle",
    concepts: [
      { id: "evaporation", label: "Evaporation", keywords: ["evaporat", "vapor", "vapour", "turns into gas"], hint: "The Sun heats water so it evaporates into water vapour.", importance: 3 },
      { id: "condensation", label: "Condensation", keywords: ["condens", "clouds form", "cools"], hint: "Water vapour rises, cools and condenses into clouds.", importance: 3 },
      { id: "precipitation", label: "Precipitation", keywords: ["precipitation", "rain", "snow", "hail", "falls"], hint: "Water falls back as precipitation (rain, snow, hail).", importance: 3 },
      { id: "collection", label: "Collection / runoff", keywords: ["collect", "runoff", "rivers", "ocean", "groundwater", "lakes"], hint: "Water collects in rivers, lakes and oceans, then the cycle repeats.", importance: 2 },
    ],
    misconceptions: [
      { id: "rain-from-nothing", match: ["rain is made in the sky", "rain comes from nowhere", "water is created in clouds"], label: "Water isn't created", correction: "Water isn't created in clouds — it's the same water evaporating, condensing and falling again in a cycle." },
    ],
    modelAnswer:
      "The water cycle is the continuous movement of water on Earth. The Sun heats water in oceans and lakes, causing evaporation into water vapour. The vapour rises, cools, and condenses into clouds. When droplets grow heavy they fall as precipitation (rain or snow). This water collects in rivers, lakes and oceans, and the cycle repeats.",
  },

  gravity: {
    aliases: ["gravity", "gravitation", "what is gravity"],
    label: "Gravity",
    concepts: [
      { id: "attraction", label: "Force of attraction", keywords: ["attract", "pull", "force"], hint: "Gravity is a force of attraction between objects with mass.", importance: 3 },
      { id: "mass", label: "Depends on mass", keywords: ["mass", "bigger objects", "more massive", "heavier"], hint: "The more mass an object has, the stronger its gravitational pull.", importance: 2 },
      { id: "distance", label: "Depends on distance", keywords: ["distance", "farther", "closer", "further away"], hint: "Gravity gets weaker as objects move farther apart.", importance: 2 },
      { id: "earth", label: "Keeps us on Earth / orbits", keywords: ["earth", "ground", "orbit", "moon", "falls", "weight"], hint: "Earth's gravity keeps us on the ground and holds the Moon in orbit.", importance: 2 },
    ],
    misconceptions: [
      { id: "no-air-no-gravity", match: ["no gravity in space", "space has no gravity", "gravity needs air", "no air so no gravity"], label: "Gravity exists in space", correction: "There IS gravity in space — astronauts float because they are in free fall (orbit), not because gravity is absent." },
      { id: "heavier-falls-faster", match: ["heavier objects fall faster", "heavy things fall faster"], label: "Free-fall is equal", correction: "Ignoring air resistance, heavy and light objects fall at the same rate." },
    ],
    modelAnswer:
      "Gravity is a force of attraction between any two objects that have mass. The greater the mass, the stronger the pull, and the force weakens as objects get farther apart. Earth's gravity pulls objects toward its centre, which is why things fall and why we have weight, and it keeps the Moon orbiting Earth.",
  },

  "the human heart": {
    aliases: ["the human heart", "human heart", "heart", "circulatory system", "blood circulation"],
    label: "The Human Heart",
    concepts: [
      { id: "pump", label: "Heart is a pump", keywords: ["pump", "pumps blood", "muscle"], hint: "The heart is a muscular pump that pushes blood around the body.", importance: 3 },
      { id: "chambers", label: "Four chambers", keywords: ["chamber", "atrium", "atria", "ventricle", "four"], hint: "It has four chambers: two atria (top) and two ventricles (bottom).", importance: 2 },
      { id: "oxygen", label: "Carries oxygen", keywords: ["oxygen", "oxygenated", "deoxygenated"], hint: "Blood carries oxygen to cells and removes carbon dioxide.", importance: 2 },
      { id: "lungs", label: "Lungs loop", keywords: ["lungs", "pulmonary"], hint: "Blood goes to the lungs to pick up oxygen, then back to the body.", importance: 2 },
      { id: "vessels", label: "Blood vessels", keywords: ["arteries", "veins", "capillaries", "vessel"], hint: "Arteries carry blood away from the heart, veins return it.", importance: 1 },
    ],
    misconceptions: [
      { id: "heart-makes-blood", match: ["heart makes blood", "heart creates blood", "produces blood"], label: "The heart doesn't make blood", correction: "The heart pumps blood; it doesn't make it — blood cells are made in bone marrow." },
    ],
    modelAnswer:
      "The human heart is a muscular pump with four chambers (two atria and two ventricles). It pumps blood in a double loop: deoxygenated blood is sent to the lungs to collect oxygen, returns to the heart, and is then pumped through arteries to the rest of the body. Veins return the blood, and the cycle repeats, delivering oxygen and removing carbon dioxide.",
  },
};

// Generic probing questions for topics we don't have a concept bank for.
export const GENERIC_FOLLOWUPS = [
  "Can you explain WHY that happens, not just what happens?",
  "What would a simple real-world example of this look like?",
  "What are the key parts or steps involved?",
  "What causes it, and what is the result?",
  "If you had to teach this to a 10-year-old, what would you say?",
];

export function findTopic(rawTopic) {
  const t = (rawTopic || "").trim().toLowerCase();
  if (!t) return null;
  for (const key of Object.keys(TOPICS)) {
    const entry = TOPICS[key];
    if (entry.aliases.some((a) => t === a || t.includes(a) || a.includes(t))) {
      return entry;
    }
  }
  return null;
}
