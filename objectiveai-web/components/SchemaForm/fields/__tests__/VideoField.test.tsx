import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VideoField from "../VideoField";
import type { VideoInputSchema, VideoRichContentPart } from "../../types";
import {
  mockFileReader,
  createTestVideo,
  createSampleVideoPart,
  SAMPLE_VIDEO_BASE64,
  cleanupMocks,
  waitForAsync,
} from "../../__tests__/test-utils";

describe("VideoField", () => {
  const mockSchema: VideoInputSchema = {
    type: "video",
    description: "Upload a video",
  };

  const mockOnChange = vi.fn();
  const defaultProps = {
    schema: mockSchema,
    value: null,
    onChange: mockOnChange,
    path: "test.video",
    errors: [],
    disabled: false,
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader(SAMPLE_VIDEO_BASE64);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe("Rendering - No Value", () => {
    it("renders upload button when no value", () => {
      render(<VideoField {...defaultProps} />);
      expect(screen.getByText("Upload video")).toBeInTheDocument();
    });

    it("renders hidden file input with video accept attribute", () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute("accept", "video/*");
    });

    it("shows schema description", () => {
      render(<VideoField {...defaultProps} />);
      expect(screen.getByText("Upload a video")).toBeInTheDocument();
    });
  });

  describe("Rendering - With Value", () => {
    it("shows 'Video uploaded' text", () => {
      render(<VideoField {...defaultProps} value={createSampleVideoPart()} />);
      expect(screen.getByText("Video uploaded")).toBeInTheDocument();
    });

    it("renders remove button", () => {
      render(<VideoField {...defaultProps} value={createSampleVideoPart()} />);
      expect(screen.getByLabelText("Remove video")).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("calls onChange with correct RichContentPart", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestVideo({ type: "video/mp4" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          type: "video_url",
          video_url: {
            url: `data:video/mp4;base64,${SAMPLE_VIDEO_BASE64}`,
          },
        });
      });
    });

    it("preserves MIME type for MP4", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mp4File = createTestVideo({ type: "video/mp4" });

      fireEvent.change(input, { target: { files: [mp4File] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as VideoRichContentPart;
        expect(call.video_url.url).toContain("video/mp4");
      });
    });

    it("preserves MIME type for WEBM", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const webmFile = createTestVideo({ type: "video/webm" });

      fireEvent.change(input, { target: { files: [webmFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as VideoRichContentPart;
        expect(call.video_url.url).toContain("video/webm");
      });
    });

    it("preserves MIME type for MOV", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const movFile = createTestVideo({ type: "video/quicktime" });

      fireEvent.change(input, { target: { files: [movFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as VideoRichContentPart;
        expect(call.video_url.url).toContain("video/quicktime");
      });
    });
  });

  describe("Remove Functionality", () => {
    it("calls onChange with null when remove button is clicked", async () => {
      render(<VideoField {...defaultProps} value={createSampleVideoPart()} />);
      const removeButton = screen.getByLabelText("Remove video");

      await userEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("clears file input value", async () => {
      const { container } = render(<VideoField {...defaultProps} value={createSampleVideoPart()} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      input.value = "test.mp4";

      const removeButton = screen.getByLabelText("Remove video");
      await userEvent.click(removeButton);

      expect(input.value).toBe("");
    });
  });

  describe("Large Files", () => {
    it("handles 20MB video file", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createTestVideo({ sizeKB: 20000 }); // 20MB

      fireEvent.change(input, { target: { files: [largeFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe("RichContentPart Structure", () => {
    it("creates correct VideoRichContentPart structure", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestVideo();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as VideoRichContentPart;
        expect(call).toEqual({
          type: "video_url",
          video_url: {
            url: expect.stringMatching(/^data:video\/mp4;base64,/),
          },
        });
      });
    });

    it("has correct type field", async () => {
      const { container } = render(<VideoField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestVideo();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as VideoRichContentPart;
        expect(call.type).toBe("video_url");
      });
    });
  });
});
