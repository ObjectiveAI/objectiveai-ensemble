import { useState, useEffect, useRef } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { scanFunctionsWithPlaceholders, FunctionWithPlaceholders } from "../fs";
import { getGitHubToken, getAgentUpstream } from "../config";
import { getAgentStepFn } from "../agent";
import { DefaultGitHubBackend } from "../github";
import { SelectableList } from "./SelectableList";
import { useInventNotifications, InventView } from "./Invent";
import { useInventWorker } from "../worker/useInventWorker";

function InventPlaceholdersList({
  onSelect,
  onBack,
}: {
  onSelect: (item: FunctionWithPlaceholders) => void;
  onBack: () => void;
}) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;

  const [items, setItems] = useState<FunctionWithPlaceholders[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const gitHubToken = getGitHubToken();
        if (!gitHubToken) {
          setError("GitHub token not configured");
          return;
        }
        const upstream = getAgentUpstream();
        if (!upstream) {
          setError("Agent not configured");
          return;
        }
        const [, gitHubBackend] = getAgentStepFn(upstream);
        const backend = gitHubBackend ?? DefaultGitHubBackend;
        const owner = await backend.getAuthenticatedUser(gitHubToken);
        setItems(scanFunctionsWithPlaceholders(owner));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    })();
  }, []);

  useInput((_ch, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (items && items.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
      } else if (key.return) {
        onSelect(items[selectedIndex]);
      }
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" height={termHeight}>
        <Text color="red">Error: {error}</Text>
        <Box flexGrow={1} />
        <Text dimColor>{"  press esc to go back"}</Text>
      </Box>
    );
  }

  if (items === null) {
    return (
      <Box flexDirection="column" height={termHeight}>
        <Text dimColor>Scanning for functions with placeholders...</Text>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box flexDirection="column" height={termHeight}>
        <Text dimColor>No functions with placeholders found.</Text>
        <Box flexGrow={1} />
        <Text dimColor>{"  press esc to go back"}</Text>
      </Box>
    );
  }

  const labelWidth = Math.max(...items.map((item) => item.name.length)) + 2;
  const listItems = items.map((item) => ({
    key: item.name,
    label: item.name,
    value: `${item.functionTasks}/${item.functionTasks + item.placeholderTasks}`,
  }));

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box>
        <Text bold color="#5948e7">Functions with placeholders</Text>
      </Box>
      <Box height={1} />
      <SelectableList
        items={listItems}
        selectedIndex={selectedIndex}
        labelWidth={labelWidth}
        viewportHeight={termHeight - 4}
      />
      <Box flexGrow={1} />
      <Text dimColor>{"  press esc to go back · enter to resume"}</Text>
    </Box>
  );
}

function InventPlaceholdersRun({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  const { tree, onNotification } = useInventNotifications();
  const done = useInventWorker(onNotification, {
    type: "inventPlaceholders",
    name,
  });

  useInput((_ch, key) => {
    if (key.escape && done) onBack();
  });

  return <InventView tree={tree} done={done} />;
}

export function InventPlaceholdersFlow({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<FunctionWithPlaceholders | null>(null);

  if (!selected) {
    return (
      <InventPlaceholdersList
        onSelect={setSelected}
        onBack={onBack}
      />
    );
  }

  return (
    <InventPlaceholdersRun
      key={selected.name}
      name={selected.name}
      onBack={() => setSelected(null)}
    />
  );
}
