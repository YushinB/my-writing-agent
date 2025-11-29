
import { GoogleGenAI, Type } from "@google/genai";
import { CorrectionResponse, WordDefinition, LiveSuggestion, AIModel, WritingStyle } from "../types";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
}

export const analyzeText = async (text: string, modelName: AIModel = 'gemini-2.5-flash', style: WritingStyle = 'formal'): Promise<CorrectionResponse> => {
  if (!text.trim()) {
    throw new Error("Please enter some text to analyze.");
  }

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Analyze the following English text.
    1. Correct any grammar errors.
    2. Provide a 'betterPhrasing' version that is rewritten in a **${style.toUpperCase()}** style.
       - If 'formal', make it professional, polite, and precise.
       - If 'casual', make it conversational, relaxed, and friendly.
       - If 'technical', use precise terminology and clear, objective structure.
       - If 'storytelling', use descriptive language, emotional resonance, and narrative flow.
       - If 'academic', use scholarly tone, complex sentence structures, and objectivity.
       - If 'blog', make it engaging, punchy, and reader-friendly.
    3. List key improvements.
    4. Extract interesting vocabulary, phrasal verbs, or idioms used in your 'betterPhrasing' version.
    5. **IELTS Assessment**: Evaluate the ORIGINAL input text based on IELTS Writing criteria. Provide an overall band score (0.0 to 9.0) and a score/feedback for: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.

    IMPORTANT: You must return the corrected text broken down into a list of segments.
    - Parts of the text that are unchanged should be normal segments.
    - Parts that are changed/corrected should be marked as 'isCorrection: true'.
    - For corrections, you MUST provide the 'originalText' (what was replaced) and a brief 'explanation' of the error.
    - Reconstructing the 'text' fields of the segments in order should yield the full corrected text.

    Input Text:
    "${text}"
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The segment of the corrected text." },
                isCorrection: { type: Type.BOOLEAN, description: "True if this segment differs from original." },
                originalText: { type: Type.STRING, description: "The original text that was replaced (required if isCorrection is true)." },
                explanation: { type: Type.STRING, description: "Why it was changed (required if isCorrection is true)." }
              },
              required: ["text", "isCorrection"]
            }
          },
          betterPhrasing: { type: Type.STRING, description: `The rewritten version of the text in a ${style} style.` },
          betterPhrasingExplanation: { type: Type.STRING, description: "An educational explanation of why the better phrasing is superior, focusing on tone, vocabulary, natural flow, or use of idioms/phrasal verbs." },
          enhancedVocabulary: {
            type: Type.ARRAY,
            description: "List of sophisticated words, phrasal verbs, or idioms found in the betterPhrasing.",
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING, description: "The word or phrase." },
                type: { type: Type.STRING, enum: ['word', 'phrasal_verb', 'idiom'] },
                definition: { type: Type.STRING, description: "Meaning of the term in this context." },
                example: { type: Type.STRING, description: "An example sentence using this term." },
                pronunciation: { type: Type.STRING, description: "IPA (International Phonetic Alphabet) pronunciation of the term." }
              },
              required: ["term", "type", "definition", "example", "pronunciation"]
            }
          },
          explanation: { type: Type.STRING, description: "A brief summary of the main grammatical issues found." },
          keyImprovements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of bullet points explaining specific changes."
          },
          ieltsAssessment: {
            type: Type.OBJECT,
            description: "Assessment of the original text based on IELTS criteria.",
            properties: {
              overallBand: { type: Type.NUMBER, description: "Overall IELTS Band Score (0-9)." },
              generalFeedback: { type: Type.STRING, description: "General feedback on the writing level." },
              criteria: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Criterion name (e.g., Lexical Resource)." },
                    score: { type: Type.NUMBER, description: "Score for this criterion (0-9)." },
                    feedback: { type: Type.STRING, description: "Specific feedback for this criterion." }
                  },
                  required: ["name", "score", "feedback"]
                }
              }
            },
            required: ["overallBand", "generalFeedback", "criteria"]
          }
        },
        required: ["segments", "betterPhrasing", "betterPhrasingExplanation", "enhancedVocabulary", "explanation", "keyImprovements", "ieltsAssessment"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");

  try {
    const data = JSON.parse(jsonText);

    // Construct correctedText from segments to ensure backward compatibility and easy copying
    const correctedText = data.segments ? data.segments.map((s: any) => s.text).join('') : "";

    return {
      ...data,
      correctedText
    } as CorrectionResponse;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to process the analysis results.");
  }
};

export const defineWord = async (word: string, context: string, modelName: AIModel = 'gemini-2.5-flash'): Promise<WordDefinition> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Define the word or phrase "${word}" based on its usage in the following context: "${context}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The word or phrase being defined (normalized form)." },
          definition: { type: Type.STRING, description: "A concise definition relevant to the context." },
          partOfSpeech: { type: Type.STRING, description: "Noun, Verb, Adjective, etc." },
          exampleSentence: { type: Type.STRING, description: "A new example sentence using the word." },
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Up to 3 synonyms."
          }
        },
        required: ["word", "definition", "partOfSpeech", "exampleSentence", "synonyms"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");
  return JSON.parse(jsonText) as WordDefinition;
};

export const getLiveSuggestion = async (text: string, modelName: AIModel = 'gemini-2.5-flash'): Promise<LiveSuggestion | null> => {
  // Extract the last incomplete sentence or the last full sentence
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!sentences || sentences.length === 0) return null;

  const lastFragment = sentences[sentences.length - 1].trim();
  if (lastFragment.length < 3) return null; // Too short to analyze

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Analyze this text fragment: "${lastFragment}".
    If it has a grammar error, correct it.
    If it ends abruptly, suggest a completion.
    If it is correct but simple, suggest a more sophisticated phrasing.

    IMPORTANT: If the text is perfectly fine and needs no immediate change, return the original fragment as the 'suggestion', set 'type' to 'refinement', and 'reason' to 'No changes needed'. Do NOT return null.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalFragment: { type: Type.STRING, description: "The input fragment analyzed." },
          suggestion: { type: Type.STRING, description: "The corrected or improved version of the fragment." },
          type: { type: Type.STRING, enum: ["correction", "completion", "refinement"] },
          reason: { type: Type.STRING, description: "Very brief reason (e.g., 'Fixes verb tense' or 'Completes thought')." }
        },
        required: ["originalFragment", "suggestion", "type", "reason"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) return null;

  try {
     return JSON.parse(jsonText) as LiveSuggestion;
  } catch (e) {
    return null;
  }
};

export const generateText = async (prompt: string, modelName: AIModel = 'gemini-2.5-flash'): Promise<string> => {
  if (!prompt.trim()) {
    throw new Error("Please provide a prompt.");
  }

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return text;
};

const geminiService = {
  analyzeText,
  defineWord,
  getLiveSuggestion,
  generateText
};

export default geminiService;
