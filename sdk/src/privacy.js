export function maskValue(value) {
  const text = String(value ?? "");

  return "*".repeat(text.length);
}

export function getPrivacyMode(node) {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? node
      : node.parentElement;

  if (!element) {
    return "visible";
  }

  if (element.closest("[data-replay-block]")) {
    return "block";
  }

  if (
    element.closest(
      "[data-replay-mask], input, textarea, select"
    )
  ) {
    return "mask";
  }

  return "visible";
}