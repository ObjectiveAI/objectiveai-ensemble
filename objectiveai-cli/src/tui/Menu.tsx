import { useState, useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { ParametersBuilder } from "../parameters";
import { useTextInput } from "./useTextInput";

interface Command {
  name: string;
  description: string;
}

const COMMANDS: Command[] = [
  { name: "/invent", description: "Invent a new ObjectiveAI Function" },
  { name: "/config", description: "Open the Config Panel" },
];

interface WizardStep {
  label: string;
  helper: string;
  placeholder: string;
}

const INVENT_WIZARD: WizardStep[] = [
  {
    label: "What should this function do?",
    helper: "Describe the function's purpose",
    placeholder: "",
  },
  {
    label: "Enter depth",
    helper: "How many levels of sub-functions (0 = leaf only)",
    placeholder: "1",
  },
  {
    label: "Enter minimum width",
    helper: "Minimum tasks per function",
    placeholder: "4",
  },
  {
    label: "Enter maximum width",
    helper: "Maximum tasks per function",
    placeholder: "8",
  },
];

export type MenuResult =
  | { command: "invent"; spec: string; parameters: ParametersBuilder }
  | { command: "config" };

export function Menu({ onResult }: { onResult: (result: MenuResult) => void }) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;

  const [{ text: input, cursor: cursorPos }, inputActions] = useTextInput();
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [wizardValues, setWizardValues] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inWizard = wizardStep !== null;
  const commandsOpen = !inWizard && input.length > 0 && input.startsWith("/");

  const filtered = commandsOpen
    ? COMMANDS.filter((c) => c.name.startsWith(input))
    : [];

  const handleCommandEnter = useCallback(
    (cmd: string) => {
      if (cmd === "/config") {
        onResult({ command: "config" });
      } else if (cmd === "/invent") {
        setWizardStep(0);
        setWizardValues([]);
        inputActions.clear();
      }
    },
    [onResult],
  );

  const handleWizardEnter = useCallback(
    (value: string) => {
      if (wizardStep === null) return;
      const step = INVENT_WIZARD[wizardStep];
      const resolved = value.trim() || step.placeholder;
      if (!resolved) return;
      const next = [...wizardValues, resolved];

      if (wizardStep < INVENT_WIZARD.length - 1) {
        setWizardValues(next);
        setWizardStep(wizardStep + 1);
        inputActions.clear();
      } else {
        // Wizard complete
        const [spec, depth, minWidth, maxWidth] = next;
        const depthNum = parseInt(depth, 10);
        const minWidthNum = parseInt(minWidth, 10);
        const maxWidthNum = parseInt(maxWidth, 10);
        onResult({
          command: "invent",
          spec,
          parameters: {
            depth: Number.isFinite(depthNum) ? depthNum : undefined,
            minWidth: Number.isFinite(minWidthNum) ? minWidthNum : undefined,
            maxWidth: Number.isFinite(maxWidthNum) ? maxWidthNum : undefined,
          },
        });
      }
    },
    [wizardStep, wizardValues, onResult],
  );

  useInput((ch, key) => {
    if (key.return) {
      if (inWizard) {
        handleWizardEnter(input);
      } else if (commandsOpen && filtered.length === 1) {
        handleCommandEnter(filtered[0].name);
      } else if (commandsOpen && filtered.length > 0) {
        handleCommandEnter(filtered[selectedIndex]?.name ?? filtered[0].name);
      }
      return;
    }

    if ((key.backspace || key.delete) && inWizard && input.length === 0) {
      if (wizardStep! > 0) {
        setWizardValues(wizardValues.slice(0, -1));
        setWizardStep(wizardStep! - 1);
      } else {
        setWizardStep(null);
        setWizardValues([]);
      }
      inputActions.clear();
      return;
    }

    if (key.escape) {
      if (inWizard) {
        setWizardStep(null);
        setWizardValues([]);
      }
      inputActions.clear();
      return;
    }

    if (key.upArrow && commandsOpen) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow && commandsOpen) {
      setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      return;
    }

    if (inputActions.handleKey(ch, key)) {
      setSelectedIndex(0);
    }
  });

  const currentStep = inWizard ? INVENT_WIZARD[wizardStep!] : null;

  // Content below the input line
  let belowHeight = 0;
  if (commandsOpen && filtered.length > 0) belowHeight += filtered.length;
  if (!inWizard && !commandsOpen) belowHeight += 1; // hint
  if (inWizard && currentStep) belowHeight += 1; // helper

  // Input starts 1/3 up from the bottom, but moves up if below content needs room
  const targetFromBottom = Math.max(
    Math.floor(termHeight / 3),
    belowHeight,
  );
  const spacerHeight = Math.max(0, termHeight - 1 - targetFromBottom);

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box height={spacerHeight} />

      {/* Input line */}
      <Box>
        <Text color="#5948e7" bold>{"❯ "}</Text>
        {input.length > 0 ? (
          <Text>{input.slice(0, cursorPos)}<Text dimColor>█</Text>{input.slice(cursorPos)}</Text>
        ) : currentStep && currentStep.placeholder ? (
          <Text>█<Text color="gray">{currentStep.placeholder}</Text></Text>
        ) : (
          <Text dimColor>█</Text>
        )}
      </Box>

      {/* Push helper/palette/hint to the very bottom */}
      <Box flexGrow={1} />

      {/* Wizard label + helper */}
      {inWizard && currentStep && (
        <Text dimColor>  {currentStep.label} — {currentStep.helper}</Text>
      )}

      {/* Command palette */}
      {commandsOpen && filtered.length > 0 && (
        <Box flexDirection="column">
          {filtered.map((cmd, i) => (
            <Text key={cmd.name}>
              {i === selectedIndex ? (
                <Text color="#5948e7" bold>{"  "}{cmd.name}</Text>
              ) : (
                <Text dimColor>{"  "}{cmd.name}</Text>
              )}
              <Text dimColor>{"  "}{cmd.description}</Text>
            </Text>
          ))}
        </Box>
      )}

      {/* Hint */}
      {!inWizard && !commandsOpen && (
        <Text dimColor>{"  type / for commands"}</Text>
      )}
    </Box>
  );
}
