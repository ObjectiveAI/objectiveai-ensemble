import { useState, useCallback } from "react";

interface TextInputState {
  text: string;
  cursor: number;
}

interface TextInputActions {
  /** Handle a keypress. Returns true if the key was consumed (typing, backspace, arrows). */
  handleKey: (ch: string, key: { backspace?: boolean; delete?: boolean; leftArrow?: boolean; rightArrow?: boolean; ctrl?: boolean; meta?: boolean }) => boolean;
  /** Reset to empty. */
  clear: () => void;
  /** Set text and place cursor at the end. */
  set: (text: string) => void;
}

export function useTextInput(): [TextInputState, TextInputActions] {
  const [state, setState] = useState<TextInputState>({ text: "", cursor: 0 });

  const handleKey = useCallback(
    (
      ch: string,
      key: {
        backspace?: boolean;
        delete?: boolean;
        leftArrow?: boolean;
        rightArrow?: boolean;
        ctrl?: boolean;
        meta?: boolean;
      },
    ): boolean => {
      if (key.backspace || key.delete) {
        setState((prev) => {
          if (prev.cursor <= 0) return prev;
          return {
            text: prev.text.slice(0, prev.cursor - 1) + prev.text.slice(prev.cursor),
            cursor: prev.cursor - 1,
          };
        });
        return true;
      }

      if (key.leftArrow) {
        setState((prev) => ({ ...prev, cursor: Math.max(0, prev.cursor - 1) }));
        return true;
      }

      if (key.rightArrow) {
        setState((prev) => ({
          ...prev,
          cursor: Math.min(prev.text.length, prev.cursor + 1),
        }));
        return true;
      }

      if (ch && !key.ctrl && !key.meta) {
        setState((prev) => ({
          text: prev.text.slice(0, prev.cursor) + ch + prev.text.slice(prev.cursor),
          cursor: prev.cursor + 1,
        }));
        return true;
      }

      return false;
    },
    [],
  );

  const clear = useCallback(() => setState({ text: "", cursor: 0 }), []);
  const set = useCallback(
    (text: string) => setState({ text, cursor: text.length }),
    [],
  );

  return [state, { handleKey, clear, set }];
}
