import { QdrantClient } from "@qdrant/js-client-rest";

export async function getVectorStore() {
    // Configure client based on whether it's cloud or local
    const config: any = {
        url: process.env.QDRANT_URL || "http://localhost:6333",
    };

    // Add API key if provided (for Qdrant Cloud)
    if (process.env.QDRANT_API_KEY) {
        config.apiKey = process.env.QDRANT_API_KEY;
    }

    const client = new QdrantClient(config);

    const collectionName = process.env.QDRANT_COLLECTION || "pdf_documents_cohere";

    // Return a simplified object that the API route can use
    return {
        client,
        collectionName,
        type: 'qdrant',
        embeddingDimension: 1024 // Cohere embed-english-v3.0 dimension
    };
}