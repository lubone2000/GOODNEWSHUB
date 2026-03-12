import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const cleanJson = (text: string) => {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

export const geminiService = {
  async discoverNews(query: string, existingTitles: string[] = []) {
    try {
      console.log("Discovering news for query:", query);
      const today = new Date().toISOString().split('T')[0];
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      const avoidPrompt = existingTitles.length > 0 
        ? `\n\nCRITICAL: DO NOT include stories that are the same as or very similar to these existing titles: ${existingTitles.slice(-30).join(", ")}`
        : "";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find 10 unique, REAL, and RECENT positive news stories about ${query || "global progress and innovation"}. 
        
        Today's Date: ${today}
        Random Seed: ${randomSeed}
        ${avoidPrompt}
        
        CRITICAL INSTRUCTIONS:
        1. Use Google Search to find REAL news from the last 7-14 days. 
        2. DO NOT repeat the same stories if this is a subsequent search. Look for different angles or lesser-known breakthroughs.
        3. Inspired by 'themotivatehq' (Instagram) and high-quality resources like Positive News, Reasons to be Cheerful, and Good News Network.
        4. Prioritize stories about:
           - Wildlife conservation success.
           - Environmental breakthroughs (plastic bans, reforestation).
           - Human rights and social justice victories.
           - Health breakthroughs (cancer research, medical access).
           - Community-led urban innovations.
        5. Prioritize high-authority sources: Reuters, AP, BBC, Nature, Science, NASA, UN, major universities, and government agencies.
        6. Categories MUST be one of: Tech, Nature, Culture, Politics, Science, Health, Historical Context, Economic Resilience, Space & Frontiers, Social Innovation, Future Visions, Creative Frontiers, Urban Evolution.
        7. Return as a JSON array of objects with: id (slug), title, summary, category, region, and a list of sources (url, title).
        
        Focus on verified, impactful news that represents genuine progress. If no new stories are found for the specific query, expand the search to related positive developments.`,
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
              required: ["id", "title", "summary", "category", "region"]
            }
          }
        }
      });
      const text = response.text;
      console.log("Gemini Response Text:", text);
      if (!text) return [];
      const cleaned = cleanJson(text);
      console.log("Cleaned JSON:", cleaned);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error in discoverNews:", error);
      return [];
    }
  },

  async verifyStory(story: any, sources: any[]) {
    try {
      const sourceTexts = sources.map(s => `Source: ${s.title}\nURL: ${s.url}\nContent: ${s.content || 'N/A'}`).join("\n\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Perform a deep verification and editorial assessment of this news story using Google Search grounding.
        
        Story: ${story.title}
        Initial Sources Provided:
        ${sourceTexts}

        Tasks:
        1. VERIFICATION: Search for independent confirmation. Extract 3-5 specific, verifiable claims. Calculate a verification score (0-100).
        2. EDITORIAL SCORING: Score the story (1-10) on these dimensions:
           - Novelty: How new/surprising is it?
           - Emotional Lift: Strength of hope/inspiration/delight.
           - Shareability: Likelihood of reposts/comments.
           - Visual Potential: How well it translates to video.
           - Audience Fit: Relevance to social media news consumers.
           - Shelf Life: Timely vs Evergreen.
           - Explainer Needed: Complexity level.
        3. PROOF ASSETS: Generate public-facing visual proof elements:
           - Claim Cards: Short on-screen factual statements.
           - Source Badges: Trust markers (e.g. "Peer Reviewed", "Direct Quote", "Gov Data").
           - Verification Summary: A short panel explaining why this is trustworthy.

        Return JSON with: 
        score (int), 
        claims (array of {text, status}), 
        flags (array of strings),
        editorial_scores (object with novelty, emotional_lift, shareability, visual_potential, audience_fit, shelf_life, explainer_needed),
        proof_assets (object with claim_cards (array), source_badges (array), verification_summary (string)).`,
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
                    status: { type: Type.STRING }
                  }
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
                }
              },
              proof_assets: {
                type: Type.OBJECT,
                properties: {
                  claim_cards: { type: Type.ARRAY, items: { type: Type.STRING } },
                  source_badges: { type: Type.ARRAY, items: { type: Type.STRING } },
                  verification_summary: { type: Type.STRING }
                }
              }
            }
          }
        }
      });
      const text = response.text;
      if (!text) return { score: 0, claims: [], flags: [], editorial_scores: {}, proof_assets: {} };
      return JSON.parse(cleanJson(text));
    } catch (error) {
      console.error("Error in verifyStory:", error);
      return { score: 0, claims: [], flags: [], editorial_scores: {}, proof_assets: {} };
    }
  },

  async generateContent(story: any, claims: any[], platform: 'tiktok' | 'instagram', style: string = "Professional", customInstruction: string = "") {
    try {
      const claimsText = claims.map(c => `- ${c.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Create a platform-native short-form content pack for ${platform} for this verified positive news story.
        
        Story: ${story.title}
        Summary: ${story.summary}
        Verified Claims:
        ${claimsText}

        Primary Tone/Style: ${style}
        ${customInstruction ? `STEERING INSTRUCTION: ${customInstruction}` : ""}
        
        REQUIRED OUTPUTS:
        1. 15-second hook clip: Ultra-short attention grabber. Strong first-line hook. One key takeaway only.
        2. 30-45 second Reel/TikTok script: Concise story version optimized for narration/voiceover. Feels natural for ${platform}.
        3. 90-second explainer: Fuller version for context. Explains what happened, why it matters, and why it is credible.

        For each output, provide:
        - hook: The opening line.
        - script: The full spoken script.
        - visual_description: Description of what should be on screen.

        Return JSON with an array of 3 objects (one for each format), each containing: 
        format: (one of "15s_hook", "45s_reel", "90s_explainer"),
        platform: "${platform}",
        hook: (The opening line),
        script: (The full script), 
        visual_description: (Visual instructions).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                format: { type: Type.STRING },
                platform: { type: Type.STRING },
                hook: { type: Type.STRING },
                script: { type: Type.STRING },
                visual_description: { type: Type.STRING }
              },
              required: ["format", "platform", "script"]
            }
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      return JSON.parse(cleanJson(text));
    } catch (error) {
      console.error("Error in generateContent:", error);
      return [];
    }
  },

  async generateImage(prompt: string, optionIndex: number = 0) {
    try {
      const variations = [
        "High-impact close-up portrait with deep emotional expression. Cinematic lighting.",
        "A dramatic 'Before vs After' split scene or a contextual wide shot showing the scale of impact.",
        "A warm, vibrant scene of human or animal connection. Soft, golden hour lighting."
      ];

      console.log(`Generating image option ${optionIndex} for prompt:`, prompt);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Generate a high-impact, professional, emotionally resonant image for a positive news story. 
              
              Style: National Geographic meets Cinematic Film. High detail, vibrant but natural colors.
              Subject: ${prompt}
              Variation Instruction: ${variations[optionIndex % variations.length]}
              
              Guidelines:
              - Aspect Ratio: 9:16 (Vertical Story Format)
              - Focus on the EYES and EMOTION if showing people or animals.
              - Use shallow depth of field (blurred background) to make the subject pop.
              - No text, no logos, no identifiable faces of real public figures.
              - Ensure the bottom third of the image is relatively clear for a text overlay.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

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
  }
};
