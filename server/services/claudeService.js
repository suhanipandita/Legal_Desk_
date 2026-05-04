const Anthropic = require('@anthropic-ai/sdk');

let client = null;

const getClient = () => {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

/**
 * Analyze a legal document using Claude AI
 * Returns structured analysis with summary, parties, dates, obligations, risks
 */
async function analyzeDocument(extractedText) {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert legal AI assistant for Indian law.
Analyze this legal document and return EXACTLY this structure:

SUMMARY: [3-5 sentence plain-English overview]

PARTIES: [all named individuals and organizations]

KEY DATES: [every date and deadline in the document]

OBLIGATIONS: [what each party must do]

RISKY CLAUSES: [unusual, one-sided, or potentially harmful clauses]

MISSING TERMS: [standard clauses absent from this document]

Document:
${extractedText}`,
      },
    ],
  });

  return message.content[0].text;
}

/**
 * Chat with a document - answer questions based on document content
 */
async function chatWithDocument(documentText, conversationHistory, newQuestion) {
  const anthropic = getClient();

  const systemPrompt = `You are a legal AI assistant.
The user has uploaded a legal document. Answer questions
accurately using ONLY the document's content. If the
answer is not in the document, say so clearly.

Document:
${documentText}`;

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: newQuestion },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

/**
 * Summarize a legal search result
 */
async function summarizeLegalText(text) {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert Indian law assistant. Summarize the following legal text in plain, easy-to-understand English. Highlight key rulings, relevant sections, and practical implications.

Text:
${text}`,
      },
    ],
  });

  return message.content[0].text;
}

module.exports = { analyzeDocument, chatWithDocument, summarizeLegalText };
