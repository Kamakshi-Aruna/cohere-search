import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || "",
});

function validateCohereApiKey(): { isValid: boolean; error?: string } {
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
        return { isValid: false, error: "COHERE_API_KEY environment variable is not set" };
    }

    if (apiKey.length < 10) {
        return { isValid: false, error: "COHERE_API_KEY appears to be too short" };
    }

    if (!apiKey.match(/^[a-zA-Z0-9_-]+$/)) {
        return { isValid: false, error: "COHERE_API_KEY contains invalid characters" };
    }

    return { isValid: true };
}


export function getCohereApiKeyStatus() {
    return validateCohereApiKey();
}

export interface QueryExpansion {
    originalQuery: string;
    expandedQueries: string[];
    searchContext: string;
}

export async function expandQueryWithCohere(
    query: string
): Promise<QueryExpansion> {
    const expansionPrompt = `Given the search query: "${query}"

Generate related terms, synonyms, and associated concepts that would help find relevant candidates or information in CVs/resumes.

Output ONLY a comma-separated list of related terms (maximum 10 terms):`;

    try {
        const response = await cohere.chat({
            message: expansionPrompt,
            model: "command-r-08-2024",
            maxTokens: 150,
            temperature: 0.3,
        });

        const generatedText = response.text.trim();
        const expandedTerms = generatedText
            .split(',')
            .map(term => term.trim())
            .filter(term => term.length > 0 && term.length < 50)
            .slice(0, 10);

        const uniqueTerms = [...new Set([query, ...expandedTerms])];

        return {
            originalQuery: query,
            expandedQueries: uniqueTerms,
            searchContext: createSearchContext(query, uniqueTerms)
        };
    } catch (error) {
        // Return only original query if Cohere fails
        return {
            originalQuery: query,
            expandedQueries: [query],
            searchContext: createSearchContext(query, [query])
        };
    }
}


function createSearchContext(originalQuery: string, expandedTerms: string[]): string {
    return `${originalQuery} ${expandedTerms.join(" ")}`;
}

export async function generateCohereEmbeddings(
    texts: string[],
    inputType: "search_document" | "search_query" = "search_query"
): Promise<number[][]> {
    try {
        const response = await cohere.embed({
            texts: texts,
            model: "embed-english-v3.0",
            inputType: inputType,
            truncate: "END"
        });

        return response.embeddings as number[][];
    } catch (error) {
        return [];
    }
}

export async function generateSingleEmbedding(
    text: string,
    inputType: "search_document" | "search_query" = "search_query"
): Promise<number[]> {
    const embeddings = await generateCohereEmbeddings([text], inputType);
    return embeddings[0] || [];
}

export function combineEmbeddings(embeddings: number[][], weights?: number[]): number[] {
    if (embeddings.length === 0) return [];

    const dimension = embeddings[0].length;
    const combined = new Array(dimension).fill(0);
    const finalWeights = weights || new Array(embeddings.length).fill(1.0 / embeddings.length);

    for (let i = 0; i < embeddings.length; i++) {
        const weight = finalWeights[i];
        for (let j = 0; j < dimension; j++) {
            combined[j] += embeddings[i][j] * weight;
        }
    }

    const magnitude = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < dimension; i++) {
            combined[i] /= magnitude;
        }
    }

    return combined;
}

export async function semanticSearchWithExpansion(
    query: string,
    client: any,
    collectionName: string,
    topK: number = 10
) {
    const queryEmbedding = await generateSingleEmbedding(query, "search_query");
    let results: any[] = [];
    const seenIds = new Set<number>();

    if (queryEmbedding.length > 0) {
        const searchResult = await client.search(collectionName, {
            vector: queryEmbedding,
            limit: topK * 2,
            with_payload: true,
            score_threshold: 0.0,
        });

        for (const result of searchResult) {
            if (!seenIds.has(result.id)) {
                seenIds.add(result.id);
                results.push(result);
            }
        }
    }

    const goodResults = results.filter(r => r.score > 0.3);

    if (goodResults.length < 5) {
        const expansion = await expandQueryWithCohere(query);
        const expandedEmbeddings = await generateCohereEmbeddings(
            expansion.expandedQueries.slice(0, 3),
            "search_query"
        );

        for (const embedding of expandedEmbeddings) {
            if (embedding.length === 0) continue;

            const searchResult = await client.search(collectionName, {
                vector: embedding,
                limit: topK,
                with_payload: true,
                score_threshold: 0.0,
            });

            for (const result of searchResult) {
                if (!seenIds.has(result.id)) {
                    seenIds.add(result.id);
                    results.push(result);
                }
            }
        }

        results.sort((a, b) => b.score - a.score);

        return {
            results: results.slice(0, topK),
            expansion: expansion,
            totalFound: results.length
        };
    }

    return {
        results: results.slice(0, topK),
        expansion: {
            originalQuery: query,
            expandedQueries: [query],
            searchContext: query
        },
        totalFound: results.length
    };
}

export async function rerankWithCohere(
    documents: string[],
    query: string,
    topK?: number
): Promise<{ index: number; relevanceScore: number }[]> {
    try {
        if (documents.length === 0) return [];

        const response = await cohere.rerank({
            query: query,
            documents: documents,
            model: "rerank-english-v3.0",
            topN: topK || documents.length,
        });

        return response.results.map(result => ({
            index: result.index,
            relevanceScore: result.relevanceScore,
        }));
    } catch (error) {
        return documents.map((_, index) => ({
            index,
            relevanceScore: 0.5
        }));
    }
}

export async function rerankResults(
    results: any[],
    query: string
): Promise<any[]> {
    if (results.length === 0) return results;

    const documents = results.map(r => {
        const text = r.payload?.text || '';
        const source = r.payload?.source || '';
        return `Source: ${source}\n\n${text.substring(0, 1000)}`;
    });

    const rerankScores = await rerankWithCohere(documents, query);

    const rerankedResults = results.map((result, index) => {
        const rerankScore = rerankScores.find(s => s.index === index);
        const newScore = rerankScore ? rerankScore.relevanceScore : result.score;
        return {
            ...result,
            rerankedScore: newScore,
            originalScore: result.score
        };
    });

    rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore);
    return rerankedResults;
}

export async function generateAnswer(
    query: string, context: string, expandedQueries: string[] | undefined): Promise<string> {
    const prompt = `Context from documents:
${context}

Question: ${query}

Answer:`;

    try {
        const response = await cohere.chat({
            message: prompt,
            model: "command-r-08-2024",
            maxTokens: 500,
            temperature: 0.1,
        });

        const answer = response.text.trim();
        return answer || "I couldn't generate an answer based on the provided context.";
    } catch (error) {
        return "I couldn't generate an answer. Please ensure Cohere API is available.";
    }
}
