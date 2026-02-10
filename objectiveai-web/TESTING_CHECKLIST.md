# Rich Media Upload Testing Checklist

Manual QA checklist for testing rich media upload functionality before production deployment.

**Test Environment:**
- Local development server: `npm run dev`
- Test page: `/functions/[slug]` for functions with media input schemas
- Browser matrix: Chrome, Firefox, Safari (desktop), iOS Safari, Android Chrome

---

## Setup

1. [ ] Start local development server
2. [ ] Identify functions with media input schemas (use Functions.list() to find them)
3. [ ] Prepare test media files:
   - [ ] JPG image (< 1MB)
   - [ ] PNG image with transparency
   - [ ] WEBP image
   - [ ] Large image (10MB+)
   - [ ] MP3 audio file
   - [ ] WAV audio file
   - [ ] OGG audio file
   - [ ] Large audio file (5MB+)
   - [ ] MP4 video file
   - [ ] MOV video file
   - [ ] WEBM video file
   - [ ] Large video (20MB+)
   - [ ] PDF document
   - [ ] TXT file
   - [ ] ZIP archive
   - [ ] File with special characters in name (`my file (1).pdf`)
   - [ ] File with very long name (100+ chars)
   - [ ] File with unicode filename (`文档.pdf`)

---

## Image Upload Tests

### Basic Upload

- [ ] **Upload JPG image (< 1MB)**
  - Navigate to function with image input
  - Click "Upload image" button
  - Select JPG file
  - Verify thumbnail appears
  - Verify "Image uploaded" text displays
  - Verify remove button appears

- [ ] **Upload PNG image with transparency**
  - Same steps as above
  - Verify transparency is preserved in thumbnail

- [ ] **Upload WEBP image**
  - Verify WEBP format is accepted
  - Verify thumbnail renders correctly

### Large Files

- [ ] **Upload very large image (10MB+)**
  - Select large image file
  - Verify UI remains responsive during upload
  - Verify base64 conversion completes (may take 1-2 seconds)
  - Verify no console errors
  - Verify no browser memory warnings

### Invalid Cases

- [ ] **Upload non-image file to image field**
  - Try uploading a PDF to image field
  - Verify browser file picker only shows images (accept="image/*")

### Re-upload

- [ ] **Upload image, remove it, upload different image**
  - Upload first image
  - Click remove button (red X)
  - Verify image is cleared
  - Upload second image
  - Verify second image displays correctly
  - Verify no remnants of first image

### Execution

- [ ] **Execute function with uploaded image**
  - Upload image to input field
  - Fill other required fields
  - Click "Execute" button
  - Verify execution starts (loading spinner)
  - Verify results display correctly
  - Check browser Network tab: verify base64 data in request body

- [ ] **View execution results with image in completions**
  - After execution completes
  - Expand completion details
  - Verify image appears in LLM input/output (if applicable)

---

## Audio Upload Tests

### Format Detection

- [ ] **Upload MP3 audio file**
  - Upload MP3 file
  - Verify format detected as "Audio (MP3)" in UI

- [ ] **Upload WAV audio file**
  - Upload WAV file
  - Verify format detected as "Audio (WAV)"

- [ ] **Upload OGG audio file**
  - Upload OGG file
  - Verify format defaults to "Audio (WAV)" (OGG not explicitly supported)

### Large Files

- [ ] **Upload large audio file (5MB+)**
  - Verify upload completes without errors
  - Verify UI remains responsive

### Invalid Cases

- [ ] **Upload non-audio file to audio field**
  - Verify browser file picker only shows audio files (accept="audio/*")

### Execution

- [ ] **Execute function with uploaded audio**
  - Upload audio file
  - Fill other required fields
  - Execute function
  - Verify audio data sent correctly in API request

---

## Video Upload Tests

### Basic Upload

- [ ] **Upload MP4 video file**
  - Upload MP4 video
  - Verify "Video uploaded" text displays
  - Verify remove button works

- [ ] **Upload MOV video file**
  - Verify MOV format accepted
  - Verify upload completes

- [ ] **Upload WEBM video file**
  - Verify WEBM format accepted
  - Verify upload completes

### Large Files

- [ ] **Upload large video (20MB+)**
  - Select large video file
  - Verify base64 conversion completes (may take several seconds)
  - Verify no browser crash or memory issues
  - Check browser console for any warnings

### Invalid Cases

- [ ] **Upload non-video file to video field**
  - Verify browser file picker only shows videos (accept="video/*")

### Execution

- [ ] **Execute function with uploaded video**
  - Upload video file
  - Execute function
  - Verify video data sent in request

---

## File Upload Tests

### Filename Preservation

- [ ] **Upload PDF file**
  - Upload PDF named "report.pdf"
  - Verify filename displays as "report.pdf" in UI

- [ ] **Upload TXT file**
  - Upload "notes.txt"
  - Verify filename preserved

- [ ] **Upload ZIP file**
  - Upload "archive.zip"
  - Verify filename preserved

