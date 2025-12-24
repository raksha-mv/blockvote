
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function askBlockAssist(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are BlockAssist, an AI chatbot for the BlockVote decentralized voting platform. 
        BlockVote uses blockchain for secure, transparent voting.
        Key features:
        - Email-based registration/login.
        - Default polls: Open-ended.
        - Moderated polls: Have closing times and creator management.
        - Results are verifiable on-chain (simulated).
        - Glassmorphic UI design.

        YOUR TASK: Answer user questions about the platform in bulleted points ONLY. Be professional and helpful. Keep answers concise.`,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I apologize, but I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
