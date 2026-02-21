import { Box, Text } from "ink";

export interface SelectableListItem {
  key: string;
  label: string;
  value: string;
}

export function SelectableList({
  items,
  selectedIndex,
  labelWidth,
  viewportHeight,
}: {
  items: SelectableListItem[];
  selectedIndex: number;
  labelWidth: number;
  viewportHeight?: number;
}) {
  let visibleItems = items;
  let startIndex = 0;

  if (viewportHeight !== undefined && items.length > viewportHeight) {
    // Keep selected item visible with some context
    const half = Math.floor(viewportHeight / 2);
    startIndex = Math.max(0, Math.min(selectedIndex - half, items.length - viewportHeight));
    visibleItems = items.slice(startIndex, startIndex + viewportHeight);
  }

  return (
    <Box flexDirection="column">
      {visibleItems.map((item, i) => {
        const actualIndex = startIndex + i;
        const selected = actualIndex === selectedIndex;
        const prefix = selected ? "❯ " : "  ";

        return (
          <Box key={item.key}>
            {selected ? (
              <Text color="#5948e7" bold>{prefix}{item.label.padEnd(labelWidth)}</Text>
            ) : (
              <Text dimColor>{prefix}{item.label.padEnd(labelWidth)}</Text>
            )}
            <Text dimColor={!selected}>{item.value}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
