export type Notification =
  | {
      name?: string;
      parent?: undefined;
      taskIndex?: undefined;
      message: NotificationMessage;
    }
  | {
      name?: string;
      parent: string;
      taskIndex: number;
      message: NotificationMessage;
    };

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
    };
