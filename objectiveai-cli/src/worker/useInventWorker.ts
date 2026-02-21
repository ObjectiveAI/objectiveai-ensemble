import { useState, useEffect, useRef } from "react";
import { Worker } from "worker_threads";
import { Notification } from "../notification";
import type { MainToWorker, WorkerToMain } from "./types";

export function useInventWorker(
  onNotification: (notification: Notification) => void,
  message: MainToWorker,
): boolean {
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const workerPath = new URL("./inventWorker.js", import.meta.url);
    const worker = new Worker(workerPath);

    worker.on("message", (msg: WorkerToMain) => {
      if (msg.type === "notification") {
        onNotification(msg.notification);
      } else if (msg.type === "done" || msg.type === "error") {
        if (msg.type === "error") {
          console.error("Worker error:", msg.message);
        }
        setDone(true);
      }
    });

    worker.on("error", (err) => {
      console.error("Worker thread error:", err);
      setDone(true);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
      }
      setDone(true);
    });

    worker.postMessage(message);

    return () => {
      worker.terminate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return done;
}
