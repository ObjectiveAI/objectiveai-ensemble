import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AudioField from "../AudioField";
import type { AudioInputSchema, AudioRichContentPart } from "../../types";
import {
  mockFileReader,
  mockFileReaderError,
  createTestAudio,
  createSampleAudioPart,
  SAMPLE_AUDIO_BASE64,
  cleanupMocks,
  waitForAsync,
} from "../../__tests__/test-utils";

describe("AudioField", () => {
  const mockSchema: AudioInputSchema = {
    type: "audio",
    description: "Upload an audio file",
  };

  const mockOnChange = vi.fn();
  const defaultProps = {
    schema: mockSchema,
    value: null,
    onChange: mockOnChange,
    path: "test.audio",
    errors: [],
    disabled: false,
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader(SAMPLE_AUDIO_BASE64);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe("Rendering - No Value", () => {
    it("renders upload button when no value", () => {
      render(<AudioField {...defaultProps} />);
      expect(screen.getByText("Upload audio")).toBeInTheDocument();
    });

    it("renders upload button with correct type", () => {
      render(<AudioField {...defaultProps} />);
      const button = screen.getByText("Upload audio").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("renders hidden file input with audio accept attribute", () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", "audio/*");
      expect(input).toHaveStyle({ display: "none" });
    });

    it("shows schema description when no error", () => {
      render(<AudioField {...defaultProps} />);
      expect(screen.getByText("Upload an audio file")).toBeInTheDocument();
    });

    it("shows error message when validation fails", () => {
      const propsWithError = {
        ...defaultProps,
        errors: { "test.audio": "Audio is required" },
      };
      render(<AudioField {...propsWithError} />);
      expect(screen.getByText("Audio is required")).toBeInTheDocument();
    });
  });

  describe("Rendering - With Value", () => {
    it("renders audio icon when value exists", () => {
      const sampleValue = createSampleAudioPart("mp3");
      render(<AudioField {...defaultProps} value={sampleValue} />);
      expect(screen.getByText("Audio (MP3)")).toBeInTheDocument();
    });

    it("shows MP3 format in uppercase", () => {
      const mp3Value = createSampleAudioPart("mp3");
      render(<AudioField {...defaultProps} value={mp3Value} />);
      expect(screen.getByText("Audio (MP3)")).toBeInTheDocument();
    });

    it("shows WAV format in uppercase", () => {
      const wavValue = createSampleAudioPart("wav");
      render(<AudioField {...defaultProps} value={wavValue} />);
      expect(screen.getByText("Audio (WAV)")).toBeInTheDocument();
    });

    it("renders remove button", () => {
      const sampleValue = createSampleAudioPart("mp3");
      render(<AudioField {...defaultProps} value={sampleValue} />);
      const removeButton = screen.getByLabelText("Remove audio");
      expect(removeButton).toBeInTheDocument();
    });

    it("does not render upload button when value exists", () => {
      const sampleValue = createSampleAudioPart("mp3");
      render(<AudioField {...defaultProps} value={sampleValue} />);
      expect(screen.queryByText("Upload audio")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables upload button when disabled prop is true", () => {
      render(<AudioField {...defaultProps} disabled={true} />);
      const button = screen.getByText("Upload audio");
      expect(button).toBeDisabled();
    });

    it("disables file input when disabled", () => {
      const { container } = render(<AudioField {...defaultProps} disabled={true} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it("disables remove button when disabled and value exists", () => {
      render(<AudioField {...defaultProps} value={createSampleAudioPart("mp3")} disabled={true} />);
      const removeButton = screen.getByLabelText("Remove audio");
      expect(removeButton).toBeDisabled();
    });
  });

  describe("Format Detection", () => {
    it("detects MP3 format from audio/mpeg MIME type", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mp3File = createTestAudio({ format: "mp3" }); // audio/mpeg

      fireEvent.change(input, { target: { files: [mp3File] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio.format).toBe("mp3");
      });
    });

    it("detects WAV format from audio/wav MIME type", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const wavFile = createTestAudio({ format: "wav" }); // audio/wav

      fireEvent.change(input, { target: { files: [wavFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio.format).toBe("wav");
      });
    });

    it("defaults to WAV for OGG format", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const oggFile = createTestAudio({ format: "ogg" }); // audio/ogg

      fireEvent.change(input, { target: { files: [oggFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio.format).toBe("wav"); // Defaults to wav
      });
    });

    it("detects MP3 from audio/mp3 MIME type", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Create file with audio/mp3 type
      const content = new Array(1024).fill("x").join("");
      const blob = new Blob([content], { type: "audio/mp3" });
      const mp3File = new File([blob], "test.mp3", { type: "audio/mp3" });

      fireEvent.change(input, { target: { files: [mp3File] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio.format).toBe("mp3");
      });
    });

    it("format detection is case-insensitive", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Create file with uppercase MIME type
      const content = new Array(1024).fill("x").join("");
      const blob = new Blob([content], { type: "audio/MPEG" });
      const file = new File([blob], "test.MP3", { type: "audio/MPEG" });

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio.format).toBe("mp3");
      });
    });
  });

  describe("File Selection", () => {
    it("opens file input when upload button is clicked", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const button = screen.getByText("Upload audio");
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(input, "click");
      await userEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("calls onChange with correct RichContentPart when file is selected", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio({ format: "mp3" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          type: "input_audio",
          input_audio: {
            data: SAMPLE_AUDIO_BASE64,
            format: "mp3",
          },
        });
      });
    });

    it("handles multiple rapid file selections", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createTestAudio({ name: "test1.mp3" });
      const file2 = createTestAudio({ name: "test2.wav", format: "wav" });

      fireEvent.change(input, { target: { files: [file1] } });
      fireEvent.change(input, { target: { files: [file2] } });

      await waitForAsync(10);

      await waitFor(() => {
        // Should be called twice
        expect(mockOnChange).toHaveBeenCalledTimes(2);
      });
    });

    it("does not call onChange when no file is selected", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [] } });
      await waitForAsync(10);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("File Read Errors", () => {
    it("does not call onChange when FileReader fails", async () => {
      mockFileReaderError("File read failed");

      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("handles corrupted audio file gracefully", async () => {
      mockFileReaderError("Invalid audio format");

      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio({ name: "corrupted.mp3" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      // Should not crash, just silently fail
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Remove Functionality", () => {
    const sampleValue = createSampleAudioPart("mp3");

    it("calls onChange with null when remove button is clicked", async () => {
      render(<AudioField {...defaultProps} value={sampleValue} />);
      const removeButton = screen.getByLabelText("Remove audio");

      await userEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("clears file input value when removing", async () => {
      const { container } = render(<AudioField {...defaultProps} value={sampleValue} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      input.value = "test.mp3"; // Simulate file selection

      const removeButton = screen.getByLabelText("Remove audio");
      await userEvent.click(removeButton);

      expect(input.value).toBe("");
    });

    it("allows re-upload after remove", async () => {
      const { container, rerender } = render(<AudioField {...defaultProps} value={sampleValue} />);

      // Remove
      const removeButton = screen.getByLabelText("Remove audio");
      await userEvent.click(removeButton);

      // Rerender with null value
      rerender(<AudioField {...defaultProps} value={null} />);

      // Upload button should be visible again
      expect(screen.getByText("Upload audio")).toBeInTheDocument();

      // Select new file
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const newFile = createTestAudio({ name: "new.mp3" });
      fireEvent.change(input, { target: { files: [newFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        // onChange called once for remove, once for new upload
        expect(mockOnChange).toHaveBeenCalledTimes(2);
        expect(mockOnChange).toHaveBeenLastCalledWith({
          type: "input_audio",
          input_audio: {
            data: expect.any(String),
            format: "mp3",
          },
        });
      });
    });
  });

  describe("Large Files", () => {
    it("handles 5MB audio file", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createTestAudio({ sizeKB: 5000 }); // 5MB

      fireEvent.change(input, { target: { files: [largeFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("handles 10MB audio file", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const veryLargeFile = createTestAudio({ sizeKB: 10000 }); // 10MB

      fireEvent.change(input, { target: { files: [veryLargeFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible remove button label", () => {
      render(<AudioField {...defaultProps} value={createSampleAudioPart("mp3")} />);
      expect(screen.getByLabelText("Remove audio")).toBeInTheDocument();
    });

    it("upload button has correct type attribute", () => {
      render(<AudioField {...defaultProps} />);
      const button = screen.getByText("Upload audio").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("remove button has correct type attribute", () => {
      render(<AudioField {...defaultProps} value={createSampleAudioPart("mp3")} />);
      const button = screen.getByLabelText("Remove audio");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("RichContentPart Structure", () => {
    it("creates correct AudioRichContentPart structure", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio({ format: "mp3" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call).toEqual({
          type: "input_audio",
          input_audio: {
            data: expect.any(String),
            format: "mp3",
          },
        });
      });
    });

    it("has correct type field", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.type).toBe("input_audio");
      });
    });

    it("has input_audio object with data and format properties", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        expect(call.input_audio).toBeDefined();
        expect(call.input_audio.data).toBeDefined();
        expect(typeof call.input_audio.data).toBe("string");
        expect(call.input_audio.format).toBeDefined();
        expect(["mp3", "wav"]).toContain(call.input_audio.format);
      });
    });

    it("base64 data does not include data URL prefix", async () => {
      const { container } = render(<AudioField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestAudio();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as AudioRichContentPart;
        // Should not start with "data:"
        expect(call.input_audio.data).not.toMatch(/^data:/);
      });
    });
  });

  describe("Format Display", () => {
    it("displays format in uppercase in the UI", () => {
      const mp3Value = createSampleAudioPart("mp3");
      render(<AudioField {...defaultProps} value={mp3Value} />);

      // Format should be uppercase in display
      expect(screen.getByText("Audio (MP3)")).toBeInTheDocument();
    });

    it("changes display when format changes", () => {
      const { rerender } = render(<AudioField {...defaultProps} value={createSampleAudioPart("mp3")} />);
      expect(screen.getByText("Audio (MP3)")).toBeInTheDocument();

      rerender(<AudioField {...defaultProps} value={createSampleAudioPart("wav")} />);
      expect(screen.getByText("Audio (WAV)")).toBeInTheDocument();
      expect(screen.queryByText("Audio (MP3)")).not.toBeInTheDocument();
    });
  });
});