- [ ] **Upload file with special characters in name**
  - Upload `my file (1).pdf`
  - Verify special characters preserved in filename
  - Verify no encoding issues

- [ ] **Upload file with very long name (100+ chars)**
  - Upload file with 100+ character filename
  - Verify filename preserved
  - Verify UI truncates display with ellipsis (text-overflow: ellipsis)
  - Hover over filename to see full name (if tooltip implemented)

- [ ] **Upload file with no extension**
  - Upload file named "README" (no extension)
  - Verify filename preserved as "README"

- [ ] **Upload file with unicode filename**
  - Upload `文档.pdf` or similar unicode filename
  - Verify unicode characters preserved
  - Verify no encoding errors

### Execution

- [ ] **Execute function with uploaded file**
  - Upload PDF or other file
  - Execute function
  - Verify filename and file_data sent correctly in request

---

## Multi-Media Tests

### Object with Multiple Media Fields

- [ ] **Form with image + audio + text**
  - Find or create test function with multiple media inputs
  - Upload image to image field
  - Upload audio to audio field
  - Enter text in text field
  - Verify all fields work independently
  - Execute function
  - Verify all data sent correctly

### Array of Media

- [ ] **Array of images - add 3 images**
  - Find function with image array input
  - Click "Add item" button 3 times
  - Upload different image to each slot
  - Verify all 3 images display
  - Verify array indices correct

- [ ] **Array of images - remove middle one**
  - From above test
  - Click remove button on 2nd image
  - Verify correct image removed
  - Verify remaining images re-index correctly

### Validation

- [ ] **Required image field - submit without upload shows error**
  - Find function with required image field
  - Leave image field empty
  - Try to execute
  - Verify validation error displays ("Image is required" or similar)
  - Verify error styling (red border)

- [ ] **Optional video field - submit without upload works**
  - Find function with optional video field
  - Leave video field empty
  - Fill required fields
  - Execute function
  - Verify execution succeeds without video

### Nested Objects

- [ ] **Nested object with media**
  - Find function with nested media (e.g., `product.images[]`)
  - Upload media to nested field
  - Verify value structure correct (nested path preserved)
  - Execute function
  - Verify nested data sent correctly

---

## Mobile Tests

### iOS Safari

- [ ] **Image upload on iOS Safari**
  - Open site on iPhone/iPad
  - Navigate to function with image input
  - Tap "Upload image"
  - Verify iOS file picker appears
  - Select image from Photos
  - Verify upload completes
  - Verify thumbnail displays correctly

- [ ] **Camera capture on mobile**
  - On iOS device
  - Tap image upload button
  - Select "Take Photo" option (if available)
  - Capture photo with camera
  - Verify photo uploads correctly

### Android Chrome

- [ ] **Image upload on Android Chrome**
  - Open site on Android device
  - Navigate to function with image input
  - Tap "Upload image"
  - Select image from Gallery
  - Verify upload completes
  - Verify thumbnail displays

### Cloud Storage

- [ ] **File selection from cloud storage**
  - On mobile device
  - Tap file upload button
  - Select "Browse" or cloud storage option
  - Select file from Google Drive or iCloud
  - Verify file downloads and uploads correctly

### Mobile Layout

- [ ] **Mobile responsive layout**
  - View upload fields on mobile (< 640px width)
  - Verify buttons are tappable (min 44x44px)
  - Verify thumbnails are appropriate size (60px on mobile)
  - Verify no horizontal scroll
  - Verify padding is correct (16px on mobile)

---

## Error Scenarios

### Network Errors

- [ ] **Network error during execution**
  - Upload media file
  - Disconnect network (disable WiFi)
  - Try to execute function
  - Verify error message displays
  - Reconnect network
  - Verify retry works

### API Errors

- [ ] **API rejects media (wrong format)**
  - If backend validates format
  - Try uploading unsupported format
  - Verify error message displays clearly
  - Verify user can retry with correct format

- [ ] **API rejects media (too large)**
  - If backend has size limits
  - Upload file exceeding limit
  - Verify clear error message ("File too large, max 10MB")
  - Verify user can try smaller file

### Browser Errors

- [ ] **Browser blocks file read**
  - Enable strict privacy settings
  - Try to upload file
  - Verify graceful error handling (not silent failure)

---

## Performance Tests

### UI Responsiveness

- [ ] **Upload 5MB image - UI remains responsive**
  - Select 5MB image
  - During base64 conversion (1-2 seconds)
  - Verify UI doesn't freeze
  - Verify user can still interact with page
  - Verify loading indicator (if implemented)

### Memory

- [ ] **Upload 10 images in array - no memory issues**
  - Add 10 items to image array
  - Upload different image to each
  - Monitor browser memory (DevTools Memory tab)
  - Verify no memory leaks
  - Verify browser doesn't warn about memory usage

### Streaming

- [ ] **Execute with multiple media - streaming works**
  - Upload multiple media files
  - Execute function with streaming enabled
  - Verify results stream in progressively
  - Verify no timeout errors
  - Verify all completions display

### Serialization

