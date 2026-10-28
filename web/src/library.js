export const STORAGE_KEY = "quo.library.v1";
export const fonts = [
  "Lora",
  "DM Sans",
  "Playfair Display",
  "Cormorant Garamond",
  "Libre Baskerville",
  "Inter",
  "Montserrat",
  "Caveat",
  "Space Mono",
  "Bitter",
  "Spectral",
  "Nunito",
];
export const backgrounds = [
  {
    id: "forest",
    name: "Still forest",
    image: "/photos/forest.jpg",
    color: "#00171f",
    ink: "#ffffff",
  },
  { id: "paper", name: "Pure white", color: "#ffffff", ink: "#00171f" },
  {
    id: "mountains",
    name: "Quiet mountains",
    image: "/photos/mountains.jpg",
    color: "#003459",
    ink: "#ffffff",
  },
  { id: "sage", name: "Bright cyan", color: "#00a8e8", ink: "#00171f" },
  { id: "clay", name: "Ocean teal", color: "#007ea7", ink: "#ffffff" },
  { id: "midnight", name: "After hours", color: "#003459", ink: "#ffffff" },
];
export const sizes = [
  {
    id: "small",
    name: "Small",
    width: 320,
    height: 320,
    description: "A small reminder. A big difference.",
  },
  {
    id: "medium",
    name: "Medium",
    width: 680,
    height: 320,
    description: "A little more room for your favorite words.",
  },
  {
    id: "large",
    name: "Large",
    width: 680,
    height: 720,
    description: "Let the words take center stage.",
  },
  {
    id: "xl",
    name: "Extra large",
    width: 1000,
    height: 480,
    description: "A wide canvas, inspired by iPad widgets.",
  },
  {
    id: "custom",
    name: "Custom",
    width: 600,
    height: 600,
    description: "Your canvas. Your dimensions.",
  },
];
export const seed = {
  version: 1,
  folders: [
    { id: "personal", name: "Personal growth" },
    { id: "creative", name: "Creative life" },
    { id: "moments", name: "Little moments" },
  ],
  notebooks: [
    { id: "daily", folderId: "personal", name: "Daily reminders" },
    { id: "live", folderId: "personal", name: "Words to live by" },
    { id: "create", folderId: "creative", name: "On creating" },
    { id: "slow", folderId: "moments", name: "The art of slowing down" },
  ],
  quotes: [
    {
      id: "q1",
      text: "And into the forest I go,\nto lose my mind\nand find my soul.",
      author: "John Muir (attributed)",
      notebookId: "daily",
      font: "Lora",
      background: "forest",
      darkness: 0.22,
      align: "center",
      favorite: true,
      updated: 6,
    },
    {
      id: "q2",
      text: "Almost everything will work again if you unplug it for a few minutes, including you.",
      author: "Anne Lamott",
      notebookId: "slow",
      font: "Lora",
      background: "paper",
      darkness: 0,
      align: "center",
      favorite: false,
      updated: 5,
    },
    {
      id: "q3",
      text: "It is not the mountain\nwe conquer,\nbut ourselves.",
      author: "Edmund Hillary",
      notebookId: "live",
      font: "Lora",
      background: "mountains",
      darkness: 0.18,
      align: "center",
      favorite: true,
      updated: 4,
    },
    {
      id: "q4",
      text: "Pay attention.\nBe astonished.\nTell about it.",
      author: "Mary Oliver",
      notebookId: "create",
      font: "Lora",
      background: "sage",
      darkness: 0,
      align: "center",
      favorite: false,
      updated: 3,
    },
    {
      id: "q5",
      text: "You do not have to see\nthe whole staircase.\nJust take the first step.",
      author: "Martin Luther King Jr. (attributed)",
      notebookId: "daily",
      font: "Lora",
      background: "clay",
      darkness: 0,
      align: "center",
      favorite: false,
      updated: 2,
    },
    {
      id: "q6",
      text: "What you seek\nis seeking you.",
      author: "Rumi (attributed)",
      notebookId: "live",
      font: "Lora",
      background: "midnight",
      darkness: 0,
      align: "center",
      favorite: true,
      updated: 1,
    },
  ],
};
export function newQuote(notebookId = "") {
  return {
    id: crypto.randomUUID(),
    text: "",
    author: "",
    notebookId,
    font: "Lora",
    background: "paper",
    darkness: 0,
    align: "center",
    favorite: false,
    updated: Date.now(),
  };
}
export function visibleQuotes(
  library,
  selection,
  search = "",
  sort = "recent",
) {
  return library.quotes
    .filter((q) => {
      const included =
        selection === "all" ||
        (selection === "favorites"
          ? q.favorite
          : selection === "unfiled"
            ? !q.notebookId
            : q.notebookId === selection);
      return (
        included &&
        `${q.text} ${q.author}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      );
    })
    .sort((a, b) =>
      sort === "author"
        ? a.author.localeCompare(b.author)
        : sort === "oldest"
          ? a.updated - b.updated
          : b.updated - a.updated,
    );
}
export function removeNotebook(library, id) {
  return {
    ...library,
    notebooks: library.notebooks.filter((n) => n.id !== id),
    quotes: library.quotes.map((q) =>
      q.notebookId === id ? { ...q, notebookId: "" } : q,
    ),
  };
}
export function validateLibrary(value) {
  return (
    value?.version === 1 &&
    Array.isArray(value.folders) &&
    Array.isArray(value.notebooks) &&
    Array.isArray(value.quotes) &&
    value.folders.every(
      (f) => typeof f.id === "string" && typeof f.name === "string",
    ) &&
    value.notebooks.every(
      (n) =>
        typeof n.id === "string" &&
        typeof n.name === "string" &&
        typeof n.folderId === "string",
    ) &&
    value.quotes.every(
      (q) =>
        typeof q.id === "string" &&
        typeof q.text === "string" &&
        typeof q.author === "string" &&
        fonts.includes(q.font) &&
        backgrounds.some((b) => b.id === q.background) &&
        ["left", "center", "right"].includes(q.align) &&
        Number.isFinite(q.darkness) &&
        Number.isFinite(q.updated),
    )
  );
}
