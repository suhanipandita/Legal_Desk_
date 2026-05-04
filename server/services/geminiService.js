const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getClient = () => {
  if (!genAI) {
    // Make sure to add GEMINI_API_KEY to your .env file
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Analyze a legal document using Gemini
 */
async function analyzeDocument(extractedText) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert legal AI assistant for Indian law.
Analyze this legal document and return EXACTLY this structure:

SUMMARY: [3-5 sentence plain-English overview]

PARTIES: [all named individuals and organizations]

KEY DATES: [every date and deadline in the document]

OBLIGATIONS: [what each party must do]

RISKY CLAUSES: [unusual, one-sided, or potentially harmful clauses]

MISSING TERMS: [standard clauses absent from this document]

Document:
${extractedText}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Chat with a document - answer questions based on document content
 */
async function chatWithDocument(documentText, conversationHistory, newQuestion) {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a legal AI assistant.
The user has uploaded a legal document. Answer questions accurately using ONLY the document's content. If the answer is not in the document, say so clearly.

Document:
${documentText}`,
  });

  // Map the conversation history to Gemini's expected format (role: 'user' | 'model')
  const formattedHistory = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: formattedHistory,
  });

  const result = await chat.sendMessage(newQuestion);
  return result.response.text();
}

/**
 * Summarize a legal search result
 */
async function summarizeLegalText(text) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert Indian law assistant. Summarize the following legal text in plain, easy-to-understand English. Highlight key rulings, relevant sections, and practical implications.

Text:
${text}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { analyzeDocument, chatWithDocument, summarizeLegalText };