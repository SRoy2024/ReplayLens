const SAFE_TAGS = new Set(
  (
    "html head body title style " +
    "main header footer nav section article aside div span " +
    "h1 h2 h3 h4 h5 h6 p a button " +
    "form label input textarea select option optgroup " +
    "ul ol li strong em b i small pre code blockquote " +
    "table thead tbody tfoot tr th td caption " +
    "img figure figcaption br hr"
  ).split(" ")
);

const SAFE_ATTRIBUTES = new Set([
  "id",
  "class",
  "type",
  "role",
  "hidden",
  "disabled",
  "multiple",
  "required",
  "readonly",
  "style",
  "data-replay-blocked",
]);

const REPLAY_CSP =
  "default-src 'none'; " +
  "script-src 'none'; " +
  "style-src 'unsafe-inline'; " +
  "form-action 'none'; " +
  "base-uri 'none'";

function buildTree(tree, replayDocument) {
  const nodeMap = new Map();

  function buildNode(serialized) {
    if (serialized.kind === "text") {
      const textNode = replayDocument.createTextNode(
        serialized.text
      );

      nodeMap.set(serialized.id, textNode);

      return textNode;
    }

    if (
      serialized.kind !== "element" ||
      !SAFE_TAGS.has(serialized.tag)
    ) {
      return null;
    }

    const element = replayDocument.createElement(
      serialized.tag
    );

    nodeMap.set(serialized.id, element);

    for (const [name, value] of Object.entries(
      serialized.attrs ?? {}
    )) {
      if (SAFE_ATTRIBUTES.has(name)) {
        element.setAttribute(name, value);
      }
    }

    for (const child of serialized.children ?? []) {
      const childNode = buildNode(child);

      if (childNode !== null) {
        element.appendChild(childNode);
      }
    }

    const state = serialized.state;

    if (state) {
      if (
        serialized.tag === "textarea" ||
        (serialized.tag === "input" &&
          element.type !== "file")
      ) {
        element.value = state.value ?? "";
      }

      if (
        serialized.tag === "input" &&
        typeof state.checked === "boolean"
      ) {
        element.checked = state.checked;
      }

      if (
        serialized.tag === "select" &&
        Number.isInteger(state.selectedIndex)
      ) {
        element.selectedIndex = state.selectedIndex;
      }
    }

    return element;
  }

  return {
    root: buildNode(tree),
    nodeMap,
  };
}

export async function renderSnapshot(frame, snapshot) {
  frame.setAttribute("sandbox", "allow-same-origin");

  frame.style.width = `${snapshot.viewport.w}px`;
  frame.style.height = `${snapshot.viewport.h}px`;

  await new Promise((resolve) => {
    frame.addEventListener("load", resolve, {
      once: true,
    });

    frame.srcdoc = `
      <!doctype html>
      <html>
        <head>
          <meta
            http-equiv="Content-Security-Policy"
            content="${REPLAY_CSP}"
          />
        </head>
        <body></body>
      </html>
    `;
  });

  const replayDocument = frame.contentDocument;

  if (!replayDocument) {
    throw new Error("Cannot access the replay document.");
  }

  const { root, nodeMap } = buildTree(
    snapshot.tree,
    replayDocument
  );

  if (!root || root.tagName !== "HTML") {
    throw new Error("Snapshot root must be an HTML element.");
  }

  let head = root.querySelector("head");

  if (!head) {
    head = replayDocument.createElement("head");
    root.prepend(head);
  }

  const policy = replayDocument.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = REPLAY_CSP;
  head.prepend(policy);

  replayDocument.replaceChild(
    root,
    replayDocument.documentElement
  );

  frame.contentWindow.scrollTo(
    snapshot.scroll.x,
    snapshot.scroll.y
  );

  return nodeMap;
}