import test from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  visibleQuotes,
  removeNotebook,
  validateLibrary,
  newQuote,
} from "../src/library.js";

test("search combines notebook and author filters, and favorites are independent", () => {
  assert.equal(visibleQuotes(seed, "daily", "muir").length, 1);
  assert.equal(visibleQuotes(seed, "create", "muir").length, 0);
  assert.equal(visibleQuotes(seed, "favorites").length, 3);
  assert.equal(visibleQuotes(seed, "all", "  mountain  ").length, 1);
});
test("removing a notebook keeps all quotes and moves its quotes to Unfiled", () => {
  const next = removeNotebook(seed, "daily");
  assert.equal(next.quotes.length, seed.quotes.length);
  assert.equal(
    next.notebooks.some((n) => n.id === "daily"),
    false,
  );
  assert.equal(visibleQuotes(next, "unfiled").length, 2);
  assert.equal(
    seed.notebooks.some((n) => n.id === "daily"),
    true,
  );
});
test("library backups are checked before replacing saved data", () => {
  assert.equal(validateLibrary(seed), true);
  assert.equal(
    validateLibrary({
      version: 1,
      folders: [],
      notebooks: [],
      quotes: [{ text: 42 }],
    }),
    false,
  );
  assert.equal(validateLibrary({ ...seed, version: 8 }), false);
  assert.equal(validateLibrary(null), false);
});
test("new quotes have independent identities and a default usable background", () => {
  const quote = newQuote("daily");
  assert.notEqual(quote.id, newQuote().id);
  assert.equal(quote.notebookId, "daily");
  assert.equal(quote.background, "paper");
});
