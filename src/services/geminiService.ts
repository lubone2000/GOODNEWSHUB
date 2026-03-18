// Sunny Signals Worldwide - Service Version 1.0.1
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key is missing. Please ensure GEMINI_API_KEY or VITE_GEMINI_API_KEY is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json\s*/g, "").replace(/\s*```$/g, "");
  cleaned = cleaned.replace(/^```\s*/g, "").replace(/\s*```$/g, "");
  
  // Find the first and last structural characters
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  // Determine which structure starts first
  const hasBraces = firstBrace !== -1 && lastBrace !== -1;
  const hasBrackets = firstBracket !== -1 && lastBracket !== -1;

  if (hasBraces && (!hasBrackets || firstBrace < firstBracket)) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  } else if (hasBrackets) {
    return cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
};

export const geminiService = {
  async discoverNews(query: string, existingTitles: string[] = []) {
    try {
      console.log("Discovering news for query:", query);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString();
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      const focusModes = [
        "DEEP SCIENCE: Focus on university journals and breakthrough labs.",
        "LOCAL HEROES: Focus on specific cities and community-led transformations.",
        "GLOBAL TRENDS: Focus on what's spiking on social media right now.",
        "UNDER-REPORTED: Find stories from non-Western or niche news outlets.",
        "EMERGING TECH: Focus on AI, Biotech, and GreenTech solving real problems.",
        "WILDLIFE & NATURE: Focus on conservation wins and species recovery.",
        "EVERGREEN FACTS: Mind-blowing positive facts about human progress, biology, or the planet that aren't necessarily 'news'.",
        "HISTORICAL WINS: Major milestones in human history that provide perspective on current progress.",
        "CULTURAL SHIFTS: Positive changes in how society operates, inclusivity, and global cooperation."
      ];
      const selectedFocus = focusModes[Math.floor(Math.random() * focusModes.length)];

      const avoidPrompt = existingTitles.length > 0 
        ? `\n\nCRITICAL: DO NOT include stories that are the same as or very similar to these existing titles: ${existingTitles.slice(-50).join(", ")}`
        : "";

      console.log("Discovering news for query:", query);
      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a world-class Engagement-Aware News & Fact Discovery Agent. Your goal is to find "Socially Potent" positive news stories and mind-blowing positive facts that are primed for high performance on TikTok and Instagram.

        Today's Date: ${today}
        Current Time: ${timeStr}
        Random Seed: ${randomSeed}
        ${avoidPrompt}

        CURRENT SEARCH FOCUS: ${selectedFocus}

        STAGE 1: WIDE DISCOVERY
        Scan for stories using these Query Families (Randomly prioritize different ones each time):
        - BREAKTHROUGH: "first time", "record low/high", "historic win", "new solution", "successful trial".
        - HUMAN IMPACT: "saved", "restored", "cured", "protected", "rebuilt", "recovered".
        - HOPE/PROGRESS: "community success", "conservation success", "health gains", "decline in harm".
        - SOCIALLY STICKY: "unbelievable but true", "what changed", "why this matters", "before/after".
        - EVERGREEN/FACTS: "did you know", "mind-blowing fact", "humanity win", "planet progress", "nature secret".

        Integrate Trend Signals:
        - Look for rising topics on Google Trends, TikTok hashtags, and Instagram themes related to ${query || "global progress"}.
        - Normalize results from multi-language sources (English, German, Spanish, French, Portuguese, Japanese).

        STAGE 2: STORY SHAPING + RANKING
        For each candidate, evaluate:
        1. Engagement Potential: Strong emotional payoff? Surprising contrast? One-sentence explainability?
        2. Visual Searchability: Does it have people, animals, physical transformation, or dramatic locations?
        3. Social Potency: Is it a clear 15s hook? Does it have a "conflict-to-resolution" arc?

        CRITICAL INSTRUCTIONS:
        - Use Google Search to find REAL news (last 30 days) AND evergreen positive facts (mind-blowing statistics, biological wonders, historical milestones) that are highly shareable.
        - DIVERSITY IS KEY: Ensure the 15 results cover at least 4 different continents and 5 different categories.
        - INCLUDE NON-NEWS: At least 3-5 of the 15 results should be "Evergreen Facts" or "Historical Progress" that provide perspective on how far humanity has come.
        - Avoid "Boring Positivity": No generic corporate CSR, no vague awareness campaigns, no small donations with no impact.
        - Prefer stories with visible change and measurable results.
        - Search across university press releases, NGO updates, government announcements, scientific journals, specialized fact databases (like Our World in Data), and historical archives.

        Return a JSON array of 15 objects with:
        - id: slug
        - title: engaging, hook-style title
        - summary: concise, punchy summary
        - category: MUST be exactly one of: "Health Wins", "Climate Progress", "Wildlife Recovery", "Science Breakthroughs", "Tech Helping People", "Local Community Wins", "Education Improvements", "Accessibility Progress", "Evergreen Facts", "Historical Wins", "Little Wins"
        - region: specific location or "Global"
        - sources: array of {url, title}
        - engagement_score: 1-10 (predicted social performance)
        - visual_score: 1-10 (potential for short-form video)
        - trend_signal: string explaining why it's trending or shareable now`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                region: { type: Type.STRING },
                engagement_score: { type: Type.INTEGER },
                visual_score: { type: Type.INTEGER },
                trend_signal: { type: Type.STRING },
                sources: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING },
                      title: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ["id", "title", "summary", "category", "region", "engagement_score", "visual_score"]
            }
          }
        }
      });
      const text = response.text;
      console.log("Discovery response text length:", text?.length || 0);
      if (!text) return [];
      try {
        const parsed = JSON.parse(cleanJson(text));
        console.log("Parsed stories count:", parsed.length);
        return parsed;
      } catch (e) {
        console.error("Failed to parse discovery JSON:", e);
        return [];
      }
    } catch (error) {
      console.error("Error in discoverNews:", error);
      return [];
    }
  },

  async verifyStory(story: any, sources: any[]) {
    try {
      console.log("Verifying story:", story.title);
      // Limit source content to prevent massive prompts
      const sourceTexts = sources.map(s => {
        const content = s.content ? (s.content.length > 1500 ? s.content.substring(0, 1500) + "..." : s.content) : 'N/A';
        return `Source: ${s.title}\nURL: ${s.url}\nContent: ${content}`;
      }).join("\n\n");

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Verification timed out")), 90000)
      );

      const aiPromise = getAi().models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are a Senior Fact-Checking & Editorial Agent. Your task is to verify the following news story and provide a structured assessment.

        STORY TO VERIFY:
        Title: ${story.title}
        Summary: ${story.summary}

        INITIAL SOURCES:
        ${sourceTexts || "No specific sources provided. Use Google Search to find primary evidence."}

        INSTRUCTIONS:
        1. SEARCH & VERIFY: Use Google Search to find at least 2-3 high-authority sources (university journals, government reports, major news outlets).
        2. EXTRACT CLAIMS: Identify 3-5 specific, verifiable claims.
        3. FIND FACTUAL IMAGES: Find URLs for 2-3 real-world images that provide visual proof or context for this story (e.g., photos of the event, the people involved, or the location). 
           CRITICAL RULES FOR IMAGES:
           - You MUST provide DIRECT image URLs (must end in .jpg, .jpeg, .png, .webp, or .avif).
           - DO NOT provide URLs to news articles, HTML pages, or social media posts.
           - If you find an image on a news site, try to extract the actual image source URL from the <img> tag.
           - If you cannot find a direct image URL, DO NOT include it in the 'fact_images' array. It is better to have 0 images than broken links.
           - High-authority sources like Wikipedia, Wikimedia Commons, or official organization media kits are preferred.
        4. SCORE: Provide a verification score (0-100) and editorial scores (1-10).
        5. PROOF ASSETS: Create short "Claim Cards" (max 60 chars) and "Source Badges" (e.g., "Peer Reviewed").

        OUTPUT FORMAT:
        You MUST return your response as a single valid JSON object.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              claims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ["verified", "unverified", "debunked"] }
                  },
                  required: ["text", "status"]
                }
              },
              flags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              editorial_scores: {
                type: Type.OBJECT,
                properties: {
                  novelty: { type: Type.INTEGER },
                  emotional_lift: { type: Type.INTEGER },
                  shareability: { type: Type.INTEGER },
                  visual_potential: { type: Type.INTEGER },
                  audience_fit: { type: Type.INTEGER },
                  shelf_life: { type: Type.INTEGER },
                  explainer_needed: { type: Type.INTEGER }
                },
                required: ["novelty", "emotional_lift", "shareability", "visual_potential", "audience_fit", "shelf_life", "explainer_needed"]
              },
              proof_assets: {
                type: Type.OBJECT,
                properties: {
                  claim_cards: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  source_badges: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  verification_summary: { type: Type.STRING },
                  fact_images: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        url: { type: Type.STRING },
                        title: { type: Type.STRING }
                      },
                      required: ["url", "title"]
                    }
                  }
                },
                required: ["claim_cards", "source_badges", "verification_summary"]
              }
            },
            required: ["score", "claims", "editorial_scores", "proof_assets"]
          }
        }
      });

      const response: any = await Promise.race([aiPromise, timeoutPromise]);
      const text = response.text;
      if (!text) {
        console.error("Empty response from verification agent. Full response:", response);
        return null;
      }

      const cleaned = cleanJson(text);
      try {
        const data = JSON.parse(cleaned);
        console.log("Verification successful for:", story.title);
        
        // Ensure editorial_scores has defaults to prevent UI issues
        if (!data.editorial_scores) {
          data.editorial_scores = {
            novelty: 5,
            emotional_lift: 5,
            shareability: 5,
            visual_potential: 5,
            audience_fit: 5,
            shelf_life: 5,
            explainer_needed: 5
          };
        }

        // Ensure proof_assets has arrays to prevent frontend crashes
        if (!data.proof_assets) {
          data.proof_assets = {
            claim_cards: [],
            source_badges: [],
            verification_summary: "Verification completed successfully."
          };
        } else {
          data.proof_assets.claim_cards = data.proof_assets.claim_cards || [];
          data.proof_assets.source_badges = data.proof_assets.source_badges || [];
          data.proof_assets.verification_summary = data.proof_assets.verification_summary || "Verification completed successfully.";
        }

        if (!data.score) data.score = 70;
        if (!data.claims) data.claims = [];

        return data;
      } catch (parseError) {
        console.error("Failed to parse verification JSON. Cleaned text:", cleaned);
        console.error("Parse error details:", parseError);
        // Attempt a more aggressive cleanup if standard parsing fails
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("Aggressive JSON parse failed");
          }
        }
        return null;
      }
    } catch (error) {
      console.error("Error in verifyStory:", error);
      return null;
    }
  },

  async generateContent(story: any, claims: any[], platform: string, style: string = "Professional", customInstruction: string = "", customIdea: string = "", brandSettings?: any) {
    try {
      const claimsText = (claims || []).map(c => `- ${c.claim_text || c.text}`).join("\n");
      console.log(`Generating ${platform} content for story: ${story.title}`);
      
      const brandContext = brandSettings ? `
      BRAND IDENTITY RULES:
      - Primary Color: ${brandSettings.primaryColor}
      - Secondary Color: ${brandSettings.secondaryColor}
      - Font Family: ${brandSettings.fontFamily}
      - Visual Style: ${brandSettings.visualStyle}
      - Tone of Voice: ${brandSettings.toneOfVoice}
      - Style Modifier: ${brandSettings.styleModifier}
      ` : "";

      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a comprehensive social media content pack for this verified news story.
        
        Story: ${story.title}
        Summary: ${story.summary}
        ${customIdea ? `Creative Override: ${customIdea} (Use this as the creative angle/theme for the content while keeping the facts from the story)` : ""}
        Verified Claims:
        ${claimsText}

        ${brandContext}

        Primary Tone/Style: ${style}
        ${customInstruction ? `STEERING INSTRUCTION: ${customInstruction}` : ""}
        
        REQUIRED OUTPUTS:
        1. Image Carousel (3 Slides):
           - Each slide needs a clear text overlay and a detailed visual prompt for image generation.
           - For each slide, provide 3 variations of the visual prompt (different styles/angles).
        2. 20-Second Reel (5 Shots, 4s each):
           - A cohesive narrative.
           - Shots 1-4: Detailed cinematic visual prompts and short narration scripts.
           - For each shot, provide 3 variations of the visual prompt.
           - Shot 5 (MANDATORY): A "Typography/Facts" slide. 
             - Visual Prompt: "A professional graphic design typography slide, clean background, modern layout for news facts."
             - Script: Must include:
               1. Very short bulleted facts from the story.
               2. Source attribution (e.g., "Source: ${story.region} news").
               3. Channel Brand: "Sunny Signals Worldwide - The bright side of news".
        3. Hashtags:
           - Provide a list of 5-10 suggested hashtags for Instagram and TikTok.

        IMPORTANT: 
        - If the Brand Tone is "Documentary", the scripts should be observational, grounded, and authentic. 
        - Avoid overly dramatic or "marketing" language. 
        - Focus on the human or environmental impact.
        - Ensure Shot 5 is strictly a data/fact summary slide.

        Return ONLY a valid JSON object with:
        {
          "format": "social_media_pack",
          "platform": "social_media",
          "hashtags": ["#tag1", "#tag2"],
          "carousel": {
            "slides": [
              { "slide_number": 1, "text": "Slide text", "visual_prompt": "Detailed image prompt" },
              { "slide_number": 2, "text": "Slide text", "visual_prompt": "Detailed image prompt" },
              { "slide_number": 3, "text": "Slide text", "visual_prompt": "Detailed image prompt" }
            ]
          },
          "reel": {
            "story_text": "Full narrative text including the final facts summary",
            "shots": [
              { "shot_number": 1, "image_prompt": "Cinematic prompt", "script": "Narration" },
              { "shot_number": 2, "image_prompt": "Cinematic prompt", "script": "Narration" },
              { "shot_number": 3, "image_prompt": "Cinematic prompt", "script": "Narration" },
              { "shot_number": 4, "image_prompt": "Cinematic prompt", "script": "Narration" },
              { "shot_number": 5, "image_prompt": "Typography slide prompt", "script": "Facts summary + Source + Sunny Signals Worldwide - The bright side of news" }
            ]
          }
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              format: { type: Type.STRING },
              platform: { type: Type.STRING },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              carousel: {
                type: Type.OBJECT,
                properties: {
                  slides: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        slide_number: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        visual_prompt: { type: Type.STRING },
                        prompt_variations: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["slide_number", "text", "visual_prompt", "prompt_variations"]
                    }
                  }
                },
                required: ["slides"]
              },
              reel: {
                type: Type.OBJECT,
                properties: {
                  story_text: { type: Type.STRING },
                  shots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        shot_number: { type: Type.INTEGER },
                        image_prompt: { type: Type.STRING },
                        prompt_variations: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        script: { type: Type.STRING }
                      },
                      required: ["shot_number", "image_prompt", "prompt_variations", "script"]
                    }
                  }
                },
                required: ["story_text", "shots"]
              }
            },
            required: ["format", "platform", "hashtags", "carousel", "reel"]
          }
        }
      });
      const text = response.text;
      if (!text) return null;
      
      const cleaned = cleanJson(text);
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse AI response as JSON. Raw text:", text);
        throw e;
      }
      
      return parsed;
    } catch (error) {
      console.error("Error in generateContent:", error);
      return null;
    }
  },

  async generateReelPlan(storyOrPrompt: any) {
    try {
      const isPrompt = typeof storyOrPrompt === 'string';
      const context = isPrompt 
        ? `Idea: ${storyOrPrompt}`
        : `Story: ${storyOrPrompt.title}\nSummary: ${storyOrPrompt.summary}`;

      console.log("Generating reel plan for:", isPrompt ? "Custom Prompt" : storyOrPrompt.title);
      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a 20-second cinematic reel plan.
        
        ${context}
        
        The reel must have 4 distinct shots, each lasting 5 seconds.
        For each shot, provide:
        1. A detailed visual prompt for image generation (cinematic, high-impact).
        2. A short narration script (1 sentence).
        
        Return ONLY a valid JSON object with:
        {
          "story_text": "A cohesive 4-sentence story for the whole reel",
          "shots": [
            {
              "shot_number": 1,
              "image_prompt": "Detailed cinematic prompt...",
              "script": "Narration for this shot..."
            },
            ... (exactly 4 shots)
          ]
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              story_text: { type: Type.STRING },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    shot_number: { type: Type.INTEGER },
                    image_prompt: { type: Type.STRING },
                    script: { type: Type.STRING }
                  },
                  required: ["shot_number", "image_prompt", "script"]
                }
              }
            },
            required: ["story_text", "shots"]
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(cleanJson(text));
    } catch (error) {
      console.error("Error in generateReelPlan:", error);
      return null;
    }
  },

  async generateImage(prompt: string, optionIndex: number = 0, brandSettings?: any, referenceImageUrl?: string) {
    try {
      const visualStyle = brandSettings?.visualStyle || "Cinematic";
      const isDocumentary = visualStyle.toLowerCase().includes('documentary');
      const isTypography = prompt.toLowerCase().includes('typography') || prompt.toLowerCase().includes('fact slide');

      const variations = isTypography ? [
        "Clean, minimal graphic design. Solid or subtle gradient background. Professional layout.",
        "Modern infographic style. High contrast, clean lines. Plenty of negative space for text overlays.",
        "Sophisticated editorial layout. Minimalist aesthetic. High-end magazine feel."
      ] : [
        isDocumentary 
          ? "Raw, unedited documentary footage style. Natural lighting, handheld camera feel, authentic textures. No digital glow, no sci-fi elements, no artificial bokeh."
          : "High-impact close-up portrait with deep emotional expression. Cinematic lighting.",
        isDocumentary
          ? "Observational wide shot. Real-world environment, natural color grading, authentic atmosphere. Realistic proportions, no stylized color filters."
          : "A dramatic contextual wide shot showing the scale of impact. Single frame focus.",
        isDocumentary
          ? "Candid moment captured on film. Authentic grain, natural skin tones, realistic environment. No artificial saturation, no 'AI-look' smoothness."
          : "A warm, vibrant scene of human or animal connection. Soft, golden hour lighting."
      ];

      const styleModifier = brandSettings?.styleModifier || (isDocumentary 
        ? "Shot on 35mm film, documentary photography, authentic, realistic, natural lighting, Pulitzer Prize winning style, raw photo, grainy texture, realistic skin, unedited."
        : "National Geographic meets Cinematic Film. High detail, vibrant but natural colors.");
      
      const negativePrompt = brandSettings?.negativePrompt || (isDocumentary
        ? "cgi, 3d render, digital art, glowing, neon, sci-fi, artificial, plastic, oversaturated, fantasy, anime, cartoon, distorted, text, watermark, smooth skin, airbrushed, perfect lighting, symmetrical faces, split screen, before after, double image, collage"
        : "blurry, low quality, distorted, text, watermark, logos, split screen, before after, double image, collage");

      console.log(`Generating image (${visualStyle}) option ${optionIndex} for prompt:`, prompt);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Image generation timed out")), 60000)
      );

      const parts: any[] = [
        {
          text: isTypography 
            ? `Generate a professional GRAPHIC DESIGN background for a news fact slide.
               Subject: ${prompt}
               Style: ${variations[optionIndex % variations.length]}
               
               Guidelines:
               - Aspect Ratio: 9:16
               - This is a BACKGROUND for text. Keep it clean and uncluttered.
               - Use professional color palettes.
               - NO distorted faces or complex scenes.
               - Focus on clean shapes, gradients, or very subtle textures.`
            : `Generate a ${isDocumentary ? 'REALISTIC DOCUMENTARY' : 'HIGH-IMPACT'} image for a news story. 
          
          Subject: ${prompt}
          Style/Atmosphere: ${styleModifier}. 
          Variation Direction: ${variations[optionIndex % variations.length]}
          
          ${referenceImageUrl ? "REFERENCE IMAGE PROVIDED: Use the provided image as a visual reference for the subject, environment, and factual details. Maintain consistency with the real-world facts shown in the reference." : ""}

          CRITICAL GUIDELINES:
          - Aspect Ratio: 9:16 (Vertical Story Format)
          - SINGLE IMAGE: Generate a single, cohesive scene. NO split screens, NO before/after comparisons, NO double images, NO collages.
          - ${isDocumentary ? 'STRICT REALISM: No digital glow, no sci-fi lighting, no artificial saturation. Must look like real documentary footage.' : 'Focus on the EYES and EMOTION if showing people or animals.'}
          - Use realistic depth of field.
          - No text (except for "BEFORE/AFTER" if specifically requested in the prompt), no logos.
          - Ensure the bottom third of the image is relatively clear for a text overlay.
          - NEGATIVE PROMPT (Avoid these): ${negativePrompt}`,
        },
      ];

      if (referenceImageUrl) {
        try {
          // Use our proxy to bypass CORS
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(referenceImageUrl)}`;
          const imageResponse = await axios.get(proxyUrl, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(imageResponse.data).toString('base64');
          parts.unshift({
            inlineData: {
              data: base64,
              mimeType: 'image/png'
            }
          });
        } catch (fetchError) {
          console.error("Failed to fetch reference image via proxy:", fetchError);
          // Continue without reference image if fetch fails
        }
      }

      const aiPromise = getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

      const response: any = await Promise.race([aiPromise, timeoutPromise]);

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Error in generateImage:", error);
      return null;
    }
  },

  async generateVideo(prompt: string, imageBase64?: string) {
    try {
      console.log("Generating video for prompt:", prompt);
      const ai = getAi();
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        ...(imageBase64 ? {
          image: {
            imageBytes: imageBase64.split(',')[1],
            mimeType: 'image/png'
          }
        } : {}),
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;

      // Fetch the video with the API key
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error in generateVideo:", error);
      return null;
    }
  },

  async generatePromptVariations(basePrompt: string, brandSettings?: any) {
    try {
      console.log("Generating variations for prompt:", basePrompt);
      const brandContext = brandSettings ? `
      Keep in mind the brand's visual style: ${brandSettings.visualStyle} and style modifier: ${brandSettings.styleModifier}.
      ` : "";

      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 distinct variations of the following visual prompt for an image generation model. 
        Each variation should explore a different cinematic style, lighting, or camera angle while keeping the core subject the same.
        
        ${brandContext}
        
        Base Prompt: ${basePrompt}
        
        Return ONLY a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(cleanJson(text));
    } catch (error) {
      console.error("Error generating prompt variations:", error);
      return [];
    }
  }
};

export const klingService = {
  async generateVideo(prompt: string, imageBase64?: string) {
    const apiKey = process.env.KLING_API_KEY;
    if (!apiKey) {
      console.warn("KLING_API_KEY is missing. Falling back to Gemini Video generation.");
      return geminiService.generateVideo(prompt, imageBase64);
    }

    try {
      console.log("Generating video with Kling API...");
      
      // Step 1: Submit Task
      const submitResponse = await axios.post('https://api.klingai.com/v1/videos/text2video', {
        prompt: prompt,
        model: "kling-v1",
        ...(imageBase64 ? { image_url: imageBase64 } : {}),
        config: {
          duration: 5,
          aspect_ratio: "9:16"
        }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = submitResponse.data.data.task_id;
      console.log("Kling task submitted:", taskId);

      // Step 2: Poll for completion
      let status = "processing";
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (status === "processing" && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const checkResponse = await axios.get(`https://api.klingai.com/v1/videos/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        status = checkResponse.data.data.status;
        if (status === "succeeded") {
          videoUrl = checkResponse.data.data.video_url;
        } else if (status === "failed") {
          throw new Error("Kling video generation failed");
        }
        attempts++;
      }

      return videoUrl;
    } catch (error) {
      console.error("Error in klingService:", error);
      // Fallback to Gemini if Kling fails or isn't configured
      return geminiService.generateVideo(prompt, imageBase64);
    }
  }
};
