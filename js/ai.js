// AI Integration Service
const DEFAULT_API_KEY = "AIzaSyBLGmNBIPCgfF632zxPodza9NiLPKCV6ag";

const AIService = {
  getApiKey: () => {
    return localStorage.getItem('geminiApiKey') || DEFAULT_API_KEY;
  },

  cachedModelUrl: null,

  discoverModel: async (key) => {
    // If we have a cached URL, use it
    if (AIService.cachedModelUrl) return AIService.cachedModelUrl;

    const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    let selectedModel = "gemini-2.0-flash"; // Default fallback (short name)
    let foundModel = null;

    try {
      const response = await fetch(`${BASE_URL}/models?key=${key}`);

      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];

        // Priority list: Flash models first for speed/cost, then Pro. Newer versions first.
        const priorities = [
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-flash",
          "gemini-1.5-pro",
          "gemini-pro"
        ];


        for (const p of priorities) {
          // Find a model whose name includes the priority string
          // AND supports generateContent
          const match = models.find(m =>
            m.name.includes(p) &&
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent")
          );
          if (match) {
            foundModel = match.name;
            console.log("AI Model Discovered (Priority):", foundModel);
            break;
          }
        }

        if (!foundModel) {
            // Pick ANY model that supports generateContent if no priority match
            const any = models.find(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
            if (any) {
                foundModel = any.name;
                console.log("AI Model Discovered (Fallback):", foundModel);
            }
        }

        if (foundModel) selectedModel = foundModel;

      } else {
          console.warn("Failed to list models:", response.status, response.statusText);
      }

    } catch (e) {
      console.warn("Model discovery error, using default.", e);
    }

    // Ensure "models/" prefix
    if (!selectedModel.startsWith("models/")) {
        selectedModel = `models/${selectedModel}`;
    }

    AIService.cachedModelUrl = `${BASE_URL}/${selectedModel}:generateContent`;
    return AIService.cachedModelUrl;
  },

  generateQuestions: async (topic, contextText, gameType, language = 'id') => {
    const key = AIService.getApiKey();
    let apiUrl;
    try {
        apiUrl = await AIService.discoverModel(key);
    } catch (e) {
        // Fallback should ideally not happen if discover handles errors, but safety first
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    }

    let prompt = "";
    const langInstruction = language === 'id' ? "Output must be in Indonesian language." : "Output must be in English language.";

    if (gameType === 'quiz') {
      prompt = `
        Create 5 multiple choice questions about "${topic}".
        ${contextText ? `Use the following text as source material: "${contextText.substring(0, 5000)}..."` : ""}
        ${langInstruction}
        Format the output strictly as a JSON array of objects with keys: "question", "options" (array of 4 strings), "answer" (the correct string from options).
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;
    } else if (gameType === 'matching') {
      prompt = `
        Create 5 matching pairs about "${topic}".
        ${contextText ? `Use the following text as source material: "${contextText.substring(0, 5000)}..."` : ""}
        ${langInstruction}
        Format the output strictly as a JSON array of objects with keys: "left" (term), "right" (definition/match).
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;
    } else if (gameType === 'fillBlank') {
      prompt = `
        Create 5 fill-in-the-blank sentences about "${topic}".
        ${contextText ? `Use the following text as source material: "${contextText.substring(0, 5000)}..."` : ""}
        ${langInstruction}
        Format the output strictly as a JSON array of objects with keys: "sentence" (use '___' for the blank), "answer" (the missing word).
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;
    }

    try {
      const response = await fetch(`${apiUrl}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("AI API Error", data.error);
        if (data.error.code === 404 || (data.error.message && data.error.message.includes("not found"))) {
             // If 404, maybe our discovery was stale or default failed.
             // Clear cache so next attempt retries discovery.
             AIService.cachedModelUrl = null;
             throw new Error("Model version not found. Please try again.");
        }
        throw new Error(data.error.message);
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
         throw new Error("No content generated by AI.");
      }

      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      return JSON.parse(text);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("AI Error: " + error.message);
      return [];
    }
  },

  checkAnswer: async (studentAnswer, correctAnswer, question) => {
    if (studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      return { isCorrect: true, score: 100 };
    }

    const key = AIService.getApiKey();
    let apiUrl;
    try {
        apiUrl = await AIService.discoverModel(key);
    } catch (e) {
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    }

    const prompt = `
      Question: "${question}"
      Correct Answer: "${correctAnswer}"
      Student Answer: "${studentAnswer}"

      Is the student answer correct semantically?
      Respond with strictly JSON: {"isCorrect": boolean, "score": number (0-100)}.
      Do not include markdown.
    `;

    try {
      const response = await fetch(`${apiUrl}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Grading Error:", error);
      return { isCorrect: false, score: 0 };
    }
  }
};

window.AIService = AIService;
