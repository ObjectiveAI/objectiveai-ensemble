import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageField from "../fields/ImageField";
import AudioField from "../fields/AudioField";
import VideoField from "../fields/VideoField";
import FileField from "../fields/FileField";
import type {
  ImageInputSchema,
  AudioInputSchema,
  VideoInputSchema,
  FileInputSchema,
} from "../types";
import {
  mockFileReader,
  mockFileReaderError,
  createTestImage,
  createTestAudio,
  cleanupMocks,
  waitForAsync,
  SAMPLE_IMAGE_BASE64,
} from "./test-utils";

describe("Edge Cases - Media Upload", () => {
  afterEach(() => {
    cleanupMocks();
  });

  describe("Browser Compatibility", () => {
    it("handles missing FileReader gracefully", async () => {
      // Save original FileReader
      const originalFileReader = global.FileReader;

      // Remove FileReader
      // @ts-expect-error - Testing missing API
      global.FileReader = undefined;

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      // Try to upload - should not crash
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage();

      expect(() => {
        fireEvent.change(input, { target: { files: [testFile] } });
      }).not.toThrow();

      // Restore
      global.FileReader = originalFileReader;
    });

    it("handles URL.createObjectURL not available", () => {
      // This is more about ensuring we don't use it for base64 conversion
      const originalCreateObjectURL = global.URL.createObjectURL;

      // @ts-expect-error - Testing missing API
      global.URL.createObjectURL = undefined;

      const mockOnChange = vi.fn();

      // Should still render without crashing
      expect(() => {
        render(
          <ImageField
            schema={{ type: "image" } as ImageInputSchema}
            value={null}
            onChange={mockOnChange}
            path="test"
            errors={{}}
            disabled={false}
            isMobile={false}
          />
        );
      }).not.toThrow();

      // Restore
      global.URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe("Race Conditions", () => {
    it("handles rapid file selection changes", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Rapidly change files
      const file1 = createTestImage({ name: "file1.jpg" });
      const file2 = createTestImage({ name: "file2.jpg" });
      const file3 = createTestImage({ name: "file3.jpg" });

      fireEvent.change(input, { target: { files: [file1] } });
      fireEvent.change(input, { target: { files: [file2] } });
      fireEvent.change(input, { target: { files: [file3] } });

      await waitForAsync(20);

      // Should call onChange for each file
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        // All calls should complete without errors
        expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
      });
    });

    it("handles remove then immediate re-upload", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const initialValue = {
        type: "image_url" as const,
        image_url: { url: "data:image/jpeg;base64,test" },
      };

      const { container, rerender } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={initialValue}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      // Remove
      const removeButton = screen.getByLabelText("Remove image");
      fireEvent.click(removeButton);

      // Rerender with null
      rerender(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      // Immediately upload new file
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const newFile = createTestImage({ name: "new.jpg" });
      fireEvent.change(input, { target: { files: [newFile] } });

      await waitForAsync(10);

      await waitFor(() => {
        // Should have called onChange for both remove and upload
        expect(mockOnChange).toHaveBeenCalledWith(null);
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ type: "image_url" })
        );
      });
    });

    it("handles multiple onChange calls in quick succession", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      let callCount = 0;
      const mockOnChange = vi.fn().mockImplementation(() => {
        callCount++;
      });

      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Trigger multiple changes rapidly
      for (let i = 0; i < 5; i++) {
        const file = createTestImage({ name: `file${i}.jpg` });
        fireEvent.change(input, { target: { files: [file] } });
      }

      await waitForAsync(20);

      // All onChange calls should complete
      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe("Memory and Performance", () => {
    it("handles very large base64 string", async () => {
      // Create a large base64 string (simulate 5MB file)
      const largeBase64 = "A".repeat(5 * 1024 * 1024);
      mockFileReader(largeBase64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createTestImage({ sizeKB: 5000 });

      fireEvent.change(input, { target: { files: [largeFile] } });
      await waitForAsync(20);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const call = mockOnChange.mock.calls[0][0];
        expect(call.type).toBe("image_url");
        // Base64 should be in the URL
        expect(call.image_url.url).toContain("base64");
      });
    });

    it("handles multiple large files in sequence", async () => {
      const largeBase64 = "A".repeat(1024 * 1024); // 1MB
      mockFileReader(largeBase64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload 5 large files in sequence
      for (let i = 0; i < 5; i++) {
        const file = createTestImage({ name: `large${i}.jpg`, sizeKB: 1000 });
        fireEvent.change(input, { target: { files: [file] } });
        await waitForAsync(5);
      }

      // All should complete without memory issues
      expect(mockOnChange.mock.calls.length).toBe(5);
    });
  });

  describe("Validation Edge Cases", () => {
    it("handles empty base64 string", () => {
      mockFileReader(""); // Empty base64

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createTestImage();

      expect(() => {
        fireEvent.change(input, { target: { files: [file] } });
      }).not.toThrow();
    });

    it("handles malformed MIME type", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <AudioField
          schema={{ type: "audio" } as AudioInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      // Create file with malformed MIME type
      const blob = new Blob(["test"], { type: "audio/weird-format-123" });
      const file = new File([blob], "test.audio", { type: "audio/weird-format-123" });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      // Should default to 'wav' for unknown audio formats
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const call = mockOnChange.mock.calls[0][0];
        expect(call.input_audio.format).toBe("wav");
      });
    });

    it("handles RichContentPart with missing type field", () => {
      const invalidValue = {
        // Missing 'type' field
        image_url: { url: "data:image/jpeg;base64,test" },
      };

      const mockOnChange = vi.fn();

      // Should render without crashing even with invalid structure
      expect(() => {
        render(
          <ImageField
            schema={{ type: "image" } as ImageInputSchema}
            // @ts-expect-error - Testing invalid structure
            value={invalidValue}
            onChange={mockOnChange}
            path="test"
            errors={{}}
            disabled={false}
            isMobile={false}
          />
        );
      }).not.toThrow();
    });

    it("handles RichContentPart with wrong type value", () => {
      const wrongTypeValue = {
        type: "video_url", // Wrong type for ImageField
        video_url: { url: "data:video/mp4;base64,test" },
      };

      const mockOnChange = vi.fn();

      // Should render without crashing
      expect(() => {
        render(
          <ImageField
            schema={{ type: "image" } as ImageInputSchema}
            // @ts-expect-error - Testing mismatched type
            value={wrongTypeValue}
            onChange={mockOnChange}
            path="test"
            errors={{}}
            disabled={false}
            isMobile={false}
          />
        );
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("continues to work after FileReader error", async () => {
      mockFileReaderError("First read failed");

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = createTestImage({ name: "fail.jpg" });

      fireEvent.change(input, { target: { files: [file1] } });
      await waitForAsync(10);

      // Should not call onChange due to error
      expect(mockOnChange).not.toHaveBeenCalled();

      // Now fix the FileReader and try again
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const file2 = createTestImage({ name: "success.jpg" });
      fireEvent.change(input, { target: { files: [file2] } });
      await waitForAsync(10);

      // Should work now
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("handles FileReader that never calls callback", async () => {
      // Create a FileReader mock that never calls onload or onerror
      const silentMockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
        result: null,
      };

      global.FileReader = vi.fn(() => silentMockReader) as unknown as typeof FileReader;

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createTestImage();

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(50); // Wait longer

      // onChange should not be called (FileReader never resolved)
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("File Input Edge Cases", () => {
    it("handles file input with files array being null", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Trigger change with null files
      fireEvent.change(input, { target: { files: null } });
      await waitForAsync(10);

      // Should not call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("handles file input with empty files array", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <ImageField
          schema={{ type: "image" } as ImageInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Trigger change with empty array
      fireEvent.change(input, { target: { files: [] } });
      await waitForAsync(10);

      // Should not call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("handles file input ref becoming null", () => {
      const mockOnChange = vi.fn();

      const { rerender } = render(
        <VideoField
          schema={{ type: "video" } as VideoInputSchema}
          value={{ type: "video_url", video_url: { url: "test" } }}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      // Click remove - should handle null ref gracefully
      const removeButton = screen.getByLabelText("Remove video");

      expect(() => {
        fireEvent.click(removeButton);
      }).not.toThrow();

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Special Characters and Encoding", () => {
    it("handles filename with unicode characters", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <FileField
          schema={{ type: "file" } as FileInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const file = new File(["content"], "文档.pdf", { type: "application/pdf" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const call = mockOnChange.mock.calls[0][0];
        expect(call.file.filename).toBe("文档.pdf");
      });
    });

    it("handles filename with emoji", async () => {
      mockFileReader(SAMPLE_IMAGE_BASE64);

      const mockOnChange = vi.fn();
      const { container } = render(
        <FileField
          schema={{ type: "file" } as FileInputSchema}
          value={null}
          onChange={mockOnChange}
          path="test"
          errors={{}}
          disabled={false}
          isMobile={false}
        />
      );

      const file = new File(["content"], "🎉party.pdf", { type: "application/pdf" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const call = mockOnChange.mock.calls[0][0];
        expect(call.file.filename).toBe("🎉party.pdf");
      });
    });
  });
});
