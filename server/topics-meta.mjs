import { TOPICS } from "./concepts.mjs";

export const TOPIC_PACKS = [
  {
    id: "science",
    label: "Science",
    topics: [
      { key: "photosynthesis", label: "Photosynthesis" },
      { key: "water cycle", label: "The Water Cycle" },
      { key: "the human heart", label: "The Human Heart" },
      { key: "cell structure", label: "Cell Structure" },
      { key: "food chains", label: "Food Chains" },
    ],
  },
  {
    id: "physics",
    label: "Physics",
    topics: [
      { key: "gravity", label: "Gravity" },
      { key: "newtons laws", label: "Newton's Laws" },
      { key: "energy", label: "Energy" },
      { key: "waves", label: "Waves" },
      { key: "electricity", label: "Electricity Basics" },
    ],
  },
  {
    id: "humanities",
    label: "Humanities & Social Studies",
    topics: [
      { key: "french revolution", label: "French Revolution" },
      { key: "democracy", label: "Democracy" },
      { key: "climate change", label: "Climate Change" },
      { key: "supply and demand", label: "Supply and Demand" },
      { key: "essay thesis", label: "Writing a Thesis" },
    ],
  },
  {
    id: "more",
    label: "More Science",
    topics: [
      { key: "plate tectonics", label: "Plate Tectonics" },
      { key: "states of matter", label: "States of Matter" },
      { key: "digestive system", label: "Digestive System" },
      { key: "magnetism", label: "Magnetism" },
      { key: "world war one", label: "World War I Causes" },
    ],
  },
];

export function listTopics() {
  return {
    packs: TOPIC_PACKS,
    total: Object.keys(TOPICS).length,
  };
}
