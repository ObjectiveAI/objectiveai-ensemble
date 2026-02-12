import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SchemaFormBuilder from "../SchemaFormBuilder";
import type { ValidationError } from "../types";
import {
  imageSchema,
  audioSchema,
  videoSchema,
  fileSchema,
  multiMediaObjectSchema,
  requiredImageSchema,
  imageArraySchema,
  nestedMediaSchema,
  mixedSchema,
  optionalMediaSchema,
  productListingSchema,
} from "./fixtures/media-schemas";
import {
  mockFileReader,
  createTestImage,
  createSampleImagePart,
  createSampleAudioPart,
  createSampleFilePart,
  SAMPLE_IMAGE_BASE64,
  cleanupMocks,
  waitForAsync,
} from "./test-utils";

describe("SchemaFormBuilder - Media Integration", () => {
  beforeEach(() => {
    mockFileReader(SAMPLE_IMAGE_BASE64);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe("Single Media Fields", () => {
    it("renders ImageField for image schema", () => {
      const onChange = vi.fn();
      render(<SchemaFormBuilder schema={imageSchema} value={null} onChange={onChange} />);
      expect(screen.getByText("Upload image")).toBeInTheDocument();
    });

    it("renders AudioField for audio schema", () => {
      const onChange = vi.fn();
      render(<SchemaFormBuilder schema={audioSchema} value={null} onChange={onChange} />);
      expect(screen.getByText("Upload audio")).toBeInTheDocument();
    });

    it("renders VideoField for video schema", () => {
      const onChange = vi.fn();
      render(<SchemaFormBuilder schema={videoSchema} value={null} onChange={onChange} />);
      expect(screen.getByText("Upload video")).toBeInTheDocument();
    });

    it("renders FileField for file schema", () => {
      const onChange = vi.fn();
      render(<SchemaFormBuilder schema={fileSchema} value={null} onChange={onChange} />);
      expect(screen.getByText("Upload file")).toBeInTheDocument();
    });
  });

  describe("Multi-Media Object Schema", () => {
    it("renders all media fields", () => {
      const onChange = vi.fn();
      render(
        <SchemaFormBuilder
          schema={multiMediaObjectSchema}
          value={{}}
          onChange={onChange}
        />
      );

      expect(screen.getByText("Upload image")).toBeInTheDocument();
      expect(screen.getByText("Upload audio")).toBeInTheDocument();
      expect(screen.getByText("Upload video")).toBeInTheDocument();
      expect(screen.getByText("Upload file")).toBeInTheDocument();
    });

    it("renders text field alongside media fields", () => {
      const onChange = vi.fn();
      const { container } = render(
        <SchemaFormBuilder
          schema={multiMediaObjectSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Should have a text input for description
      const textInput = container.querySelector('input[type="text"]');
      expect(textInput).toBeInTheDocument();
    });

    it("uploads to correct field in object", async () => {
      const onChange = vi.fn();
      const { container } = render(
        <SchemaFormBuilder
          schema={multiMediaObjectSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Find image file input
      const fileInputs = container.querySelectorAll('input[type="file"]');
      const imageInput = Array.from(fileInputs).find(
        (input) => (input as HTMLInputElement).accept === "image/*"
      ) as HTMLInputElement;

      const testImage = createTestImage();
      fireEvent.change(imageInput, { target: { files: [testImage] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const call = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(call.image).toBeDefined();
        expect(call.image.type).toBe("image_url");
      });
    });
  });

  describe("Required Media Validation", () => {
    it("validates required image field", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      render(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={{}}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      // Should have validation error for missing required photo
      expect(onValidate).toHaveBeenCalled();
      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.path.includes("photo"))).toBe(true);
    });

    it("clears validation error after upload", async () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      const { container, rerender } = render(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={{}}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      // Initially has error
      let errors = onValidate.mock.calls[onValidate.mock.calls.length - 1][0] as ValidationError[];
      expect(errors.length).toBeGreaterThan(0);

      // Upload image
      const imageInput = container.querySelector('input[accept="image/*"]') as HTMLInputElement;
      const testImage = createTestImage();
      fireEvent.change(imageInput, { target: { files: [testImage] } });
      await waitForAsync(10);

      // Update value with uploaded image
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      const uploadedValue = {
        photo: createSampleImagePart(),
      };

      rerender(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={uploadedValue}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      // Should have no errors now
      errors = onValidate.mock.calls[onValidate.mock.calls.length - 1][0] as ValidationError[];
      expect(errors.length).toBe(0);
    });
  });

  describe("Array of Media", () => {
    it("renders array controls for image array", () => {
      const onChange = vi.fn();
      render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={[]}
          onChange={onChange}
        />
      );

      // Should have add item button
      expect(screen.getByText(/Add item/i)).toBeInTheDocument();
    });

    it("adds new image field to array", async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={[]}
          onChange={onChange}
        />
      );

      const addButton = screen.getByText(/Add item/i);
      await userEvent.click(addButton);

      expect(onChange).toHaveBeenCalledWith([null]);

      // Rerender with updated value
      rerender(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={[null]}
          onChange={onChange}
        />
      );

      // Should now have an upload button
      expect(screen.getByText("Upload image")).toBeInTheDocument();
    });

    it("allows multiple image uploads in array", async () => {
      const onChange = vi.fn();
      const value = [createSampleImagePart(), createSampleImagePart()];

      render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={value}
          onChange={onChange}
        />
      );

      // Should show multiple uploaded images
      const uploadedTexts = screen.getAllByText("Image uploaded");
      expect(uploadedTexts).toHaveLength(2);
    });

    it("validates minItems for image array", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={[]}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      // imageArraySchema has minItems: 1
      expect(errors.some((e) => e.message.includes("at least"))).toBe(true);
    });

    it("validates maxItems for image array", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      // imageArraySchema has maxItems: 5
      const tooManyImages = Array(6).fill(createSampleImagePart());

      render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={tooManyImages}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      expect(errors.some((e) => e.message.includes("at most"))).toBe(true);
    });

    it("removes item from array", async () => {
      const onChange = vi.fn();
      const value = [createSampleImagePart()];

      render(
        <SchemaFormBuilder
          schema={imageArraySchema}
          value={value}
          onChange={onChange}
        />
      );

      // Find remove button
      const removeButton = screen.getByLabelText(/Remove item/i);
      await userEvent.click(removeButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Nested Media Schema", () => {
    it("renders nested object with media fields", () => {
      const onChange = vi.fn();
      render(
        <SchemaFormBuilder
          schema={nestedMediaSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Should render fields for product.name, product.images, product.specs
      expect(screen.getByText(/Add item/i)).toBeInTheDocument(); // For images array
      expect(screen.getByText("Upload file")).toBeInTheDocument(); // For specs
    });

    it("handles upload in nested structure", async () => {
      const onChange = vi.fn();
      const initialValue = {
        product: {
          name: "Test Product",
          images: [null],
        },
      };

      const { container } = render(
        <SchemaFormBuilder
          schema={nestedMediaSchema}
          value={initialValue}
          onChange={onChange}
        />
      );

      // Upload image in nested array
      const imageInput = container.querySelector('input[accept="image/*"]') as HTMLInputElement;
      const testImage = createTestImage();
      fireEvent.change(imageInput, { target: { files: [testImage] } });
      await waitForAsync(10);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const call = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(call.product.images[0]).toBeDefined();
        expect(call.product.images[0].type).toBe("image_url");
      });
    });
  });

  describe("Mixed Schema (Media + Primitives)", () => {
    it("renders all field types correctly", () => {
      const onChange = vi.fn();
      const { container } = render(
        <SchemaFormBuilder
          schema={mixedSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Should have string input (title)
      expect(container.querySelector('input[type="text"]')).toBeInTheDocument();

      // Should have image upload (thumbnail)
      expect(screen.getByText("Upload image")).toBeInTheDocument();

      // Should have number input (priority)
      expect(container.querySelector('input[type="number"]')).toBeInTheDocument();

      // Should have checkbox (published)
      expect(container.querySelector('input[type="checkbox"]')).toBeInTheDocument();
    });

    it("validates mixed field types together", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      render(
        <SchemaFormBuilder
          schema={mixedSchema}
          value={{}}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      // Should have errors for required title and thumbnail
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.path.includes("title"))).toBe(true);
      expect(errors.some((e) => e.path.includes("thumbnail"))).toBe(true);
    });
  });

  describe("Optional Media Fields", () => {
    it("does not require optional media", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      const valueWithOnlyRequired = {
        name: "Test User",
      };

      render(
        <SchemaFormBuilder
          schema={optionalMediaSchema}
          value={valueWithOnlyRequired}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      // Should have no errors (avatar and voiceNote are optional)
      expect(errors.length).toBe(0);
    });

    it("accepts optional media when provided", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      const valueWithOptionalMedia = {
        name: "Test User",
        avatar: createSampleImagePart(),
        voiceNote: createSampleAudioPart("mp3"),
      };

      render(
        <SchemaFormBuilder
          schema={optionalMediaSchema}
          value={valueWithOptionalMedia}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      expect(errors.length).toBe(0);

      // Should display uploaded media
      expect(screen.getByText("Image uploaded")).toBeInTheDocument();
      expect(screen.getByText("Audio (MP3)")).toBeInTheDocument();
    });
  });

  describe("Real-World Scenario: Product Listing", () => {
    it("renders complete product listing form", () => {
      const onChange = vi.fn();
      const { container } = render(
        <SchemaFormBuilder
          schema={productListingSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Text inputs (title, description)
      const textInputs = container.querySelectorAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThanOrEqual(1);

      // Number input (price)
      expect(container.querySelector('input[type="number"]')).toBeInTheDocument();

      // Media uploads (mainImage, video, manual)
      expect(screen.getAllByText(/Upload/i).length).toBeGreaterThan(1);
    });

    it("validates complete product form", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      render(
        <SchemaFormBuilder
          schema={productListingSchema}
          value={{}}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      // Should require title, description, price, mainImage
      expect(errors.length).toBeGreaterThan(0);
    });

    it("accepts valid complete product", () => {
      const onChange = vi.fn();
      const onValidate = vi.fn();

      const validProduct = {
        title: "Laptop",
        description: "High-performance laptop",
        price: 999.99,
        mainImage: createSampleImagePart(),
        gallery: [createSampleImagePart(), createSampleImagePart()],
        manual: createSampleFilePart("manual.pdf"),
      };

      render(
        <SchemaFormBuilder
          schema={productListingSchema}
          value={validProduct}
          onChange={onChange}
          onValidate={onValidate}
        />
      );

      const errors = onValidate.mock.calls[0][0] as ValidationError[];
      expect(errors.length).toBe(0);
    });
  });

  describe("Error Display", () => {
    it("shows error message for required image field", () => {
      const onChange = vi.fn();

      render(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Should show error for required photo field
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    it("clears error after providing value", async () => {
      const onChange = vi.fn();

      const { rerender } = render(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={{}}
          onChange={onChange}
        />
      );

      // Has error initially
      expect(screen.getByText(/required/i)).toBeInTheDocument();

      // Provide value
      rerender(
        <SchemaFormBuilder
          schema={requiredImageSchema}
          value={{ photo: createSampleImagePart() }}
          onChange={onChange}
        />
      );

      // Error should be gone
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables all media fields when disabled", () => {
      const onChange = vi.fn();
      render(
        <SchemaFormBuilder
          schema={multiMediaObjectSchema}
          value={{}}
          onChange={onChange}
          disabled={true}
        />
      );

      const uploadButtons = screen.getAllByText(/Upload/i);
      uploadButtons.forEach((button) => {
        expect(button.closest("button")).toBeDisabled();
      });
    });
  });
});
