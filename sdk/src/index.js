import { createNodeIdStore } from "./node-ids.js";
import { getPrivacyMode, maskValue } from "./privacy.js";
import { createSnapshotRecorder } from "./snapshot.js";

const nodeIds = createNodeIdStore();
const snapshotRecorder = createSnapshotRecorder(nodeIds);

window.__REPLAYLENS_DEBUG__ = {
  nodeIds,
  privacy: {
    getPrivacyMode,
    maskValue,
  },
  snapshot: snapshotRecorder,
};