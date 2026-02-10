import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileField from "../FileField";
import type { FileInputSchema, FileRichContentPart } from "../../types";
import {
  mockFileReader,
  mockFileReaderError,
  createTestFile,
  createSampleFilePart,
  SAMPLE_PDF_BASE64,
  cleanupMocks,
  waitForAsync,
} from "../../__tests__/test-utils";

describe("FileField", () => {
  const mockSchema: FileInputSchema = {
    type: "file",
    description: "Upload a document",
  };

  const mockOnChange = vi.fn();
  const defaultProps = {
    schema: mockSchema,
    value: null,
    onChange: mockOnChange,
    path: "test.file",
    errors: [],
    disabled: false,
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader(SAMPLE_PDF_BASE64);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe("Rendering - No Value", () => {
    it("renders upload button when no value", () => {
      render(<FileField {...defaultProps} />);
      expect(screen.getByText("Upload file")).toBeInTheDocument();
    });

    it("renders file input without accept restriction", () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).not.toHaveAttribute("accept");
    });

    it("shows schema description", () => {
      render(<FileField {...defaultProps} />);
      expect(screen.getByText("Upload a document")).toBeInTheDocument();
    });
  });

  describe("Rendering - With Value", () => {
    it("displays filename", () => {
      render(<FileField {...defaultProps} value={createSampleFilePart("report.pdf")} />);
      expect(screen.getByText("report.pdf")).toBeInTheDocument();
    });

    it("displays fallback text when no filename", () => {
      const valueWithoutFilename = createSampleFilePart();
      delete valueWithoutFilename.file.filename;
      render(<FileField {...defaultProps} value={valueWithoutFilename} />);
      expect(screen.getByText("Uploaded file")).toBeInTheDocument();
    });

    it("renders remove button", () => {
      render(<FileField {...defaultProps} value={createSampleFilePart()} />);
      expect(screen.getByLabelText("Remove file")).toBeInTheDocument();
    });
  });

  describe("Filename Preservation", () => {
    it("preserves PDF filename", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = createTestFile({ name: "invoice-2024.pdf", type: "application/pdf" });

      fireEvent.change(input, { target: { files: [pdfFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("invoice-2024.pdf");
      });
    });

    it("preserves TXT filename", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const txtFile = createTestFile({ name: "notes.txt", type: "text/plain" });

      fireEvent.change(input, { target: { files: [txtFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("notes.txt");
      });
    });

    it("preserves ZIP filename", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const zipFile = createTestFile({ name: "archive.zip", type: "application/zip" });

      fireEvent.change(input, { target: { files: [zipFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("archive.zip");
      });
    });

    it("preserves filename with special characters", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createTestFile({ name: "my file (1).pdf" });

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("my file (1).pdf");
      });
    });

    it("preserves very long filename", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const longName = "a".repeat(100) + ".pdf";
      const file = createTestFile({ name: longName });

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe(longName);
      });
    });

    it("preserves filename with no extension", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createTestFile({ name: "README" });

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("README");
      });
    });

    it("preserves filename with multiple dots", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createTestFile({ name: "file.backup.tar.gz" });

      fireEvent.change(input, { target: { files: [file] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.file.filename).toBe("file.backup.tar.gz");
      });
    });
  });

  describe("File Selection", () => {
    it("calls onChange with correct RichContentPart", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestFile({ name: "test.pdf" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          type: "file",
          file: {
            file_data: SAMPLE_PDF_BASE64,
            filename: "test.pdf",
          },
        });
      });
    });

    it("handles different file types", async () => {
      const fileTypes = [
        { name: "doc.pdf", type: "application/pdf" },
        { name: "sheet.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "data.json", type: "application/json" },
        { name: "image.png", type: "image/png" }, // Any file type allowed
      ];

      for (const fileType of fileTypes) {
        const { container } = render(<FileField {...defaultProps} />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = createTestFile(fileType);

        mockOnChange.mockClear();
        fireEvent.change(input, { target: { files: [file] } });
        await waitForAsync(10);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalledWith({
            type: "file",
            file: {
              file_data: expect.any(String),
              filename: fileType.name,
            },
          });
        });
      }
    });
  });

  describe("Remove Functionality", () => {
    it("calls onChange with null when remove button is clicked", async () => {
      render(<FileField {...defaultProps} value={createSampleFilePart()} />);
      const removeButton = screen.getByLabelText("Remove file");

      await userEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("clears file input value", async () => {
      const { container } = render(<FileField {...defaultProps} value={createSampleFilePart()} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      input.value = "test.pdf";

      const removeButton = screen.getByLabelText("Remove file");
      await userEvent.click(removeButton);

      expect(input.value).toBe("");
    });
  });

  describe("File Read Errors", () => {
    it("does not call onChange when FileReader fails", async () => {
      mockFileReaderError("File read failed");

      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestFile();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("RichContentPart Structure", () => {
    it("creates correct FileRichContentPart structure", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestFile({ name: "report.pdf" });

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call).toEqual({
          type: "file",
          file: {
            file_data: expect.any(String),
            filename: "report.pdf",
          },
        });
      });
    });

    it("has correct type field", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestFile();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        expect(call.type).toBe("file");
      });
    });

    it("base64 data does not include data URL prefix", async () => {
      const { container } = render(<FileField {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = createTestFile();

      fireEvent.change(input, { target: { files: [testFile] } });
      await waitForAsync(10);

      await waitFor(() => {
        const call = mockOnChange.mock.calls[0][0] as FileRichContentPart;
        // Should not start with "data:"
        expect(call.file.file_data).not.toMatch(/^data:/);
      });
    });
  });

  describe("UI Display of Filename", () => {
    it("truncates very long filename with ellipsis", () => {
      const longFilename = "a".repeat(100) + ".pdf";
      const { container } = render(<FileField {...defaultProps} value={createSampleFilePart(longFilename)} />);

      const filenameSpan = container.querySelector('span[style*="text-overflow: ellipsis"]');
      expect(filenameSpan).toBeInTheDocument();
      expect(filenameSpan?.textContent).toBe(longFilename);
    });

    it("displays short filename without truncation", () => {
      render(<FileField {...defaultProps} value={createSampleFilePart("test.pdf")} />);
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });
});
