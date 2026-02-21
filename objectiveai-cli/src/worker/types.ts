import { InventOptions } from "../invent";
import { Notification } from "../notification";

export type MainToWorker =
  | { type: "invent"; options: InventOptions }
  | { type: "inventPlaceholders"; name: string };

export type WorkerToMain =
  | { type: "notification"; notification: Notification }
  | { type: "done" }
  | { type: "error"; message: string };
