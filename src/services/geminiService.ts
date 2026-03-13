import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const cleanJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  
  // If there's still text around the JSON, try to extract the first { ... } or [ ... ] block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
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
      const response = await ai.models.generateContent({
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
        - category: MUST be exactly one of: "Health Wins", "Climate Progress", "Wildlife Recovery", "Science Breakthroughs", "Tech Helping People", "Local Community Wins", "Education Improvements", "Accessibility Progress", "Evergreen Facts", "Historical Wins"
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

      const aiPromise = ai.models.generateContent({
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
        3. SCORE: Provide a verification score (0-100) and editorial scores (1-10).
        4. PROOF ASSETS: Create short "Claim Cards" (max 60 chars) and "Source Badges" (e.g., "Peer Reviewed").

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
                  verification_summary: { type: Type.STRING }
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
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Image generation timed out")), 60000)
      );

      const aiPromise = ai.models.generateContent({
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
  }
};
