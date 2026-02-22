// AI Integration Service
const DEFAULT_API_KEY = "AIzaSyBLGmNBIPCgfF632zxPodza9NiLPKCV6ag";
const AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const AIService = {

  getApiKey: () => {
    return localStorage.getItem('geminiApiKey') || DEFAULT_API_KEY;
  },

  generateQuestions: async (topic, contextText, gameType, language = 'id') => {
    const key = AIService.getApiKey();
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
      const response = await fetch(`${AI_API_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      let text = data.candidates[0].content.parts[0].text;
      // Clean up markdown if AI adds it despite instructions
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      return JSON.parse(text);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("AI Error: " + error.message);
      return [];
    }
  },

  checkAnswer: async (studentAnswer, correctAnswer, question) => {
    // For simple cases, strict match is faster and cheaper
    if (studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      return { isCorrect: true, score: 100 };
    }

    const key = AIService.getApiKey();
    // Use AI for semantic checking
    const prompt = `
      Question: "${question}"
      Correct Answer: "${correctAnswer}"
      Student Answer: "${studentAnswer}"

      Is the student answer correct semantically?
      Respond with strictly JSON: {"isCorrect": boolean, "score": number (0-100)}.
      Do not include markdown.
    `;

    try {
      const response = await fetch(`${AI_API_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Grading Error:", error);
      return { isCorrect: false, score: 0 }; // Fallback
    }
  }
};

window.AIService = AIService;
