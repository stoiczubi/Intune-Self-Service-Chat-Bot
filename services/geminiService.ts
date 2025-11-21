import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, IntentResponse } from "../types";

// Initialize AI only if Key exists to prevent crash on load
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
} else {
  console.warn("⚠️ No API_KEY found in environment. App is running in 'Keyword Match' mode for testing.");
}

export const analyzeUserIntent = async (userMessage: string): Promise<IntentResponse> => {
  // 1. Fallback Mode: If no API key, use simple keyword matching
  if (!ai) {
    return mockAnalyzeIntent(userMessage);
  }

  // 2. Standard AI Mode
  try {
    const prompt = `
      You are an IT Support Assistant for Mondelez International.
      The user is asking for help. Classify their intent into one of the following categories:
      - GET_BITLOCKER: User needs recovery key, bitlocker key, locked out of laptop.
      - WIPE: User wants to wipe, factory reset, or format a device (lost/stolen).
      - RESET_PASSCODE: User forgot phone pin, passcode, needs to unlock mobile device.
      - RETIRE: Remove company data but keep personal data.
      - NONE: General greeting or unclear request.

      If the intent is clear, provide a short friendly confirmation message asking them to select the device.
      If unclear, ask for clarification.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `System: ${prompt}\nUser: ${userMessage}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: [
                ActionType.GET_BITLOCKER,
                ActionType.WIPE,
                ActionType.RESET_PASSCODE,
                ActionType.RETIRE,
                ActionType.NONE
              ]
            },
            reasoning: { type: Type.STRING },
            confirmationMessage: { type: Type.STRING }
          },
          required: ["intent", "confirmationMessage"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IntentResponse;
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini API Error", error);
    // Fallback to keyword matching if API fails
    return mockAnalyzeIntent(userMessage);
  }
};

/**
 * A simple offline mocker that matches keywords so you can test the UI
 * without needing a valid Google Cloud API Key.
 */
const mockAnalyzeIntent = (msg: string): IntentResponse => {
  const lower = msg.toLowerCase();
  
  if (lower.includes('bitlocker') || lower.includes('recovery') || lower.includes('key')) {
    return {
      intent: ActionType.GET_BITLOCKER,
      reasoning: "Keyword match: bitlocker",
      confirmationMessage: "I can help you retrieve your BitLocker recovery key. Please select the device."
    };
  }

  if (lower.includes('wipe') || lower.includes('lost') || lower.includes('stolen') || lower.includes('reset factory')) {
    return {
      intent: ActionType.WIPE,
      reasoning: "Keyword match: wipe",
      confirmationMessage: "I can help you wipe a lost or stolen device. Which device needs to be wiped?"
    };
  }

  if (lower.includes('passcode') || lower.includes('pin') || lower.includes('unlock')) {
    return {
      intent: ActionType.RESET_PASSCODE,
      reasoning: "Keyword match: passcode",
      confirmationMessage: "I can help reset your mobile device passcode. Select the device below."
    };
  }

  return {
    intent: ActionType.NONE,
    reasoning: "No keyword match",
    confirmationMessage: "I'm currently in offline mode (No API Key). Please use the Quick Action buttons on the left, or type 'bitlocker', 'wipe', or 'passcode'."
  };
};