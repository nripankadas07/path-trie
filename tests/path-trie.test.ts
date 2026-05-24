import assert from "node:assert/strict";
import test from "node:test";
import { PathTrie } from "../src/index.js";

test("sets and gets exact path values", () => {
  const trie = new PathTrie<number>();
  trie.set("/api/users", 1);
  assert.equal(trie.get("api/users"), 1);
  assert.equal(trie.has("/api/users"), true);
  assert.equal(trie.size, 1);
});

test("finds the longest stored prefix", () => {
  const trie = new PathTrie<string>();
  trie.set("/api", "root");
  trie.set("/api/users", "users");
  assert.deepEqual(trie.longestPrefix("/api/users/42"), {
    key: "api/users",
    value: "users",
  });
});

test("iterates and deletes by prefix", () => {
  const trie = new PathTrie<number>();
  trie.set("/a/b", 1).set("/a/c", 2).set("/x", 3);
  assert.deepEqual([...trie.entriesWithPrefix("/a")], [
    ["a/b", 1],
    ["a/c", 2],
  ]);
  assert.equal(trie.deletePrefix("/a"), 2);
  assert.equal(trie.size, 1);
  assert.deepEqual([...trie.keysWithPrefix("/")], ["x"]);
});

test("supports custom separators", () => {
  const trie = new PathTrie<boolean>({ separator: "." });
  trie.set("events.user.created", true);
  assert.equal(trie.get("events.user.created"), true);
  assert.equal(trie.longestPrefix("events.user.created.v2")?.key, "events.user.created");
});
