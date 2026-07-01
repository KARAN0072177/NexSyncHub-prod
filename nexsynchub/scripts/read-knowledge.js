const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { OpenAI } = require("openai");

// Load environment variables from nexsynchub root
loadEnvConfig(path.join(__dirname, ".."));

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

const knowledgeDir = path.join(__dirname, "..", "knowledge");

function chunkText(text, source, chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP) {
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  // Normalize line endings and double spaces to make chunks clean
  const cleanText = text.replace(/\r\n/g, "\n");

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);
    const chunkText = cleanText.substring(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      source: source,
      chunkIndex: chunkIndex++
    });

    if (endIndex === cleanText.length) {
      break;
    }

    startIndex += (chunkSize - chunkOverlap);
  }

  return chunks;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function answerQuestion(question, vectorStore, openai) {
  // Generate question embedding
  const queryResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: question,
  });
  const questionEmbedding = queryResponse.data[0].embedding;

  // Calculate similarity scores
  const scoredChunks = vectorStore.map(item => {
    const score = cosineSimilarity(questionEmbedding, item.embedding);
    return {
      chunk: item.chunk,
      score,
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  const topMatches = scoredChunks.slice(0, 3);

  // Build Context
  const context = topMatches
    .map(
      (match) =>
        `Source: ${match.chunk.source}#${match.chunk.chunkIndex}\n\n${match.chunk.text}`
    )
    .join("\n\n---\n\n");

  // System Prompt
  const systemPrompt = `You are the official AI assistant for NexSyncHub.

Rules:

1. Answer ONLY using the provided context.
2. If the answer is not present, say:
   "I don't know based on the available documentation."
3. Mention source files when appropriate.
4. Do not invent implementation details.`;

  // User Prompt
  const userPrompt = `Context:\n\n${context}\n\nQuestion:\n\n${question}`;

  // Call OpenAI completion
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0,
  });

  const answer = completion.choices[0].message.content.trim();

  // Print expected output
  console.log("Question:");
  console.log(`${question}\n`);
  console.log("Answer:");
  console.log(`${answer}\n`);

  if (!answer.includes("I don't know based on the available documentation")) {
    console.log("Sources:\n");
    // Only print unique sources that were retrieved
    const uniqueSources = Array.from(new Set(topMatches.map(m => `${m.chunk.source}#${m.chunk.chunkIndex}`)));
    uniqueSources.forEach(src => console.log(src));
    console.log("");
  }
  console.log("-".repeat(80) + "\n");
}

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY environment variable is not defined.");
      console.error("Please add it to your .env.local file in the nexsynchub folder.");
      process.exit(1);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!fs.existsSync(knowledgeDir)) {
      console.error(`Knowledge directory does not exist at: ${knowledgeDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(knowledgeDir);
    const mdFiles = files.filter(file => path.extname(file) === ".md");

    if (mdFiles.length === 0) {
      console.log("No markdown files found in the knowledge directory.");
      process.exit(0);
    }

    const allChunks = [];

    mdFiles.forEach(file => {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const chunks = chunkText(content, file);
      allChunks.push(...chunks);
    });

    console.log(`Generated embeddings for ${allChunks.length} chunks...\n`);

    // Generate embeddings in batches of 50 to avoid API rate/size limits
    const batchSize = 50;
    const embeddings = [];

    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: batch.map(c => c.text),
      });
      embeddings.push(...response.data.map(item => item.embedding));
    }

    // Store chunks and embeddings in-memory
    const vectorStore = allChunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index],
    }));

    // Question 1: How is task deep linking implemented?
    await answerQuestion("How is task deep linking implemented?", vectorStore, openai);

    // Question 2: What is the capital of Japan?
    await answerQuestion("What is the capital of Japan?", vectorStore, openai);

  } catch (error) {
    console.error("An error occurred during chunking or embeddings generation:", error);
    process.exit(1);
  }
}

main();
