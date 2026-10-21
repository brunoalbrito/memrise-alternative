
interface GeminiRequest {
  contents: [
    {
      parts: [
        {
          text: string;
        }
      ];
    }
  ];
  generationConfig: {
    aspectRatio?: string;
    outputMimeType?: string;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData: {
          mimeType: string;
          data: string; // base64-encoded image
        };
      }>;
    };
  }>;
}

interface GeneratedImage {
  imageBase64: string;
  mimeType: string;
  generatedAt: string;
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent";

/**
 * Generate image using Google Gemini API.
 * @param prompt Image description (max 20k characters)
 * @param apiKey Google API key from AI Studio
 * @param aspectRatio Optional: "1:1" (default), "16:9", etc.
 * @returns Generated image as base64 string, or error message
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string,
  aspectRatio: string = "1:1"
): Promise<GeneratedImage | string> {
  if (!prompt || !apiKey) {
    return "Missing prompt or API key";
  }

  const requestBody: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      aspectRatio,
      outputMimeType: "image/jpeg",
    },
  };

  const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;

  console.debug("[Gemini] Generating image", {
    prompt: prompt.substring(0, 50) + "...",
    aspectRatio,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await response.json().catch(() => ({}));
      console.error("[Gemini] API error", {
        status: response.status,
        statusText: response.statusText,
      });

      // Handle specific error codes per contract
      if (response.status === 400) {
        return "Invalid request. Please check your prompt and try again.";
      }
      if (response.status === 429) {
        return "Image generation failed: Rate limit exceeded (100 per minute). Please try again in a moment.";
      }
      if (response.status === 500 || response.status === 503) {
        return "Image generation failed: Service temporarily unavailable. Try again later.";
      }
      return `Image generation failed: HTTP ${response.status}`;
    }

    const data: GeminiResponse = await response.json();

    // Extract base64 image from response per contract
    if (!data.candidates || !data.candidates[0]) {
      console.error("[Gemini] Unexpected response structure");
      return "Invalid response format from image generation API";
    }

    const imagePart = data.candidates[0].content.parts[0];
    if (!imagePart.inlineData) {
      console.error("[Gemini] Missing image data in response");
      return "Image data not found in API response";
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;

    if (!base64Data || typeof base64Data !== "string") {
      return "Invalid image data format";
    }

    console.debug("[Gemini] Image generated successfully");

    return {
      imageBase64: base64Data,
      mimeType,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Gemini] Request failed", { message });

    if (message.includes("fetch")) {
      return "Network error: Could not reach image generation service";
    }
    return `Image generation failed: ${message}`;
  }
}

/**
 * Decode base64 image to data URL for display.
 */
export function imageBase64ToDataUrl(base64: string, mimeType: string = "image/jpeg"): string {
  return `data:${mimeType};base64,${base64}`;
}
