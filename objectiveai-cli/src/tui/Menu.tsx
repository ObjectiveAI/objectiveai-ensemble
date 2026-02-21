import { useState, useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { ParametersBuilder } from "../parameters";

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

  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
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
        setInput("");
        setCursorPos(0);
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
        setInput("");
        setCursorPos(0);
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

    if (key.backspace || key.delete) {
      if (inWizard && input.length === 0) {
        // Go back a wizard step
        if (wizardStep! > 0) {
          const prev = wizardValues.slice(0, -1);
          setWizardValues(prev);
          setWizardStep(wizardStep! - 1);
          setInput("");
          setCursorPos(0);
        } else {
          // Exit wizard back to menu
          setWizardStep(null);
          setWizardValues([]);
          setInput("");
          setCursorPos(0);
        }
      } else if (cursorPos > 0) {
        setInput((prev) => prev.slice(0, cursorPos - 1) + prev.slice(cursorPos));
        setCursorPos((prev) => prev - 1);
      }
      return;
    }

    if (key.escape) {
      if (inWizard) {
        setWizardStep(null);
        setWizardValues([]);
      }
      setInput("");
      setCursorPos(0);
      return;
    }

    if (key.leftArrow) {
      setCursorPos((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorPos((prev) => Math.min(input.length, prev + 1));
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

    if (ch && !key.ctrl && !key.meta) {
      setInput((prev) => prev.slice(0, cursorPos) + ch + prev.slice(cursorPos));
      setCursorPos((prev) => prev + 1);
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
