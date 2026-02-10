/**
 * Test utilities for SchemaForm components
 * Provides mocks for FileReader API and helpers for creating test files
 */

import { vi } from "vitest";
import type {
  ImageRichContentPart,
  AudioRichContentPart,
  VideoRichContentPart,
  FileRichContentPart,
} from "../types";

/**
 * Sample base64 data for testing (tiny 1x1 pixel images/files)
 */
export const SAMPLE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 red pixel PNG

export const SAMPLE_AUDIO_BASE64 =
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Minimal WAV header

export const SAMPLE_VIDEO_BASE64 = SAMPLE_IMAGE_BASE64; // Use same as image for simplicity

export const SAMPLE_PDF_BASE64 =
  "JVBERi0xLjAKJcOkw7zDtsOfCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdIC9Db250ZW50cyA1IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9UaW1lcy1Sb21hbiA+PgplbmRvYmoKNSAwIG9iago8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMTggVGYKMCAwIFRkCihIZWxsbykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago="; // Minimal PDF

/**
 * Mock FileReader for testing file uploads
 * Returns a successful read with the provided base64 result
 */
export function mockFileReader(base64Result: string = SAMPLE_IMAGE_BASE64) {
  const mockReader = {
    readAsDataURL: vi.fn(),
    onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
    onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
    result: null as string | null,
  };

  // When readAsDataURL is called, immediately trigger onload with result
  mockReader.readAsDataURL.mockImplementation((file: File) => {
    const dataUrl = `data:${file.type};base64,${base64Result}`;
    mockReader.result = dataUrl;

    // Simulate async file read
    setTimeout(() => {
      if (mockReader.onload) {
        mockReader.onload.call(mockReader as unknown as FileReader, {
          target: mockReader,
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  });

  // Mock the global FileReader
  global.FileReader = vi.fn(() => mockReader) as unknown as typeof FileReader;

  return mockReader;
}

/**
 * Mock FileReader that simulates a read error
 */
export function mockFileReaderError(errorMessage: string = "File read error") {
  const mockReader = {
    readAsDataURL: vi.fn(),
    onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
    onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
    result: null as string | null,
    error: new Error(errorMessage),
  };

  mockReader.readAsDataURL.mockImplementation(() => {
    setTimeout(() => {
      if (mockReader.onerror) {
        mockReader.onerror.call(mockReader as unknown as FileReader, {
          target: mockReader,
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  });

  global.FileReader = vi.fn(() => mockReader) as unknown as typeof FileReader;

  return mockReader;
}

/**
 * Create a test File object for image uploads
 */
export function createTestImage(options: {
  name?: string;
  type?: string;
  sizeKB?: number;
} = {}): File {
  const {
    name = "test-image.jpg",
    type = "image/jpeg",
    sizeKB = 10,
  } = options;

  // Create blob with approximate size
  const content = new Array(sizeKB * 1024).fill("x").join("");
  const blob = new Blob([content], { type });

  return new File([blob], name, { type });
}

/**
 * Create a test File object for audio uploads
 */
export function createTestAudio(options: {
  name?: string;
  format?: "mp3" | "wav" | "ogg";
  sizeKB?: number;
} = {}): File {
  const {
    name = "test-audio.mp3",
    format = "mp3",
    sizeKB = 50,
  } = options;

  const mimeTypes = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };

  const type = mimeTypes[format];
  const content = new Array(sizeKB * 1024).fill("x").join("");
  const blob = new Blob([content], { type });

  return new File([blob], name, { type });
}

/**
 * Create a test File object for video uploads
 */
export function createTestVideo(options: {
  name?: string;
  type?: string;
  sizeKB?: number;
} = {}): File {
  const {
    name = "test-video.mp4",
    type = "video/mp4",
    sizeKB = 100,
  } = options;

  const content = new Array(sizeKB * 1024).fill("x").join("");
  const blob = new Blob([content], { type });

  return new File([blob], name, { type });
}

/**
 * Create a test File object for generic file uploads
 */
export function createTestFile(options: {
  name?: string;
  type?: string;
  sizeKB?: number;
} = {}): File {
  const {
    name = "test-document.pdf",
    type = "application/pdf",
    sizeKB = 20,
  } = options;

  const content = new Array(sizeKB * 1024).fill("x").join("");
  const blob = new Blob([content], { type });

  return new File([blob], name, { type });
}

/**
 * Create sample RichContentPart objects for testing
 */
export function createSampleImagePart(
  url?: string
): ImageRichContentPart {
  return {
    type: "image_url",
    image_url: {
      url: url || `data:image/jpeg;base64,${SAMPLE_IMAGE_BASE64}`,
    },
  };
}

export function createSampleAudioPart(
  format: "mp3" | "wav" = "mp3",
  data?: string
): AudioRichContentPart {
  return {
    type: "input_audio",
    input_audio: {
      data: data || SAMPLE_AUDIO_BASE64,
      format,
    },
  };
}

export function createSampleVideoPart(
  url?: string
): VideoRichContentPart {
  return {
    type: "video_url",
    video_url: {
      url: url || `data:video/mp4;base64,${SAMPLE_VIDEO_BASE64}`,
    },
  };
}

export function createSampleFilePart(
  filename?: string,
  data?: string
): FileRichContentPart {
  return {
    type: "file",
    file: {
      file_data: data || SAMPLE_PDF_BASE64,
      filename: filename || "test-document.pdf",
    },
  };
}

/**
 * Simulate file input change event
 * Useful for triggering file uploads in tests
 */
export function createFileInputChangeEvent(file: File): Event {
  const event = new Event("change", { bubbles: true });
  Object.defineProperty(event, "target", {
    writable: false,
    value: {
      files: [file],
    },
  });
  return event;
}

/**
 * Wait for async operations to complete
 * Useful after triggering file uploads that use FileReader
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean up after tests that mock global objects
 */
export function cleanupMocks() {
  vi.restoreAllMocks();
}
