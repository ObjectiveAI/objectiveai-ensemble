import { parentPort } from "worker_threads";
import { invent } from "../invent";
import { Notification } from "../notification";
import type { MainToWorker, WorkerToMain } from "./types";

function post(msg: WorkerToMain) {
  parentPort!.postMessage(msg);
}

function onNotification(notification: Notification) {
  post({ type: "notification", notification });
}

parentPort!.on("message", async (msg: MainToWorker) => {
  try {
    if (msg.type === "invent") {
      await invent(onNotification, msg.options);
    } else if (msg.type === "inventPlaceholders") {
      await invent(onNotification, { name: msg.name });
    }
    post({ type: "done" });
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
