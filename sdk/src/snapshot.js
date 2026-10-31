import { getPrivacyMode, maskValue } from "./privacy.js";

const SKIPPED_TAGS = new Set([
  "script",
  "noscript",
  "iframe",
  "object",
  "embed",
  "base",
  "meta",
  "link",
]);

const ALLOWED_ATTRIBUTES = [
  "id",
  "class",
  "type",
  "role",
  "hidden",
  "disabled",
  "multiple",
  "required",
  "readonly",
];
export function createSnapshotRecorder(nodeIds) {
  function serializeNode(node) {
    if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.TEXT_NODE
    ) {
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();

      if (SKIPPED_TAGS.has(tag)) {
        return null;
      }

      if (tag === "input" && node.type === "hidden") {
        return null;
      }
    }

    const privacyMode = getPrivacyMode(node);

    if (privacyMode === "block") {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const bounds = node.getBoundingClientRect();

      return {
        id: nodeIds.getId(node),
        kind: "element",
        tag: "div",
        attrs: {
          "data-replay-blocked": "",
          style:
            `width:${Math.ceil(bounds.width)}px;` +
            `height:${Math.ceil(bounds.height)}px;` +
            "background:#e5e7eb;",
        },
        children: [],
      };
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return {
        id: nodeIds.getId(node),
        kind: "text",
        text:
          privacyMode === "mask"
            ? maskValue(node.data)
            : node.data,
      };
    }

    const tag = node.tagName.toLowerCase();
    const attrs = {};

    for (const name of ALLOWED_ATTRIBUTES) {
      if (node.hasAttribute(name)) {
        attrs[name] = node.getAttribute(name);
      }
    }

    const serialized = {
      id: nodeIds.getId(node),
      kind: "element",
      tag,
      attrs,
      children: [],
    };

    if (tag === "input" || tag === "textarea") {
      serialized.state = {
        value: maskValue(node.value),
      };

      if (
        tag === "input" &&
        (node.type === "checkbox" || node.type === "radio")
      ) {
        serialized.state.checked = node.checked;
      }
    }

    if (tag === "select") {
      serialized.state = {
        selectedIndex: node.selectedIndex,
      };
    }

    for (const child of node.childNodes) {
      const serializedChild = serializeNode(child);

      if (serializedChild !== null) {
        serialized.children.push(serializedChild);
      }
    }

    return serialized;
  }

  function capture() {
    return {
      tree: serializeNode(document.documentElement),
      url: window.location.origin + window.location.pathname,
      viewport: {
        w: window.innerWidth,
        h: window.innerHeight,
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY,
      },
    };
  }

  return { capture };
}