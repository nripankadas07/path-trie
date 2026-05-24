export interface PathTrieOptions {
  separator?: string;
}

export interface PrefixMatch<T> {
  key: string;
  value: T;
}

interface Node<T> {
  children: Map<string, Node<T>>;
  value: T | undefined;
  hasValue: boolean;
}

function createNode<T>(): Node<T> {
  return { children: new Map(), value: undefined, hasValue: false };
}

export class PathTrie<T> {
  private readonly root = createNode<T>();
  private readonly separator: string;
  private count = 0;

  constructor(options: PathTrieOptions = {}) {
    const separator = options.separator ?? "/";
    if (separator.length === 0) {
      throw new Error("separator must not be empty");
    }
    this.separator = separator;
  }

  get size(): number {
    return this.count;
  }

  set(path: string, value: T): this {
    let node = this.root;
    for (const segment of this.segments(path)) {
      let child = node.children.get(segment);
      if (child === undefined) {
        child = createNode<T>();
        node.children.set(segment, child);
      }
      node = child;
    }
    if (!node.hasValue) {
      this.count += 1;
    }
    node.value = value;
    node.hasValue = true;
    return this;
  }

  get(path: string): T | undefined {
    const node = this.findNode(path);
    return node?.hasValue === true ? node.value : undefined;
  }

  has(path: string): boolean {
    return this.findNode(path)?.hasValue === true;
  }

  delete(path: string): boolean {
    const stack: Array<[Node<T>, string]> = [];
    let node = this.root;
    for (const segment of this.segments(path)) {
      const child = node.children.get(segment);
      if (child === undefined) {
        return false;
      }
      stack.push([node, segment]);
      node = child;
    }
    if (!node.hasValue) {
      return false;
    }
    node.value = undefined;
    node.hasValue = false;
    this.count -= 1;
    this.prune(stack, node);
    return true;
  }

  longestPrefix(path: string): PrefixMatch<T> | undefined {
    let node = this.root;
    let best: PrefixMatch<T> | undefined = node.hasValue
      ? { key: "", value: node.value as T }
      : undefined;
    const parts: string[] = [];
    for (const segment of this.segments(path)) {
      const child = node.children.get(segment);
      if (child === undefined) {
        break;
      }
      parts.push(segment);
      node = child;
      if (node.hasValue) {
        best = { key: this.join(parts), value: node.value as T };
      }
    }
    return best;
  }

  *entriesWithPrefix(prefix: string): IterableIterator<[string, T]> {
    const node = this.findNode(prefix);
    if (node === undefined) {
      return;
    }
    const base = this.segments(prefix);
    yield* this.walk(node, base);
  }

  *keysWithPrefix(prefix: string): IterableIterator<string> {
    for (const [key] of this.entriesWithPrefix(prefix)) {
      yield key;
    }
  }

  *valuesWithPrefix(prefix: string): IterableIterator<T> {
    for (const [, value] of this.entriesWithPrefix(prefix)) {
      yield value;
    }
  }

  deletePrefix(prefix: string): number {
    const parts = this.segments(prefix);
    if (parts.length === 0) {
      const removed = this.count;
      this.clear();
      return removed;
    }
    const stack: Array<[Node<T>, string]> = [];
    let node = this.root;
    for (const segment of parts) {
      const child = node.children.get(segment);
      if (child === undefined) {
        return 0;
      }
      stack.push([node, segment]);
      node = child;
    }
    const removed = this.countValues(node);
    const [parent, segment] = stack[stack.length - 1] as [Node<T>, string];
    parent.children.delete(segment);
    this.count -= removed;
    return removed;
  }

  clear(): void {
    this.root.children.clear();
    this.root.value = undefined;
    this.root.hasValue = false;
    this.count = 0;
  }

  private segments(path: string): string[] {
    return path.split(this.separator).filter((segment) => segment.length > 0);
  }

  private join(segments: string[]): string {
    return segments.join(this.separator);
  }

  private findNode(path: string): Node<T> | undefined {
    let node = this.root;
    for (const segment of this.segments(path)) {
      const child = node.children.get(segment);
      if (child === undefined) {
        return undefined;
      }
      node = child;
    }
    return node;
  }

  private *walk(node: Node<T>, prefix: string[]): IterableIterator<[string, T]> {
    if (node.hasValue) {
      yield [this.join(prefix), node.value as T];
    }
    for (const [segment, child] of node.children) {
      yield* this.walk(child, [...prefix, segment]);
    }
  }

  private prune(stack: Array<[Node<T>, string]>, node: Node<T>): void {
    let current = node;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (current.hasValue || current.children.size > 0) {
        return;
      }
      const [parent, segment] = stack[index] as [Node<T>, string];
      parent.children.delete(segment);
      current = parent;
    }
  }

  private countValues(node: Node<T>): number {
    let total = node.hasValue ? 1 : 0;
    for (const child of node.children.values()) {
      total += this.countValues(child);
    }
    return total;
  }
}
