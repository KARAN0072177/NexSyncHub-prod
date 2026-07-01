const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { OpenAI } = require("openai");
const mongoose = require("mongoose");
const dns = require("dns");

// Explicitly set public DNS servers to resolve MongoDB SRV records bypassing local router blocks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Failed to set custom DNS servers:", e.message);
}

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Load environment variables
loadEnvConfig(path.join(__dirname, ".."));

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

const knowledgeDir = path.join(__dirname, "..", "knowledge");

// Dynamic Schema registration for vanilla Node environment execution
const KnowledgeChunk = mongoose.models.KnowledgeChunk || mongoose.model("KnowledgeChunk", new mongoose.Schema({
  chunkId: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  section: { type: String, required: true },
  heading: { type: String, required: true },
  category: { type: String, required: true },
  visibility: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
}, { timestamps: true }));

function getHeadingAtPosition(cleanText, startIndex) {
  const headings = [];
  const headingRegex = /^#+\s+(.*)$/gm;
  let match;
  
  while ((match = headingRegex.exec(cleanText)) !== null) {
    headings.push({
      raw: match[0].trim(), // e.g. "## 2. Stripe Checkout Flow"
      title: match[1].replace(/^\d+[\.\s]*/, "").trim(), // e.g. "Stripe Checkout Flow"
      index: match.index
    });
  }
  
  if (headings.length === 0) return { raw: "General", title: "General" };
  
  let activeHeading = headings[0];
  for (const heading of headings) {
    if (heading.index <= startIndex) {
      activeHeading = heading;
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

  // Determine visibility scope based on category (V1.5 future proofing)
  let visibility = "authenticated";
  if (category === "deployment") {
    visibility = "super_admin";
  } else if (category === "database") {
    visibility = "admin";
  }

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, cleanText.length);
    const chunkText = cleanText.substring(startIndex, endIndex);
    
    // Extract section heading metadata dynamically
    const headingInfo = getHeadingAtPosition(cleanText, startIndex);

    chunks.push({
      chunkId: `${source}#${chunkIndex}`,
      source: source,
      section: headingInfo.title,
      heading: headingInfo.raw,
      category: category,
      visibility: visibility,
      workspaceId: null,
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

    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      console.error("Error: MONGODB_URI is not defined.");
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

    // Connect to MongoDB Atlas
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(connUri);
    console.log("Connected to MongoDB.");

    // Sync database chunks
    console.log(`Synchronizing ${compiledStore.length} chunks in Atlas...`);
    for (const chunk of compiledStore) {
      await KnowledgeChunk.findOneAndUpdate(
        { chunkId: chunk.chunkId },
        {
          source: chunk.source,
          section: chunk.section,
          heading: chunk.heading,
          category: chunk.category,
          visibility: chunk.visibility,
          workspaceId: chunk.workspaceId,
          text: chunk.text,
          embedding: chunk.embedding,
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // Clean up obsolete database entries
    const activeChunkIds = compiledStore.map(c => c.chunkId);
    const deleteResult = await KnowledgeChunk.deleteMany({
      chunkId: { $nin: activeChunkIds }
    });
    console.log(`Pruned ${deleteResult.deletedCount} obsolete chunks from database.`);
    
    console.log("Vector database synchronization complete.");
    await mongoose.connection.close();

  } catch (error) {
    console.error("Embedding generation failed:", error);
    process.exit(1);
  }
}

main();
