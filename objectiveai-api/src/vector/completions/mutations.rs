//! Embed response keys into multimodal content (image/audio/video/file). by nityam

use objectiveai::chat::completions::request::{File, ImageUrl, InputAudio, VideoUrl};

use crate::vector::completions::image_overlay;

/// Hook to attach the response key into content. Default = no-op.
pub trait MultimodalMutation: Send + Sync {
    fn mutate_image(
        &self,
        image_url: &ImageUrl,
        response_key: &str,
    ) -> Result<ImageUrl, MutateError> {
        let _ = (image_url, response_key);
        Ok(image_url.clone())
    }

    fn mutate_audio(
        &self,
        input_audio: &InputAudio,
        response_key: &str,
    ) -> Result<InputAudio, MutateError> {
        let _ = (input_audio, response_key);
        Ok(input_audio.clone())
    }

    fn mutate_video(
        &self,
        video_url: &VideoUrl,
        response_key: &str,
    ) -> Result<VideoUrl, MutateError> {
        let _ = (video_url, response_key);
        Ok(video_url.clone())
    }

    fn mutate_file(&self, file: &File, response_key: &str) -> Result<File, MutateError> {
        let _ = (file, response_key);
        Ok(file.clone())
    }
}

/// No-op (content unchanged).
#[derive(Debug, Clone, Copy, Default)]
pub struct NoOpMutation;

impl MultimodalMutation for NoOpMutation {}

/// Puts response key on images (data URLs). Audio/video/file left unchanged; use custom impl for TTS/ffmpeg.
#[derive(Debug, Clone, Copy, Default)]
pub struct ImageLabelMutation;

impl MultimodalMutation for ImageLabelMutation {
    fn mutate_image(
        &self,
        image_url: &ImageUrl,
        response_key: &str,
    ) -> Result<ImageUrl, MutateError> {
        image_overlay::overlay_label(image_url, response_key).map_err(MutateError::from)
    }
}

#[derive(Debug, thiserror::Error)]
#[error("multimodal mutation failed: {0}")]
pub struct MutateError(pub String);

impl From<String> for MutateError {
    fn from(s: String) -> Self {
        MutateError(s)
    }
}
