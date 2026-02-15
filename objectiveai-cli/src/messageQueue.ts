export class MessageQueue {
  private messages: string[] = [];
  private waiter: (() => void) | null = null;
  onDrain?: (messages: string[]) => void;

  push(message: string): void {
    this.messages.push(message);
    if (this.waiter) {
      const resolve = this.waiter;
      this.waiter = null;
      resolve();
    }
  }

  drain(): string[] {
    const drained = this.messages.splice(0);
    if (drained.length > 0 && this.onDrain) {
      this.onDrain(drained);
    }
    return drained;
  }

  get length(): number {
    return this.messages.length;
  }

  waitForMessage(): Promise<void> {
    if (this.messages.length > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.waiter = resolve;
    });
  }
}
