# path-trie

Path-keyed trie with hierarchical segment keys: longest-prefix lookup, prefix
iteration, prefix deletion, configurable separators, and zero runtime
dependencies.

## Install

```bash
npm install && npm run build
```

## Quick Start

```ts
import { PathTrie } from "path-trie";

const trie = new PathTrie<number>();
trie.set("/api/users", 1);
trie.set("/api/users/:id", 2);

trie.get("/api/users"); // 1
trie.longestPrefix("/api/users/:id/details"); // { key: "/api/users/:id", value: 2 }
```

## API

- `set(path, value)` inserts or replaces a value.
- `get(path)` returns the exact value for a path.
- `has(path)` checks whether a path has an exact value.
- `delete(path)` removes one path and prunes empty branches.
- `entriesWithPrefix(prefix)` iterates all entries under a prefix.
- `keysWithPrefix(prefix)` and `valuesWithPrefix(prefix)` project that iterator.
- `longestPrefix(path)` returns the deepest stored ancestor for a path.
- `deletePrefix(prefix)` removes all entries under a prefix.
- `clear()` removes every entry.

## Development

```bash
npm install
npm run build
npm test
```
