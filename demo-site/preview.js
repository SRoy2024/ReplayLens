import { renderSnapshot } from "../web/src/player/dom-builder.js";

const previewButton = document.querySelector("#preview-button");
const replayFrame = document.querySelector("#replay-frame");

previewButton.addEventListener("click", async () => {
  previewButton.disabled = true;

  try {
    const snapshot =
      window.__REPLAYLENS_DEBUG__.snapshot.capture();

    const nodeMap = await renderSnapshot(
      replayFrame,
      snapshot
    );

    console.log("Reconstructed nodes:", nodeMap.size);
  } catch (error) {
    console.error("Snapshot preview failed:", error);
  } finally {
    previewButton.disabled = false;
  }
});