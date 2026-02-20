//! Turn vector response options into prompt parts. Multimodal = labeled, not wrapped in quotes. by nityam

use super::mutations::{MultimodalMutation, NoOpMutation};
use objectiveai::chat::completions::request::{RichContent, RichContentPart};

fn has_multimodal(content: &RichContent) -> bool {
    match content {
        RichContent::Text(_) => false,
        RichContent::Parts(parts) => parts.iter().any(|p| !matches!(p, RichContentPart::Text { .. })),
    }
}

/// Text-only → JSON-like. Any multimodal → "Option `key`: " + parts (no quotes around media).
pub fn into_parts_for_prompt(
    vector_responses: &[objectiveai::chat::completions::request::RichContent],
    vector_pfx_indices: &[(String, usize)],
    mutation: Option<&dyn MultimodalMutation>,
) -> Vec<objectiveai::chat::completions::request::RichContentPart> {
    let mutation = mutation.unwrap_or(&NoOpMutation);
    let any_multimodal = vector_pfx_indices.iter().any(|(_, i)| {
        has_multimodal(&vector_responses[*i])
    });

    if any_multimodal {
        into_parts_labeled(vector_responses, vector_pfx_indices, mutation)
    } else {
        into_parts_json_like(vector_responses, vector_pfx_indices)
    }
}

