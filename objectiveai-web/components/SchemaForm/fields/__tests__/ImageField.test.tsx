import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageField from "../ImageField";
import type { ImageInputSchema, ImageRichContentPart } from "../../types";
import {
  mockFileReader,
  mockFileReaderError,
  createTestImage,
  createSampleImagePart,
  SAMPLE_IMAGE_BASE64,
  cleanupMocks,
  waitForAsync,
} from "../../__tests__/test-utils";

describe("ImageField", () => {
  const mockSchema: ImageInputSchema = {
    type: "image",
    description: "Upload an image",
  };

  const mockOnChange = vi.fn();
  const defaultProps = {
    schema: mockSchema,
    value: null,
    onChange: mockOnChange,
    path: "test.image",
    errors: [],
    disabled: false,
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader(SAMPLE_IMAGE_BASE64);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe("Rendering - No Value", () => {
    it("renders upload button when no value", () => {
      render(<ImageField {...defaultProps} />);
      expect(screen.getByText("Upload image")).toBeInTheDocument();
    });

    it("renders upload button with correct type", () => {
      render(<ImageField {...defaultProps} />);
      const button = screen.getByText("Upload image").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("renders hidden file input with image accept attribute", () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", "image/*");
      expect(input).toHaveStyle({ display: "none" });
    });

    it("shows schema description when no error", () => {
      render(<ImageField {...defaultProps} />);
      expect(screen.getByText("Upload an image")).toBeInTheDocument();
    });

    it("does not show description when there is an error", () => {
      const propsWithError = {
        ...defaultProps,
        errors: [{ path: "test.image", message: "Image is required" }],
      };
      render(<ImageField {...propsWithError} />);
      expect(screen.queryByText("Upload an image")).not.toBeInTheDocument();
    });

    it("shows error message when validation fails", () => {
      const propsWithError = {
        ...defaultProps,
        errors: [{ path: "test.image", message: "Image is required" }],
      };
      render(<ImageField {...propsWithError} />);
      expect(screen.getByText("Image is required")).toBeInTheDocument();
    });

    it("applies error styling when there is an error", () => {
      const propsWithError = {
        ...defaultProps,
        errors: [{ path: "test.image", message: "Image is required" }],
      };
      const { container } = render(<ImageField {...propsWithError} />);
      const button = screen.getByText("Upload image").closest("button");
      expect(button).toHaveStyle({ borderColor: expect.stringContaining("error") });
    });
  });

  describe("Rendering - With Value", () => {
    const sampleValue = createSampleImagePart();

    it("renders image thumbnail when value exists", () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      const img = screen.getByAltText("Uploaded");
      expect(img).toBeInTheDocument();
    });

    it("renders image with correct src", () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      const img = screen.getByAltText("Uploaded") as HTMLImageElement;
      expect(img).toHaveAttribute("src", expect.stringContaining(sampleValue.image_url.url));
    });

    it("shows 'Image uploaded' text", () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      expect(screen.getByText("Image uploaded")).toBeInTheDocument();
    });

    it("renders remove button", () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      const removeButton = screen.getByLabelText("Remove image");
      expect(removeButton).toBeInTheDocument();
    });

    it("does not render upload button when value exists", () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      expect(screen.queryByText("Upload image")).not.toBeInTheDocument();
    });

    it("renders smaller thumbnail on mobile", () => {
      render(<ImageField {...defaultProps} value={sampleValue} isMobile={true} />);
      const img = screen.getByAltText("Uploaded");
      expect(img).toHaveStyle({ width: "60px", height: "60px" });
    });

    it("renders larger thumbnail on desktop", () => {
      render(<ImageField {...defaultProps} value={sampleValue} isMobile={false} />);
      const img = screen.getByAltText("Uploaded");
      expect(img).toHaveStyle({ width: "80px", height: "80px" });
    });
  });

  describe("Disabled State", () => {
    it("disables upload button when disabled prop is true", () => {
      render(<ImageField {...defaultProps} disabled={true} />);
      const button = screen.getByText("Upload image").closest("button");
      expect(button).toBeDisabled();
    });

    it("disables file input when disabled", () => {
      const { container } = render(<ImageField {...defaultProps} disabled={true} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it("disables remove button when disabled and value exists", () => {
      render(<ImageField {...defaultProps} value={createSampleImagePart()} disabled={true} />);
      const removeButton = screen.getByLabelText("Remove image");
      expect(removeButton).toBeDisabled();
    });

    it("shows not-allowed cursor when disabled", () => {
      render(<ImageField {...defaultProps} disabled={true} />);
      const button = screen.getByText("Upload image").closest("button");
      expect(button).toHaveStyle({ cursor: "not-allowed" });
    });
  });

  describe("File Selection", () => {
    it("opens file input when upload button is clicked", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const button = screen.getByText("Upload image");
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(input, "click");
      await userEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("calls onChange with correct RichContentPart when file is selected", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage({ name: "test.jpg", type: "image/jpeg" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10); // Wait for FileReader mock

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${SAMPLE_IMAGE_BASE64}`,
          },
        });
      });
    });

    it("preserves MIME type in data URL", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage({ type: "image/png" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url.url).toContain("data:image/png;base64,");
      });
    });

    it("handles multiple rapid file selections", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createTestImage({ name: "test1.jpg" });
      const file2 = createTestImage({ name: "test2.jpg" });

      fireEvent.change(input, { target: { files: [file1] } });
      fireEvent.change(input, { target: { files: [file2] } });

      await waitForAsync(20);

      await waitFor(() => {
        // Should be called at least once (race condition may affect count)
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("does not call onChange when no file is selected", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [] } });
      await waitForAsync(10);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("File Read Errors", () => {
    it("does not call onChange when FileReader fails", async () => {
      mockFileReaderError("File read failed");

      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("handles corrupted file gracefully", async () => {
      mockFileReaderError("Invalid file format");

      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage({ name: "corrupted.jpg" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      // Should not crash, just silently fail
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Remove Functionality", () => {
    const sampleValue = createSampleImagePart();

    it("calls onChange with null when remove button is clicked", async () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);
      const removeButton = screen.getByLabelText("Remove image");

      await userEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("removes image display when clicking remove", async () => {
      render(<ImageField {...defaultProps} value={sampleValue} />);

      // Image should be displayed
      expect(screen.getByText("Image uploaded")).toBeInTheDocument();

      const removeButton = screen.getByLabelText("Remove image");
      await userEvent.click(removeButton);

      // Should call onChange with null to remove
      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("allows re-upload after remove", async () => {
      const { container, rerender } = render(<ImageField {...defaultProps} value={sampleValue} />);

      // Remove
      const removeButton = screen.getByLabelText("Remove image");
      await userEvent.click(removeButton);

      // Rerender with null value
      rerender(<ImageField {...defaultProps} value={null} />);

      // Upload button should be visible again
      expect(screen.getByText("Upload image")).toBeInTheDocument();

      // Select new file
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const newFile = createTestImage({ name: "new.jpg" });
      fireEvent.change(input, { target: { files: [newFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        // onChange called once for remove, once for new upload
        expect(mockOnChange).toHaveBeenCalledTimes(2);
        expect(mockOnChange).toHaveBeenLastCalledWith({
          type: "image_url",
          image_url: {
            url: expect.stringContaining("base64"),
          },
        });
      });
    });
  });

  describe("Large Files", () => {
    it("handles 5MB image file", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createTestImage({ sizeKB: 5000 }); // 5MB

      fireEvent.change(input, { target: { files: [largeFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("handles 10MB image file", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const veryLargeFile = createTestImage({ sizeKB: 10000 }); // 10MB

      fireEvent.change(input, { target: { files: [veryLargeFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe("Different Image Types", () => {
    it("handles JPEG images", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const jpegFile = createTestImage({ type: "image/jpeg" });

      fireEvent.change(input, { target: { files: [jpegFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url.url).toContain("image/jpeg");
      });
    });

    it("handles PNG images", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const pngFile = createTestImage({ type: "image/png" });

      fireEvent.change(input, { target: { files: [pngFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url.url).toContain("image/png");
      });
    });

    it("handles WEBP images", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const webpFile = createTestImage({ type: "image/webp" });

      fireEvent.change(input, { target: { files: [webpFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url.url).toContain("image/webp");
      });
    });

    it("handles GIF images", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const gifFile = createTestImage({ type: "image/gif" });

      fireEvent.change(input, { target: { files: [gifFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url.url).toContain("image/gif");
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible remove button label", () => {
      render(<ImageField {...defaultProps} value={createSampleImagePart()} />);
      expect(screen.getByLabelText("Remove image")).toBeInTheDocument();
    });

    it("upload button has correct type attribute", () => {
      render(<ImageField {...defaultProps} />);
      const button = screen.getByText("Upload image").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("remove button has correct type attribute", () => {
      render(<ImageField {...defaultProps} value={createSampleImagePart()} />);
      const button = screen.getByLabelText("Remove image");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("RichContentPart Structure", () => {
    it("creates correct ImageRichContentPart structure", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage({ type: "image/jpeg" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call).toEqual({
          type: "image_url",
          image_url: {
            url: expect.stringMatching(/^data:image\/jpeg;base64,/),
          },
        });
      });
    });

    it("has correct type field", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.type).toBe("image_url");
      });
    });

    it("has image_url object with url property", async () => {
      const { container } = render(<ImageField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestImage();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as ImageRichContentPart;
        expect(call.image_url).toBeDefined();
        expect(call.image_url.url).toBeDefined();
        expect(typeof call.image_url.url).toBe("string");
      });
    });
  });
});
