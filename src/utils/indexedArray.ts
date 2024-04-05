export type IndexedArray<G> = G[] & {
  _indexes: IndexStore<G>;
  $find: (column: keyof G, needle: G[keyof G]) => G | undefined;
  $query: (column: keyof G, needle: G[keyof G]) => G[];
};

type IndexStore<G> = {
  [Property in keyof G]?: { [key: string]: number[] };
};

export function createIndexedArray<G>(array: G[]): G[] & {
  _indexes: IndexStore<G>;
  $find: (column: keyof G, needle: G[keyof G]) => G | undefined;
  $query: (column: keyof G, needle: G[keyof G]) => G[];
} {
  const indexStore: IndexStore<G> = {};
  const columnIndexStore: Record<string, IndexedArray<G>> = {};

  const handler: ProxyHandler<G[]> = {
    get(target, prop, receiver) {
      if (prop === "_indexes") {
        return indexStore;
      } else if (prop === "$find") {
        return function (column: keyof G, needle: G[keyof G]): G | undefined {
          return indexedRecord(target, column, needle);
        };
      } else if (prop === "$query") {
        return function (column: keyof G, needle: G[keyof G]): G[] {
          return indexedMany(target, column, needle);
        };
      }
      return Reflect.get(...arguments);
    },
  };

  function indexedRecord(
    records: G[],
    column: keyof G,
    needle: G[keyof G],
  ): G | undefined {
    if (!indexStore[column]) {
      buildIndex(records, column);
    }

    const index = indexStore[column];
    const recordIndex =
      index && index[String(needle)] ? index[String(needle)][0] : null;
    return recordIndex !== null ? records[recordIndex] : undefined;
  }

  function indexedMany<K extends keyof G>(
    records: G[],
    column: K,
    needle: G[K],
  ): IndexedArray<G> {
    if (!indexStore[column]) {
      buildIndex(records, column);
    }

    const index = indexStore[column];
    const key = `${String(column)}_${String(needle)}`;
    const columnIndex = columnIndexStore[key];
    if (columnIndex) {
      return columnIndex;
    } else {
      const recordIndexes = (index && index[String(needle)]) || [];
      const matching = recordIndexes.map((idx) => records[idx]);
      columnIndexStore[key] = createIndexedArray<G>(matching);
      return columnIndexStore[key];
    }
  }

  function buildIndex<K extends keyof G>(records: G[], propName: K): void {
    const index: { [key: string]: number[] } = {};
    records.forEach((item, idx) => {
      const key = String(item[propName]);
      if (!index[key]) {
        index[key] = [];
      }
      index[key].push(idx);
    });
    indexStore[propName] = index;
  }

  return new Proxy(array, handler) as G[] & {
    _indexes: IndexStore<G>;
    $find: (column: keyof G, needle: G[keyof G]) => G | undefined;
    $query: (column: keyof G, needle: G[keyof G]) => G[];
  };
}
