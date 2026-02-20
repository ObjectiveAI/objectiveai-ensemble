//! Draw response key on image (data URLs). by nityam

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use font8x8::legacy::BASIC_LEGACY;
use image::{ImageFormat, Rgba, RgbaImage};
use objectiveai::chat::completions::request::ImageUrl;

const BAR_HEIGHT: u32 = 24;
const TEXT_COLOR: [u8; 4] = [255, 255, 255, 255];
const BAR_COLOR: [u8; 4] = [60, 60, 60, 255];

/// If `url` is a data:image/...;base64,... URL, decodes image, draws label bar at top with
/// `response_key`, re-encodes as PNG data URL. Otherwise returns None (no change).
pub fn overlay_label(image_url: &ImageUrl, response_key: &str) -> Result<ImageUrl, String> {
    let url = image_url.url.trim();
    let Some(rest) = url.strip_prefix("data:") else {
        return Ok(image_url.clone());
    };
    let Some((mime, b64)) = rest.split_once(";base64,") else {
        return Ok(image_url.clone());
    };
    if !mime.starts_with("image/") {
        return Ok(image_url.clone());
    }
    let bytes = BASE64.decode(b64).map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
    let (w, h) = (img.width(), img.height());
    let mut out = RgbaImage::new(w, h + BAR_HEIGHT);
    for y in 0..BAR_HEIGHT {
        for x in 0..w {
            out.put_pixel(x, y, Rgba(BAR_COLOR));
        }
    }
    for (y, row) in img.to_rgba8().rows().enumerate() {
        for (x, p) in row.enumerate() {
            out.put_pixel(x as u32, BAR_HEIGHT + y as u32, *p);
        }
    }
    draw_text_8x8(&mut out, 4, 2, response_key);
    let out = image::DynamicImage::ImageRgba8(out);
    let mut buf = Vec::new();
    out.write_to(&mut std::io::Cursor::new(&mut buf), ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    let new_b64 = BASE64.encode(&buf);
    let new_url = format!("data:image/png;base64,{}", new_b64);
    Ok(ImageUrl {
        url: new_url,
        detail: image_url.detail.clone(),
    })
}

fn draw_text_8x8(rgba: &mut RgbaImage, start_x: i32, start_y: i32, s: &str) {
    for (i, c) in s.chars().enumerate() {
        let idx = c as usize;
        if idx >= 128 {
            continue;
        }
        if idx < 128 {
            let glyph = &BASIC_LEGACY[idx];
            let px = start_x + (i as i32) * 8;
            for (dy, row) in glyph.iter().enumerate() {
                for dx in 0..8 {
                    if (row >> dx) & 1 != 0 {
                        let x = px + (7 - dx);
                        let y = start_y + dy as i32;
                        if x >= 0 && y >= 0 {
                            let x = x as u32;
                            let y = y as u32;
                            if x < rgba.width() && y < rgba.height() {
                                rgba.put_pixel(x, y, Rgba(TEXT_COLOR));
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn non_data_url_returns_unchanged() {
        let url = ImageUrl {
            url: "https://example.com/img.png".to_string(),
            detail: None,
        };
        let out = overlay_label(&url, "A").unwrap();
        assert_eq!(out.url, url.url);
    }

    #[test]
    fn data_url_gets_label_bar() {
        // 1x1 red pixel PNG
        let red = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        let url = ImageUrl {
            url: format!("data:image/png;base64,{}", red),
            detail: None,
        };
        let out = overlay_label(&url, "`A`").unwrap();
        assert!(out.url.starts_with("data:image/png;base64,"));
        assert!(out.url.len() > url.url.len());
    }
}