fn into_parts_labeled(
    vector_responses: &[objectiveai::chat::completions::request::RichContent],
    vector_pfx_indices: &[(String, usize)],
    mutation: &dyn MultimodalMutation,
) -> Vec<objectiveai::chat::completions::request::RichContentPart> {
    let mut parts = Vec::new();
    for (i, (vector_pfx_key, vector_response_index)) in vector_pfx_indices.iter().enumerate() {
        if i > 0 {
            parts.push(
                objectiveai::chat::completions::request::RichContentPart::Text {
                    text: "\n\n".to_string(),
                },
            );
        }
        parts.push(
            objectiveai::chat::completions::request::RichContentPart::Text {
                text: format!("Option {}: ", vector_pfx_key),
            },
        );
        match &vector_responses[*vector_response_index] {
            objectiveai::chat::completions::request::RichContent::Text(text) => {
                parts.push(
                    objectiveai::chat::completions::request::RichContentPart::Text {
                        text: json_escape::escape_str(text).to_string(),
                    },
                );
            }
            objectiveai::chat::completions::request::RichContent::Parts(rich_parts) => {
                for rich_part in rich_parts {
                    match rich_part {
                        objectiveai::chat::completions::request::RichContentPart::Text { text } => {
                            parts.push(
                                objectiveai::chat::completions::request::RichContentPart::Text {
                                    text: json_escape::escape_str(text).to_string(),
                                },
                            );
                        }
                        objectiveai::chat::completions::request::RichContentPart::ImageUrl {
                            image_url,
                        } => {
                            match mutation.mutate_image(image_url, vector_pfx_key) {
                                Ok(mutated) => {
                                    parts.push(
                                        objectiveai::chat::completions::request::RichContentPart::ImageUrl {
                                            image_url: mutated,
                                        },
                                    );
                                }
                                Err(_) => {
                                    parts.push(rich_part.clone());
                                }
                            }
                        }
                        objectiveai::chat::completions::request::RichContentPart::InputAudio {
                            input_audio,
                        } => {
                            match mutation.mutate_audio(input_audio, vector_pfx_key) {
                                Ok(mutated) => {
                                    parts.push(
                                        objectiveai::chat::completions::request::RichContentPart::InputAudio {
                                            input_audio: mutated,
                                        },
                                    );
                                }
                                Err(_) => {
                                    parts.push(rich_part.clone());
                                }
                            }
                        }
                        objectiveai::chat::completions::request::RichContentPart::InputVideo {
                            video_url,
                        } => {
                            match mutation.mutate_video(video_url, vector_pfx_key) {
                                Ok(mutated) => {
                                    parts.push(
                                        objectiveai::chat::completions::request::RichContentPart::InputVideo {
                                            video_url: mutated,
                                        },
                                    );
                                }
                                Err(_) => {
                                    parts.push(rich_part.clone());
                                }
                            }
                        }
                        objectiveai::chat::completions::request::RichContentPart::VideoUrl {
                            video_url,
                        } => {
                            match mutation.mutate_video(video_url, vector_pfx_key) {
                                Ok(mutated) => {
                                    parts.push(
                                        objectiveai::chat::completions::request::RichContentPart::VideoUrl {
                                            video_url: mutated,
                                        },
                                    );
                                }
                                Err(_) => {
                                    parts.push(rich_part.clone());
                                }
                            }
                        }
                        objectiveai::chat::completions::request::RichContentPart::File { file } => {
                            match mutation.mutate_file(file, vector_pfx_key) {
                                Ok(mutated) => {
                                    parts.push(
                                        objectiveai::chat::completions::request::RichContentPart::File {
                                            file: mutated,
                                        },
                                    );
                                }
                                Err(_) => {
                                    parts.push(rich_part.clone());
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    parts
}

fn into_parts_json_like(
    vector_responses: &[objectiveai::chat::completions::request::RichContent],
    vector_pfx_indices: &[(String, usize)],
) -> Vec<objectiveai::chat::completions::request::RichContentPart> {
    let mut parts = Vec::new();
    for (i, (vector_pfx_key, vector_response_index)) in vector_pfx_indices.iter().enumerate() {
        if i == 0 {
            parts.push(
                objectiveai::chat::completions::request::RichContentPart::Text {
                    text: format!("{{\n    \"{}\": \"", vector_pfx_key),
                },
            );
        } else {
            parts.push(
                objectiveai::chat::completions::request::RichContentPart::Text {
                    text: format!("\",\n    \"{}\": \"", vector_pfx_key),
                },
            );
        }
        match &vector_responses[*vector_response_index] {
            objectiveai::chat::completions::request::RichContent::Text(text) => {
                parts.push(
                    objectiveai::chat::completions::request::RichContentPart::Text {
                        text: json_escape::escape_str(text).to_string(),
                    },
                );
            }
            objectiveai::chat::completions::request::RichContent::Parts(rich_parts) => {
                for rich_part in rich_parts {
                    match rich_part {
                        objectiveai::chat::completions::request::RichContentPart::Text { text } => {
                            parts.push(
                                objectiveai::chat::completions::request::RichContentPart::Text {
                                    text: json_escape::escape_str(text).to_string(),
                                },
                            );
                        }
                        part => {
                            parts.push(part.clone());
                        }
                    }
                }
            }
        }
    }
    if !parts.is_empty() {
        parts.push(
            objectiveai::chat::completions::request::RichContentPart::Text {
                text: "\"\n}".to_string(),
            },
        );
    }
    parts
}

#[cfg(test)]
mod tests {
    use super::*;
    use objectiveai::chat::completions::request::{
        ImageUrl, RichContent, RichContentPart,
    };

    #[test]
    fn text_only_uses_json_like_format() {
        let responses = vec![
            RichContent::Text("hello".to_string()),
            RichContent::Text("world".to_string()),
        ];
        let indices = vec![("A".to_string(), 0), ("B".to_string(), 1)];
        let parts = into_parts_for_prompt(&responses, &indices, None);
        let texts: Vec<&str> = parts
            .iter()
            .filter_map(|p| {
                if let RichContentPart::Text { text } = p {
                    Some(text.as_str())
                } else {
                    None
                }
            })
            .collect();
        assert!(texts.join("").contains("\"A\": \""));
        assert!(texts.join("").contains("hello"));
        assert!(texts.join("").contains("\"B\": \""));
        assert!(texts.join("").contains("world"));
        assert!(texts.join("").contains("\n}"));
    }

    #[test]
    fn multimodal_uses_labeled_format_no_quotes() {
        let responses = vec![
            RichContent::Parts(vec![
                RichContentPart::Text {
                    text: "caption".to_string(),
                },
                RichContentPart::ImageUrl {
                    image_url: ImageUrl {
                        url: "https://example.com/img.png".to_string(),
                        detail: None,
                    },
                },
            ]),
        ];
        let indices = vec![("`A`".to_string(), 0)];
        let parts = into_parts_for_prompt(&responses, &indices, None);
        let texts: Vec<String> = parts
            .iter()
            .filter_map(|p| {
                if let RichContentPart::Text { text } = p {
                    Some(text.clone())
                } else {
                    None
                }
            })
            .collect();
        let combined = texts.join("");
        assert!(combined.contains("Option `A`: "), "got: {}", combined);
        assert!(combined.contains("caption"));
        assert!(!combined.contains("\"A\""));
        let has_image = parts.iter().any(|p| matches!(p, RichContentPart::ImageUrl { .. }));
        assert!(has_image);
    }
}
