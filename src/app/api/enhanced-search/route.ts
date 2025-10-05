import { NextRequest, NextResponse } from "next/server";
import {
    generateAnswer,
    getCohereApiKeyStatus,
    rerankResults
} from "@/app/lib/cohereService";
import documentStore from "@/app/lib/documentStore";
import { CohereClient } from "cohere-ai";

export async function POST(request: NextRequest) {
    try {
        const { query, useEnhancedSearch = true, rerankingEnabled = true } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        // Validate Cohere API key
        const keyStatus = getCohereApiKeyStatus();
        if (!keyStatus.isValid) {
            return NextResponse.json(
                {
                    error: "Cohere API key validation failed",
                    details: keyStatus.error,
                    suggestion: "Please check your COHERE_API_KEY environment variable."
                },
                { status: 500 }
            );
        }

        // Check if we have any documents
        if (!documentStore.hasDocuments()) {
            return NextResponse.json({
                success: true,
                answer: "No documents have been uploaded yet. Please upload some PDF documents first.",
                query: query,
            });
        }

        // Get all document chunks
        const allChunks = documentStore.getAllDocuments();

        // Prepare documents for Cohere rerank
        const documents = allChunks.map(chunk => chunk.text);

        let searchResults: any[] = [];
        let queryExpansion = null;

        if (!process.env.COHERE_API_KEY) {
            throw new Error("COHERE_API_KEY is not configured");
        }

        const cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });

        try {
            if (useEnhancedSearch && rerankingEnabled && documents.length > 0) {
                // Use Cohere's rerank API directly for semantic search
                const rerankResponse = await cohere.rerank({
                    model: 'rerank-english-v3.0',
                    query: query,
                    documents: documents,
                    topN: Math.min(10, documents.length),
                    returnDocuments: true
                });

                searchResults = rerankResponse.results.map((result: any) => {
                    const originalChunk = allChunks[result.index];
                    return {
                        payload: {
                            text: result.document.text,
                            source: originalChunk.source,
                            chunk_index: originalChunk.chunk_index,
                            type: originalChunk.type
                        },
                        score: result.relevanceScore,
                        rerankedScore: result.relevanceScore
                    };
                });
            } else {
                // Basic search: return all documents (no filtering)
                // In a real app, you might want to implement basic keyword matching
                searchResults = allChunks.slice(0, 10).map(chunk => ({
                    payload: {
                        text: chunk.text,
                        source: chunk.source,
                        chunk_index: chunk.chunk_index,
                        type: chunk.type
                    },
                    score: 0.5 // Default score for basic search
                }));
            }
        } catch (searchError) {
            console.error("Search error:", searchError);
            // Fallback to basic search
            searchResults = allChunks.slice(0, 5).map(chunk => ({
                payload: {
                    text: chunk.text,
                    source: chunk.source,
                    chunk_index: chunk.chunk_index,
                    type: chunk.type
                },
                score: 0.5
            }));
        }

        if (!searchResults || searchResults.length === 0) {
            return NextResponse.json({
                success: true,
                answer: "I couldn't find any relevant information for your query.",
                query: query,
                queryExpansion: queryExpansion,
            });
        }

        const sources = searchResults.map((result: any) => ({
            text: result.payload?.text || "",
            source: result.payload?.source || "unknown",
            chunk_index: result.payload?.chunk_index || 0,
            score: result.rerankedScore || result.score || 0,
            originalScore: result.originalScore || result.score || 0
        })).filter((item: any) => item.text.length > 0);

        const relevantTexts = sources.slice(0, 5).map(s => s.text).join("\n\n---\n\n");

        // Generate answer using Cohere
        let answer;
        try {
            answer = await generateAnswer(
                query,
                relevantTexts,
                queryExpansion?.expandedQueries
            );
        } catch (answerError) {
            console.error("Answer generation failed:", answerError);
            answer = "I found relevant information but couldn't generate a complete answer. Here are the most relevant excerpts:\n\n" +
                     sources.slice(0, 3).map(s => `• ${s.text.substring(0, 150)}...`).join('\n');
        }

        return NextResponse.json({
            success: true,
            answer: answer,
            query: query,
            queryExpansion: queryExpansion,
            sources: sources.map(s => ({
                file: s.source,
                chunk: s.chunk_index,
                score: s.score,
                originalScore: s.originalScore,
                preview: s.text.substring(0, 150) + "..."
            })),
            searchMethod: useEnhancedSearch ? "enhanced" : "basic",
            rerankingApplied: useEnhancedSearch && rerankingEnabled,
            aiProvider: "Cohere"
        });

    } catch (error) {
        console.error("Enhanced search error:", error);
        return NextResponse.json(
            {
                error: "Search failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}