- [ ] **Large base64 in JSON - no serialization errors**
  - Upload 10MB file
  - Execute function
  - Check browser console for JSON errors
  - Verify request completes successfully
  - Verify response parses correctly

---

## Real Function Tests

### Find Functions with Media

- [ ] **Find functions with `type: "image"` in schema**
  - Use SDK: `Functions.list(client)`
  - Filter for functions with `input_schema.type === "image"` or `input_schema.properties.*type === "image"`
  - Test at least 2 real functions

- [ ] **Find functions with `type: "audio"` in schema**
  - Find at least 1 real function accepting audio
  - Test full flow with real function

- [ ] **Find functions with `type: "video"` in schema**
  - Find at least 1 real function accepting video
  - Test full flow with real function

### End-to-End Test

- [ ] **Execute real function with real media input**
  - Find function like `market-viability-ranker` (accepts image/audio/video)
  - Upload actual product image
  - Execute function
  - Verify results make sense (LLM actually processed media)
  - Check execution response: verify votes, scores, completions

### Results Validation

- [ ] **Verify results make sense (LLM actually processed media)**
  - Upload image of a product (e.g., coffee mug)
  - Execute ranking/scoring function
  - Read LLM completions
  - Verify LLM references image content in response
  - E.g., "The image shows a coffee mug..." indicates image was processed

---

## Browser Compatibility Matrix

Test core functionality in each browser:

### Desktop

- [ ] **Chrome (latest)**
  - Image upload
  - Audio upload
  - Large file (10MB)
  - Execute function

- [ ] **Firefox (latest)**
  - Image upload
  - Audio upload
  - Large file (10MB)
  - Execute function

- [ ] **Safari (latest)**
  - Image upload
  - Audio upload
  - Large file (10MB)
  - Execute function

### Mobile

- [ ] **iOS Safari**
  - Image upload from Photos
  - File upload from iCloud
  - Execute function

- [ ] **Android Chrome**
  - Image upload from Gallery
  - File upload from Drive
  - Execute function

---

## Accessibility

- [ ] **Keyboard navigation**
  - Tab to upload button
  - Press Enter to open file picker
  - Tab to remove button
  - Press Enter to remove

- [ ] **Screen reader**
  - Enable VoiceOver (Mac) or NVDA (Windows)
  - Navigate to upload field
  - Verify label is announced ("Upload image")
  - Upload file
  - Verify status announced ("Image uploaded")

- [ ] **Focus indicators**
  - Tab through upload fields
  - Verify focus ring visible on all interactive elements
  - Verify focus ring has sufficient contrast

---

## Post-Testing

- [ ] **Review console logs**
  - Open browser DevTools
  - Check Console tab
  - Verify no errors or warnings during testing
  - Document any warnings found

- [ ] **Check Network requests**
  - Open Network tab
  - Filter by "Fetch/XHR"
  - Verify POST to `/functions/.../executions`
  - Verify request body contains base64 data
  - Verify request completes successfully (200 status)

- [ ] **Monitor memory usage**
  - Open Memory profiler
  - Take heap snapshot before testing
  - Complete all tests
  - Take heap snapshot after testing
  - Compare snapshots for memory leaks

- [ ] **Document issues found**
  - Create GitHub issues for any bugs
  - Include:
    - Steps to reproduce
    - Expected behavior
    - Actual behavior
    - Browser/OS version
    - Screenshots/videos if applicable

- [ ] **Test in production-like environment**
  - Deploy to staging environment
  - Repeat critical tests
  - Verify CDN serves assets correctly
  - Verify no issues with minified code

---

## Success Criteria

All tests above should pass with:
- ✅ No critical bugs (crashes, data loss, security issues)
- ✅ No high-priority bugs (broken functionality, bad UX)
- ✅ Acceptable performance (< 3 seconds for 5MB file upload)
- ✅ Works in all target browsers (Chrome, Firefox, Safari, iOS Safari, Android Chrome)
- ✅ No console errors during normal operation
- ✅ Real function execution with media works end-to-end

Medium/low-priority bugs can be documented and fixed later:
- ⚠️ Minor UI polish issues (alignment, spacing)
- ⚠️ Edge cases that don't affect core functionality
- ⚠️ Performance optimizations for extremely large files (> 20MB)

---

## Notes

**File Size Recommendations:**
- Images: < 5MB recommended, 10MB max
- Audio: < 10MB recommended, 20MB max
- Video: < 20MB recommended, 50MB max
- Files: < 10MB recommended, 20MB max

**Browser Support:**
- FileReader API: Supported in all modern browsers (IE10+)
- Base64 encoding: Native browser support
- File input: Universal support

**Known Limitations:**
- No file upload progress indicator (base64 conversion happens in-memory)
- No file size validation on frontend (delegated to backend)
- Silent failure on FileReader errors (no user feedback)

**Tips for Testers:**
- Use browser DevTools Console to see any errors
- Use Network tab to verify API requests
- Use Memory profiler to check for leaks
- Test with real files, not tiny test files
- Test on actual devices, not just simulators
