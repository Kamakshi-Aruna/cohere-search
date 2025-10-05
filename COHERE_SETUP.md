# Cohere Integration Setup Guide

## Overview
This project now uses Cohere AI for embeddings, search expansion, and reranking instead of Ollama. Cohere provides cloud-based AI services that are more powerful and don't require local model installation.

## Prerequisites
1. **Qdrant Vector Database** running locally on port 6333
2. **Cohere API Key** (free tier available)

## Getting Your Cohere API Key

1. Go to [https://dashboard.cohere.com/welcome/register](https://dashboard.cohere.com/welcome/register)
2. Sign up with Google, GitHub, or email
3. Once logged in, go to [https://dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys)
4. Click "Create Trial Key" or "+ New Key"
5. Name your key (e.g., "PDF Search Project")
6. Copy the API key

## Configuration

1. Open `.env.local` file
2. Replace `your-cohere-api-key-here` with your actual Cohere API key:
```
COHERE_API_KEY=your-actual-cohere-api-key
```

## Features Using Cohere

### 1. **Embeddings** (embed-english-v3.0)
- Converts text into 1024-dimensional vectors
- Used for both document indexing and query processing
- More accurate than local models

### 2. **Query Expansion** (Command model)
- Automatically expands search queries with related terms
- Example: "mobile developer" → includes iOS, Android, Swift, Kotlin, React Native

### 3. **Reranking** (rerank-english-v3.0)
- Re-orders search results by relevance
- Improves accuracy of top results
- Uses advanced cross-encoder architecture

### 4. **Answer Generation** (Command model)
- Generates comprehensive answers from retrieved documents
- Context-aware responses
- Considers expanded query terms

## How It Works

1. **Document Upload**:
    - PDF is parsed and split into chunks
    - Each chunk is embedded using Cohere's embed-english-v3.0
    - Embeddings are stored in Qdrant vector database

2. **Search Process**:
    - Query is expanded with related terms using Command model
    - Multiple embeddings are generated for expanded queries
    - Vector search retrieves relevant chunks from Qdrant
    - Results are reranked using Cohere's reranker
    - Final answer is generated using Command model

## API Limits (Free Tier)

- **Embed**: 1000 API calls/month
- **Generate**: 1000 API calls/month
- **Rerank**: 1000 API calls/month
- **Rate Limits**: 10 requests/minute

## Running the Application

1. Start Qdrant:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Differences from Ollama Implementation

| Feature | Ollama (Previous) | Cohere (Current) |
|---------|------------------|------------------|
| Location | Local | Cloud |
| Setup | Install models locally | Just API key |
| Embedding Dimension | 4096 | 1024 |
| Speed | Depends on hardware | Consistent cloud performance |
| Query Expansion | Basic LLM prompting | Optimized generation |
| Reranking | LLM-based scoring | Dedicated reranker model |
| Cost | Free (local resources) | Free tier then paid |

## Troubleshooting

1. **"Cohere API key is not configured"**
    - Make sure COHERE_API_KEY is set in .env.local
    - Restart the development server after adding the key

2. **"Failed to generate embeddings"**
    - Check your API key is valid
    - Verify you haven't exceeded rate limits
    - Check internet connection

3. **Vector dimension mismatch**
    - If you had documents indexed with Ollama, create a new collection
    - The new collection name is `pdf_documents_cohere`

## Cost Optimization Tips

1. Cache embeddings for frequently searched queries
2. Batch document uploads to minimize API calls
3. Use basic search for simple queries (skips expansion/reranking)
4. Monitor usage in Cohere dashboard