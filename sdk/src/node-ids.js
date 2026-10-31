export function createNodeIdStore() {
  const nodeIds = new WeakMap();
  let nextId = 1;

  function getId(node) {
    if (!(node instanceof Node)) {
      throw new TypeError("getId expects a DOM node.");
    }

    if (nodeIds.has(node)) {
      return nodeIds.get(node);
    }

    const assignedId = nextId;

    nodeIds.set(node, assignedId);
    nextId += 1;

    return assignedId;
  }

  return { getId };
}