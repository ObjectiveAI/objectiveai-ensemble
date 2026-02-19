import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { InventView, useInventNotifications } from "./tui/Invent";
import { invent } from "./invent";
import { ParametersBuilder } from "./parameters";
import { Notification } from "./notification";

function parseInt10(value: string): number | undefined {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseParametersBuilder(
  opts: Record<string, string | undefined>,
): ParametersBuilder {
  return {
    ...(opts.depth !== undefined ? { depth: parseInt10(opts.depth) } : {}),
    ...(opts.width !== undefined ? { width: parseInt10(opts.width) } : {}),
    ...(opts.minWidth !== undefined
      ? { minWidth: parseInt10(opts.minWidth) }
      : {}),
    ...(opts.maxWidth !== undefined
      ? { maxWidth: parseInt10(opts.maxWidth) }
      : {}),
    ...(opts.branchMinWidth !== undefined
      ? { branchMinWidth: parseInt10(opts.branchMinWidth) }
      : {}),
    ...(opts.branchMaxWidth !== undefined
      ? { branchMaxWidth: parseInt10(opts.branchMaxWidth) }
      : {}),
    ...(opts.leafMinWidth !== undefined
      ? { leafMinWidth: parseInt10(opts.leafMinWidth) }
      : {}),
    ...(opts.leafMaxWidth !== undefined
      ? { leafMaxWidth: parseInt10(opts.leafMaxWidth) }
      : {}),
  };
}

function InventApp({
  subscribe,
}: {
  subscribe: (cb: (notification: Notification) => void) => void;
}) {
  const { tree, onNotification } = useInventNotifications();

  React.useEffect(() => {
    subscribe(onNotification);
  }, [subscribe, onNotification]);

  return React.createElement(InventView, { tree });
}

const program = new Command();

program.name("objectiveai").description("ObjectiveAI CLI");

const exitFullScreen = () => {
  process.stdout.write("\x1b[?1049l");
};

const inventCommand = program
  .command("invent")
  .description("Invent a new ObjectiveAI Function")
  .argument("[spec]", "What the function should do")
  .option("-d, --depth <number>", "Function depth")
  .option("-w, --width <number>", "Fixed task width (min and max)")
  .option("--min-width <number>", "Minimum task width (branch and leaf)")
  .option("--max-width <number>", "Maximum task width (branch and leaf)")
  .option("--branch-min-width <number>", "Branch minimum task width")
  .option("--branch-max-width <number>", "Branch maximum task width")
  .option("--leaf-min-width <number>", "Leaf minimum task width")
  .option("--leaf-max-width <number>", "Leaf maximum task width");

inventCommand.hook("preAction", () => {
  process.stdout.write("\x1b[?1049h\x1b[H");
  process.on("exit", exitFullScreen);
});

inventCommand.action(async (spec: string | undefined, opts) => {
  const parameters = parseParametersBuilder(opts);

  const dir = process.cwd();

  let listener: ((notification: Notification) => void) | undefined;
  const subscribe = (cb: (notification: Notification) => void) => {
    listener = cb;
  };

  const { unmount } = render(React.createElement(InventApp, { subscribe }));

  try {
    await invent(
      dir,
      (notification) => listener?.(notification),
      spec !== undefined ? { inventSpec: spec, parameters } : undefined,
    );
  } finally {
    // sleep 5 seconds
    unmount();
    exitFullScreen();
    process.removeListener("exit", exitFullScreen);
  }
});

program.parse();
