const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { OpenAI } = require("openai");

// Load environment variables
loadEnvConfig(path.join(__dirname, ".."));

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

const knowledgeDir = path.join(__dirname, "..", "knowledge");
const cacheDir = path.join(__dirname, "..", "cache");
const cacheFile = path.join(cacheDir, "knowledge-embeddings.json");

function getHeadingAtPosition(cleanText, startIndex) {
  // Find all headings and their indices in the text
  const headings = [];
  const headingRegex = /^#+\s+(.*)$/gm;
  let match;
  
  while ((match = headingRegex.exec(cleanText)) !== null) {
    headings.push({
      title: match[1].replace(/^\d+[\.\s]*/, "").trim(), // clean "1. Introduction" -> "Introduction"
      index: match.index
    });
  }
  
  if (headings.length === 0) return "General";
  
  // Find the latest heading that starts before or at startIndex
  let activeHeading = headings[0].title;
  for (const heading of headings) {
    if (heading.index <= startIndex) {
      activeHeading = heading.title;
    } else {
      break;
    }
  }
  
  return activeHeading;
}

function chunkText(text, source) {
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  const cleanText = text.replace(/\r\n/g, "\n");
  const category = path.basename(source, ".md");

  // Determine visibility based on category
  let visibility = "all";
  if (category === "deployment") {
    visibility = "super_admin";
  } else if (category === "database") {
    visibility = "admin";
  }

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, cleanText.length);
    const chunkText = cleanText.substring(startIndex, endIndex);
    
    // Extract section name dynamically
    const section = getHeadingAtPosition(cleanText, startIndex);

    chunks.push({
      id: `${source}#${chunkIndex}`,
      source: source,
      section: section,
      category: category,
      visibility: visibility,
      text: chunkText,
      chunkIndex: chunkIndex++
    });

    if (endIndex === cleanText.length) {
      break;
    }

    startIndex += (CHUNK_SIZE - CHUNK_OVERLAP);
  }

  return chunks;
}

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY is not defined.");
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
      console.log("No markdown files found.");
      process.exit(0);
    }

    const allChunks = [];
    mdFiles.forEach(file => {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const chunks = chunkText(content, file);
      allChunks.push(...chunks);
    });

    console.log(`Loaded ${allChunks.length} chunks. Generating embeddings...`);

    const batchSize = 50;
    const embeddings = [];

    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allChunks.length / batchSize)}...`);
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: batch.map(c => c.text),
      });
      embeddings.push(...response.data.map(item => item.embedding));
    }

    // Attach embeddings to the chunk metadata objects
    const compiledStore = allChunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cacheFile, JSON.stringify(compiledStore, null, 2), "utf8");
    console.log(`Successfully generated and cached ${compiledStore.length} embeddings at: ${cacheFile}`);

  } catch (error) {
    console.error("Embedding generation failed:", error);
    process.exit(1);
  }
}

main();
