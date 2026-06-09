// Knowledge bank used by the local analyzer fallback.

export const TOPICS = {
  photosynthesis: {
    aliases: ["photosynthesis", "photo synthesis", "how plants make food"],
    label: "Photosynthesis",
    concepts: [
      { id: "sunlight", label: "Light energy", keywords: ["sunlight", "sun light", "light", "solar", "photons"], hint: "Photosynthesis is powered by light energy from the Sun.", importance: 2 },
      { id: "chlorophyll", label: "Chlorophyll / chloroplasts", keywords: ["chlorophyll", "chloroplast", "green pigment", "leaves green"], hint: "Chlorophyll (in chloroplasts) captures light.", importance: 2 },
      { id: "co2", label: "Carbon dioxide intake", keywords: ["carbon dioxide", "co2", "co₂"], hint: "Plants take in carbon dioxide from the air.", importance: 2 },
      { id: "water", label: "Water uptake", keywords: ["water", "h2o", "h₂o", "roots absorb"], hint: "Water is absorbed by the roots.", importance: 2 },
      { id: "glucose", label: "Glucose / sugar produced", keywords: ["glucose", "sugar", "food", "carbohydrate", "starch"], hint: "The plant builds glucose — its food.", importance: 3 },
      { id: "oxygen", label: "Oxygen released", keywords: ["oxygen", "o2", "o₂", "releases oxygen"], hint: "Oxygen is released as a by-product.", importance: 2 },
    ],
    requiredEdges: [
      { fromKeywords: ["sunlight", "light", "chlorophyll"], toKeywords: ["glucose", "sugar", "food"], label: "Light energy → food made" },
    ],
    misconceptions: [
      { id: "soil-food", match: ["eat soil", "food from soil", "eats the soil", "get food from the soil"], label: "Plants don't get food from soil", correction: "Plants make glucose from CO₂ and water using light — soil provides minerals, not food." },
      { id: "breathe-co2-only", match: ["plants breathe in oxygen and release carbon dioxide", "plants only release carbon dioxide"], label: "Reversed gases", correction: "During photosynthesis plants take in CO₂ and release oxygen." },
      { id: "night", match: ["photosynthesis happens at night", "happens in the dark"], label: "Needs light", correction: "Photosynthesis needs light, so it happens in daylight." },
    ],
    modelAnswer: "Photosynthesis is how green plants make food. Chlorophyll captures light. The plant takes in CO₂ and water and converts them into glucose. Oxygen is released as a by-product.",
  },

  "water cycle": {
    aliases: ["water cycle", "hydrological cycle", "rain cycle"],
    label: "The Water Cycle",
    concepts: [
      { id: "evaporation", label: "Evaporation", keywords: ["evaporat", "vapor", "vapour"], hint: "The Sun heats water so it evaporates.", importance: 3 },
      { id: "condensation", label: "Condensation", keywords: ["condens", "clouds form", "cools"], hint: "Water vapour cools and condenses into clouds.", importance: 3 },
      { id: "precipitation", label: "Precipitation", keywords: ["precipitation", "rain", "snow", "hail", "falls"], hint: "Water falls as rain, snow, or hail.", importance: 3 },
      { id: "collection", label: "Collection / runoff", keywords: ["collect", "runoff", "rivers", "ocean", "lakes"], hint: "Water collects in rivers, lakes, and oceans.", importance: 2 },
    ],
    requiredEdges: [
      { fromKeywords: ["evaporat", "vapor"], toKeywords: ["condens", "cloud"], label: "Evaporation → condensation" },
      { fromKeywords: ["condens", "cloud"], toKeywords: ["rain", "precipitation", "snow"], label: "Clouds → precipitation" },
    ],
    misconceptions: [
      { id: "rain-from-nothing", match: ["rain is made in the sky", "water is created in clouds"], label: "Water isn't created", correction: "Water isn't created — it evaporates, condenses, and falls in a cycle." },
    ],
    modelAnswer: "The Sun heats water causing evaporation. Vapour rises, cools, and condenses into clouds. Precipitation falls and water collects in rivers and oceans, repeating the cycle.",
  },

  gravity: {
    aliases: ["gravity", "gravitation", "what is gravity"],
    label: "Gravity",
    concepts: [
      { id: "attraction", label: "Force of attraction", keywords: ["attract", "pull", "force"], hint: "Gravity is a force of attraction between masses.", importance: 3 },
      { id: "mass", label: "Depends on mass", keywords: ["mass", "more massive", "heavier"], hint: "More mass means stronger gravitational pull.", importance: 2 },
      { id: "distance", label: "Depends on distance", keywords: ["distance", "farther", "closer"], hint: "Gravity weakens with distance.", importance: 2 },
      { id: "earth", label: "Keeps us on Earth", keywords: ["earth", "ground", "orbit", "moon", "falls", "weight"], hint: "Earth's gravity keeps us grounded and holds the Moon in orbit.", importance: 2 },
    ],
    misconceptions: [
      { id: "no-air-no-gravity", match: ["no gravity in space", "space has no gravity", "gravity needs air"], label: "Gravity exists in space", correction: "There IS gravity in space — astronauts float because they are in free fall." },
      { id: "heavier-falls-faster", match: ["heavier objects fall faster", "heavy things fall faster"], label: "Free-fall is equal", correction: "Ignoring air resistance, all objects fall at the same rate." },
    ],
    modelAnswer: "Gravity is attraction between masses. Stronger with more mass, weaker with distance. Earth's gravity makes things fall and keeps the Moon orbiting.",
  },

  "the human heart": {
    aliases: ["the human heart", "human heart", "heart", "circulatory system"],
    label: "The Human Heart",
    concepts: [
      { id: "pump", label: "Heart is a pump", keywords: ["pump", "pumps blood", "muscle"], hint: "The heart is a muscular pump.", importance: 3 },
      { id: "chambers", label: "Four chambers", keywords: ["chamber", "atrium", "ventricle", "four"], hint: "Four chambers: two atria and two ventricles.", importance: 2 },
      { id: "oxygen", label: "Carries oxygen", keywords: ["oxygen", "oxygenated", "deoxygenated"], hint: "Blood carries oxygen to cells.", importance: 2 },
      { id: "lungs", label: "Lungs loop", keywords: ["lungs", "pulmonary"], hint: "Blood goes to lungs to pick up oxygen.", importance: 2 },
      { id: "vessels", label: "Blood vessels", keywords: ["arteries", "veins", "capillaries"], hint: "Arteries carry blood away; veins return it.", importance: 1 },
    ],
    misconceptions: [
      { id: "heart-makes-blood", match: ["heart makes blood", "heart creates blood"], label: "Heart doesn't make blood", correction: "The heart pumps blood; bone marrow makes blood cells." },
    ],
    modelAnswer: "The heart is a four-chambered pump. It sends blood to the lungs for oxygen, then pumps oxygenated blood through arteries to the body. Veins return blood to repeat the cycle.",
  },

  "cell structure": {
    aliases: ["cell structure", "the cell", "animal cell", "plant cell"],
    label: "Cell Structure",
    concepts: [
      { id: "membrane", label: "Cell membrane", keywords: ["membrane", "cell wall", "boundary", "outer"], hint: "The membrane controls what enters and leaves.", importance: 2 },
      { id: "nucleus", label: "Nucleus", keywords: ["nucleus", "dna", "controls", "genetic"], hint: "The nucleus controls the cell and holds DNA.", importance: 3 },
      { id: "cytoplasm", label: "Cytoplasm", keywords: ["cytoplasm", "jelly", "fluid inside"], hint: "Cytoplasm is the gel-like interior where reactions happen.", importance: 2 },
      { id: "mitochondria", label: "Mitochondria", keywords: ["mitochondria", "energy", "respiration", "powerhouse"], hint: "Mitochondria release energy from food.", importance: 2 },
      { id: "chloroplast", label: "Chloroplasts (plants)", keywords: ["chloroplast", "photosynthesis", "green"], hint: "Plant cells have chloroplasts for photosynthesis.", importance: 1 },
    ],
    misconceptions: [
      { id: "cells-big", match: ["cells are big enough to see without", "all cells look the same"], label: "Cells vary", correction: "Most cells are microscopic and specialized for different jobs." },
    ],
    modelAnswer: "Cells are the basic units of life. They have a membrane, cytoplasm, and usually a nucleus with DNA. Mitochondria produce energy; plant cells also have chloroplasts.",
  },

  "food chains": {
    aliases: ["food chains", "food chain", "food web", "ecosystem energy"],
    label: "Food Chains",
    concepts: [
      { id: "producer", label: "Producers", keywords: ["producer", "plants", "photosynthesis", "autotroph"], hint: "Producers (usually plants) make their own food.", importance: 3 },
      { id: "consumer", label: "Consumers", keywords: ["consumer", "herbivore", "carnivore", "omnivore", "eat"], hint: "Consumers eat other organisms for energy.", importance: 3 },
      { id: "energy", label: "Energy transfer", keywords: ["energy", "transfer", "flows", "passed"], hint: "Energy flows from producers to consumers.", importance: 2 },
      { id: "decomposer", label: "Decomposers", keywords: ["decomposer", "bacteria", "fungi", "rotting", "decay"], hint: "Decomposers break down dead matter and recycle nutrients.", importance: 2 },
    ],
    requiredEdges: [
      { fromKeywords: ["plant", "producer"], toKeywords: ["consumer", "herbivore", "carnivore", "eat"], label: "Producer → consumer" },
    ],
    misconceptions: [
      { id: "energy-recycled", match: ["energy is recycled", "energy goes back to the sun"], label: "Energy isn't recycled", correction: "Energy is lost at each step; only nutrients are recycled." },
    ],
    modelAnswer: "Food chains show how energy moves through an ecosystem: producers make food, consumers eat them, and decomposers break down waste. Energy is lost at each level.",
  },

  "newtons laws": {
    aliases: ["newtons laws", "newton's laws", "newton laws of motion", "laws of motion"],
    label: "Newton's Laws",
    concepts: [
      { id: "first", label: "First law (inertia)", keywords: ["inertia", "first law", "stay at rest", "keep moving", "unless acted"], hint: "Objects keep their motion unless a force acts.", importance: 3 },
      { id: "second", label: "Second law (F=ma)", keywords: ["f=ma", "second law", "force equals", "acceleration", "mass"], hint: "Force = mass × acceleration.", importance: 3 },
      { id: "third", label: "Third law (action-reaction)", keywords: ["third law", "action", "reaction", "equal and opposite"], hint: "Every action has an equal and opposite reaction.", importance: 3 },
      { id: "force", label: "Force changes motion", keywords: ["force", "push", "pull", "changes motion"], hint: "Forces cause acceleration or deformation.", importance: 2 },
    ],
    misconceptions: [
      { id: "motion-needs-force", match: ["need force to keep moving", "force keeps things moving"], label: "Motion without force", correction: "Constant motion needs no net force — friction is what slows things." },
    ],
    modelAnswer: "Newton's laws: (1) inertia — motion continues unless forced; (2) F=ma; (3) forces come in equal and opposite pairs.",
  },

  energy: {
    aliases: ["energy", "forms of energy", "conservation of energy"],
    label: "Energy",
    concepts: [
      { id: "forms", label: "Different forms", keywords: ["kinetic", "potential", "thermal", "chemical", "electrical", "forms"], hint: "Energy exists as kinetic, potential, thermal, etc.", importance: 2 },
      { id: "conservation", label: "Conservation", keywords: ["conserv", "cannot be created", "cannot be destroyed", "transform"], hint: "Energy is conserved — it transforms but isn't lost.", importance: 3 },
      { id: "transfer", label: "Transfer & work", keywords: ["transfer", "work", "heat", "flow"], hint: "Energy transfers when work is done or heat flows.", importance: 2 },
      { id: "units", label: "Joules", keywords: ["joule", "joules", "unit"], hint: "Energy is measured in joules.", importance: 1 },
    ],
    misconceptions: [
      { id: "energy-used-up", match: ["energy is used up", "energy disappears"], label: "Energy transforms", correction: "Energy isn't used up — it changes form, often to heat." },
    ],
    modelAnswer: "Energy comes in many forms and is conserved. It transfers between objects and transforms, but the total amount stays the same.",
  },

  waves: {
    aliases: ["waves", "wave properties", "sound waves", "light waves"],
    label: "Waves",
    concepts: [
      { id: "oscillation", label: "Oscillation / vibration", keywords: ["vibrat", "oscillat", "back and forth"], hint: "Waves come from vibrations.", importance: 2 },
      { id: "amplitude", label: "Amplitude", keywords: ["amplitude", "loud", "height"], hint: "Amplitude relates to wave height or loudness.", importance: 2 },
      { id: "wavelength", label: "Wavelength & frequency", keywords: ["wavelength", "frequency", "pitch"], hint: "Wavelength and frequency describe the wave pattern.", importance: 2 },
      { id: "medium", label: "Medium vs vacuum", keywords: ["medium", "vacuum", "sound needs", "light can"], hint: "Sound needs a medium; light can travel in vacuum.", importance: 2 },
    ],
    misconceptions: [
      { id: "waves-move-matter", match: ["waves carry matter", "water moves across the ocean"], label: "Waves transfer energy", correction: "Waves transfer energy, not bulk matter — water mostly bobs in place." },
    ],
    modelAnswer: "Waves transfer energy through oscillations. They have amplitude, wavelength, and frequency. Sound needs a medium; electromagnetic waves do not.",
  },

  electricity: {
    aliases: ["electricity", "electric circuits", "current", "voltage"],
    label: "Electricity Basics",
    concepts: [
      { id: "current", label: "Electric current", keywords: ["current", "flow of charge", "amps", "amperes"], hint: "Current is flow of electric charge.", importance: 3 },
      { id: "voltage", label: "Voltage", keywords: ["voltage", "volts", "potential difference", "push"], hint: "Voltage is the 'push' that drives current.", importance: 2 },
      { id: "resistance", label: "Resistance", keywords: ["resistance", "ohms", "resistor"], hint: "Resistance opposes current flow.", importance: 2 },
      { id: "circuit", label: "Complete circuit", keywords: ["circuit", "closed loop", "complete path"], hint: "Current needs a complete closed circuit.", importance: 2 },
    ],
    misconceptions: [
      { id: "current-used-up", match: ["current is used up", "electrons disappear"], label: "Current circulates", correction: "Charge circulates in a loop — it isn't used up in the wires." },
    ],
    modelAnswer: "Electricity is moving charge in a circuit. Voltage provides the push, resistance opposes flow, and current is the rate of charge flow.",
  },

  "french revolution": {
    aliases: ["french revolution", "causes of the french revolution"],
    label: "French Revolution",
    concepts: [
      { id: "inequality", label: "Social inequality", keywords: ["inequality", "third estate", "privilege", "nobility", "clergy"], hint: "The Third Estate bore taxes while elites had privileges.", importance: 3 },
      { id: "financial", label: "Financial crisis", keywords: ["debt", "bankrupt", "financial", "taxes"], hint: "France faced heavy debt and fiscal crisis.", importance: 2 },
      { id: "enlightenment", label: "Enlightenment ideas", keywords: ["enlightenment", "liberty", "rights", "reason"], hint: "Ideas of liberty and rights inspired change.", importance: 2 },
      { id: "events", label: "Key events", keywords: ["bastille", "1789", "reign of terror", "napoleon"], hint: "Major events include the storming of the Bastille and political upheaval.", importance: 2 },
    ],
    misconceptions: [
      { id: "only-violence", match: ["only about violence", "just angry mobs"], label: "Political revolution", correction: "It was also about rights, representation, and restructuring society." },
    ],
    modelAnswer: "The French Revolution (from 1789) stemmed from inequality, financial crisis, and Enlightenment ideals. It overthrew the old order and reshaped France and Europe.",
  },

  democracy: {
    aliases: ["democracy", "what is democracy", "democratic government"],
    label: "Democracy",
    concepts: [
      { id: "people", label: "Rule by the people", keywords: ["people", "citizens", "popular", "vote"], hint: "Power ultimately rests with citizens.", importance: 3 },
      { id: "elections", label: "Free elections", keywords: ["election", "vote", "ballot", "choose leaders"], hint: "Leaders are chosen through elections.", importance: 3 },
      { id: "rights", label: "Rights & freedoms", keywords: ["rights", "freedom", "speech", "press", "assembly"], hint: "Individual rights and freedoms are protected.", importance: 2 },
      { id: "law", label: "Rule of law", keywords: ["rule of law", "constitution", "accountable", "limits"], hint: "Leaders and citizens are subject to law.", importance: 2 },
    ],
    misconceptions: [
      { id: "majority-always", match: ["majority always right", "whatever most people want"], label: "Majority with limits", correction: "Democracy protects minority rights — majority rule has constitutional limits." },
    ],
    modelAnswer: "Democracy is government by the people through free elections, protected rights, and rule of law. Leaders are accountable to citizens.",
  },

  "climate change": {
    aliases: ["climate change", "global warming", "greenhouse effect"],
    label: "Climate Change",
    concepts: [
      { id: "greenhouse", label: "Greenhouse gases", keywords: ["greenhouse", "co2", "carbon dioxide", "methane", "trap heat"], hint: "Greenhouse gases trap heat in the atmosphere.", importance: 3 },
      { id: "human", label: "Human causes", keywords: ["human", "burning fossil", "industry", "deforestation", "emissions"], hint: "Human activities increase greenhouse gas levels.", importance: 3 },
      { id: "effects", label: "Effects", keywords: ["warming", "sea level", "extreme weather", "ice melt"], hint: "Effects include warming, melting ice, and extreme weather.", importance: 2 },
      { id: "long-term", label: "Long-term climate", keywords: ["climate", "long term", "decades", "average"], hint: "Climate change is long-term shift in average conditions.", importance: 2 },
    ],
    misconceptions: [
      { id: "weather-climate", match: ["cold day proves", "weather disproves"], label: "Weather ≠ climate", correction: "One cold day doesn't disprove long-term climate trends." },
    ],
    modelAnswer: "Climate change is long-term warming driven mainly by human greenhouse gas emissions. It alters weather patterns, sea levels, and ecosystems worldwide.",
  },

  "supply and demand": {
    aliases: ["supply and demand", "supply demand", "market economics"],
    label: "Supply and Demand",
    concepts: [
      { id: "demand", label: "Demand", keywords: ["demand", "buyers", "want", "willing to pay"], hint: "Demand is how much buyers want at various prices.", importance: 3 },
      { id: "supply", label: "Supply", keywords: ["supply", "sellers", "producers", "available"], hint: "Supply is how much sellers offer at various prices.", importance: 3 },
      { id: "equilibrium", label: "Equilibrium price", keywords: ["equilibrium", "balance", "meet", "market price"], hint: "Price settles where supply meets demand.", importance: 2 },
      { id: "shift", label: "Shifts", keywords: ["shift", "increase", "decrease", "shortage", "surplus"], hint: "Changes in supply or demand shift prices.", importance: 2 },
    ],
    misconceptions: [
      { id: "high-price-demand", match: ["higher price means more demand"], label: "Law of demand", correction: "Usually, higher prices reduce quantity demanded." },
    ],
    modelAnswer: "Supply and demand determine prices. Buyers want more at lower prices; sellers offer more at higher prices. The market price is where they balance.",
  },

  "essay thesis": {
    aliases: ["essay thesis", "thesis statement", "writing a thesis", "how to write a thesis"],
    label: "Writing a Thesis",
    concepts: [
      { id: "claim", label: "Clear claim", keywords: ["claim", "argument", "position", "thesis"], hint: "A thesis states your main argument clearly.", importance: 3 },
      { id: "specific", label: "Specific, not vague", keywords: ["specific", "narrow", "focused", "precise"], hint: "Avoid vague topics — be specific.", importance: 2 },
      { id: "debatable", label: "Debatable", keywords: ["debatable", "not a fact", "someone could disagree"], hint: "A thesis should be arguable, not just a fact.", importance: 2 },
      { id: "roadmap", label: "Roadmap", keywords: ["roadmap", "preview", "main points", "because"], hint: "It often previews the main reasons you'll support.", importance: 2 },
    ],
    misconceptions: [
      { id: "question-thesis", match: ["thesis is a question", "ask a question"], label: "Thesis is a statement", correction: "A thesis answers a question — it is a statement, not the question itself." },
    ],
    modelAnswer: "A thesis is a clear, specific, debatable claim that states your essay's main argument and often previews your supporting points.",
  },

  "plate tectonics": {
    aliases: ["plate tectonics", "tectonic plates", "continental drift"],
    label: "Plate Tectonics",
    concepts: [
      { id: "plates", label: "Lithospheric plates", keywords: ["plates", "tectonic", "lithosphere", "crust"], hint: "Earth's outer shell is broken into moving plates.", importance: 3 },
      { id: "movement", label: "Plate movement", keywords: ["move", "drift", "convection", "mantle"], hint: "Plates move slowly driven by mantle convection.", importance: 2 },
      { id: "boundaries", label: "Boundaries", keywords: ["boundary", "divergent", "convergent", "transform", "collision"], hint: "Earthquakes and volcanoes occur at plate boundaries.", importance: 2 },
      { id: "evidence", label: "Evidence", keywords: ["fossil", "fit of continents", "seafloor spreading", "wegener"], hint: "Fossil matches and seafloor spreading support the theory.", importance: 2 },
    ],
    misconceptions: [
      { id: "fast-movement", match: ["plates move quickly", "continents move fast"], label: "Slow movement", correction: "Plates move centimeters per year — very slowly." },
    ],
    modelAnswer: "Earth's lithosphere is divided into plates that move over the mantle. Their interactions at boundaries cause earthquakes, volcanoes, and mountain building.",
  },

  "states of matter": {
    aliases: ["states of matter", "solid liquid gas", "phase changes"],
    label: "States of Matter",
    concepts: [
      { id: "solid", label: "Solid", keywords: ["solid", "fixed shape", "fixed volume", "particles vibrate"], hint: "Solids have fixed shape and volume.", importance: 2 },
      { id: "liquid", label: "Liquid", keywords: ["liquid", "flow", "takes shape of container"], hint: "Liquids have fixed volume but take container shape.", importance: 2 },
      { id: "gas", label: "Gas", keywords: ["gas", "spread out", "compress"], hint: "Gases expand to fill their container.", importance: 2 },
      { id: "changes", label: "Phase changes", keywords: ["melt", "freeze", "evaporat", "condens", "sublim"], hint: "Heating/cooling causes melting, boiling, freezing, etc.", importance: 2 },
    ],
    misconceptions: [
      { id: "particles-shrink", match: ["particles shrink when cold", "molecules get smaller"], label: "Particles don't shrink", correction: "Particles stay the same size — they just move closer or farther apart." },
    ],
    modelAnswer: "Matter exists as solids, liquids, and gases. Particle arrangement and energy differ. Phase changes occur when energy is added or removed.",
  },

  "digestive system": {
    aliases: ["digestive system", "digestion", "human digestion"],
    label: "Digestive System",
    concepts: [
      { id: "breakdown", label: "Breaks down food", keywords: ["break down", "digest", "enzymes", "mechanical"], hint: "Digestion breaks food into absorbable nutrients.", importance: 3 },
      { id: "organs", label: "Key organs", keywords: ["stomach", "intestine", "small intestine", "esophagus", "mouth"], hint: "Includes mouth, stomach, and intestines.", importance: 2 },
      { id: "absorption", label: "Absorption", keywords: ["absorb", "nutrients", "small intestine", "bloodstream"], hint: "Nutrients are absorbed mainly in the small intestine.", importance: 3 },
      { id: "waste", label: "Waste removal", keywords: ["waste", "feces", "large intestine", "eliminate"], hint: "Undigested material is eliminated as waste.", importance: 1 },
    ],
    misconceptions: [
      { id: "stomach-all", match: ["all digestion in stomach", "stomach does everything"], label: "Multi-step process", correction: "Digestion starts in the mouth and continues through intestines." },
    ],
    modelAnswer: "The digestive system breaks food down with enzymes, absorbs nutrients in the small intestine, and eliminates waste. It fuels the body.",
  },

  magnetism: {
    aliases: ["magnetism", "magnets", "magnetic fields"],
    label: "Magnetism",
    concepts: [
      { id: "poles", label: "North & south poles", keywords: ["north pole", "south pole", "poles", "attract", "repel"], hint: "Opposite poles attract; like poles repel.", importance: 3 },
      { id: "field", label: "Magnetic field", keywords: ["field", "invisible", "lines of force"], hint: "Magnets create invisible fields around them.", importance: 2 },
      { id: "materials", label: "Magnetic materials", keywords: ["iron", "nickel", "cobalt", "ferromagnetic"], hint: "Some metals like iron are strongly magnetic.", importance: 2 },
      { id: "electromagnet", label: "Electromagnets", keywords: ["electromagnet", "current", "wire coil"], hint: "Electric current can create magnetism.", importance: 1 },
    ],
    misconceptions: [
      { id: "all-metals", match: ["all metals are magnetic", "every metal sticks"], label: "Not all metals", correction: "Only some metals (like iron) are ferromagnetic." },
    ],
    modelAnswer: "Magnetism involves attractive and repulsive forces between poles. Magnetic fields surround magnets, and electric current can create electromagnets.",
  },

  "world war one": {
    aliases: ["world war one", "world war 1", "ww1 causes", "causes of ww1"],
    label: "World War I Causes",
    concepts: [
      { id: "alliances", label: "Alliance system", keywords: ["alliance", "triple entente", "triple alliance", "treaty"], hint: "Rival alliance blocs pulled nations into war.", importance: 3 },
      { id: "militarism", label: "Militarism", keywords: ["militarism", "arms race", "military buildup"], hint: "Arms races made war more likely.", importance: 2 },
      { id: "imperialism", label: "Imperialism", keywords: ["imperialism", "colonies", "empire", "rivalry"], hint: "Competition for colonies created tension.", importance: 2 },
      { id: "nationalism", label: "Nationalism", keywords: ["nationalism", "pride", "ethnic", "serbia", "austria"], hint: "Strong national pride fueled conflicts.", importance: 2 },
      { id: "trigger", label: "Assassination trigger", keywords: ["assassination", "sarajevo", "archduke", "franz ferdinand"], hint: "The assassination of Archduke Franz Ferdinand triggered the crisis.", importance: 2 },
    ],
    misconceptions: [
      { id: "only-assassination", match: ["only because of assassination", "just one event"], label: "Long-term causes", correction: "The assassination was the spark — alliances and tensions built for years." },
    ],
    modelAnswer: "WWI arose from alliances, militarism, imperialism, and nationalism. The assassination of Franz Ferdinand in 1914 triggered the alliance system into war.",
  },
};

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
    if (key === t || entry.aliases.some((a) => t === a || t.includes(a) || a.includes(t))) {
      return entry;
    }
  }
  return null;
}
