import { useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import {
  ConfigJson,
  readHomeConfig,
  setHomeConfigValue,
  deleteHomeConfigValue,
} from "../config";
import { useTextInput } from "./useTextInput";

interface TextItem {
  label: string;
  key: keyof ConfigJson;
  kind: "text";
  validate?: (value: string) => boolean;
}

interface ToggleItem {
  label: string;
  key: keyof ConfigJson;
  kind: "toggle";
  options: string[];
}

type ConfigItem = TextItem | ToggleItem;

const CLAUDE_MODELS = ["opus", "sonnet", "haiku"];

const CONFIG_ITEMS: ConfigItem[] = [
  { label: "GitHub Token", key: "gitHubToken", kind: "text" },
  { label: "Git Author Name", key: "gitAuthorName", kind: "text" },
  { label: "Git Author Email", key: "gitAuthorEmail", kind: "text" },
  {
    label: "Agent",
    key: "agent",
    kind: "toggle",
    options: ["mock", "claude"],
  },
  {
    label: "Mock Agent Notification Delay Milliseconds",
    key: "agentMockNotificationDelayMs",
    kind: "text",
    validate: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0;
    },
  },
  {
    label: "Claude Agent Type Model",
    key: "agentClaudeTypeModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Name Model",
    key: "agentClaudeNameModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Essay Model",
    key: "agentClaudeEssayModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Fields Model",
    key: "agentClaudeFieldsModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Essay Tasks Model",
    key: "agentClaudeEssayTasksModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Body Model",
    key: "agentClaudeBodyModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
  {
    label: "Claude Agent Description Model",
    key: "agentClaudeDescriptionModel",
    kind: "toggle",
    options: CLAUDE_MODELS,
  },
];

const LABEL_WIDTH = Math.max(...CONFIG_ITEMS.map((item) => item.label.length)) + 2;

export function Config({ onBack }: { onBack: () => void }) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [{ text: editValue, cursor: cursorPos }, editActions] = useTextInput();
  const [values, setValues] = useState<Record<string, string | undefined>>(() => {
    const config = readHomeConfig();
    const result: Record<string, string | undefined> = {};
    for (const item of CONFIG_ITEMS) {
      const v = config[item.key];
      result[item.key] = v !== undefined ? String(v) : undefined;
    }
    return result;
  });

  const saveValue = (item: ConfigItem, value: string) => {
    if (item.key === "agentMockNotificationDelayMs") {
      setHomeConfigValue(item.key, Number(value));
    } else {
      setHomeConfigValue(item.key, value);
    }
    setValues((prev) => ({ ...prev, [item.key]: value }));
  };

  const clearValue = (item: ConfigItem) => {
    deleteHomeConfigValue(item.key);
    setValues((prev) => ({ ...prev, [item.key]: undefined }));
  };

  useInput((ch, key) => {
    if (editing) {
      if (key.escape) {
        setEditing(false);
        return;
      }
      if (key.return) {
        const item = CONFIG_ITEMS[selectedIndex];
        const trimmed = editValue.trim();
        if (trimmed === "") {
          clearValue(item);
        } else if (item.kind === "text" && item.validate && !item.validate(trimmed)) {
          return;
        } else {
          saveValue(item, trimmed);
        }
        setEditing(false);
        return;
      }
      editActions.handleKey(ch, key);
      return;
    }

    if (key.escape) {
      onBack();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(CONFIG_ITEMS.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const item = CONFIG_ITEMS[selectedIndex];
      if (item.kind === "toggle") {
        const current = values[item.key];
        const idx = current ? item.options.indexOf(current) : -1;
        const next = (idx + 1) % (item.options.length + 1);
        if (next === item.options.length) {
          clearValue(item);
        } else {
          saveValue(item, item.options[next]);
        }
      } else {
        setEditing(true);
        editActions.set(values[item.key] ?? "");
      }
    }
  });

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box>
        <Text bold color="#5948e7">Config</Text>
      </Box>
      <Box height={1} />
      {CONFIG_ITEMS.map((item, i) => {
        const selected = i === selectedIndex;
        const value = values[item.key];
        const isEditing = selected && editing;
        const prefix = selected ? "❯ " : "  ";

        return (
          <Box key={item.key}>
            {selected ? (
              <Text color="#5948e7" bold>{prefix}{item.label.padEnd(LABEL_WIDTH)}</Text>
            ) : (
              <Text dimColor>{prefix}{item.label.padEnd(LABEL_WIDTH)}</Text>
            )}
            {isEditing ? (
              <Text>{editValue.slice(0, cursorPos)}█{editValue.slice(cursorPos)}</Text>
            ) : value !== undefined ? (
              <Text dimColor={!selected}>{value}</Text>
            ) : (
              <Text color="gray" dimColor>unset</Text>
            )}
          </Box>
        );
      })}
      <Box flexGrow={1} />
      <Text dimColor>{"  press esc to go back"}</Text>
    </Box>
  );
}
