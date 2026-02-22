export interface Notification {
  path: number[];
  name?: string;
  message: NotificationMessage;
}

export type NotificationMessage =
  | {
      role: "assistant";
      content: string;
    }
  | {
      role: "tool";
      name: string;
      error?: string;
    }
  | {
      role: "done";
      error?: string;
      functionTasks?: number;
      placeholderTasks?: number;
    }
  | {
      role: "waiting";
    };
