import fs from 'fs';
import path from 'path';

interface DocumentChunk {
    id: string;
    text: string;
    source: string;
    type: string;
    chunk_index: number;
    total_chunks: number;
}

interface StorageData {
    documents: Record<string, DocumentChunk[]>;
    idCounter: number;
}

class DocumentStore {
    private documents: Map<string, DocumentChunk[]> = new Map();
    private idCounter: number = 1000;
    private storageFile: string;

    constructor() {
        // Store data in a data directory
        const dataDir = path.join(process.cwd(), 'data');
        this.storageFile = path.join(dataDir, 'documents.json');

        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.loadFromFile();
    }

    private loadFromFile(): void {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, 'utf8');
                const parsed: StorageData = JSON.parse(data);

                // Convert plain object back to Map
                this.documents = new Map(Object.entries(parsed.documents));
                this.idCounter = parsed.idCounter || 1000;
            }
        } catch (error) {
            console.error('Error loading documents from file:', error);
        }
    }

    private saveToFile(): void {
        try {
            const data: StorageData = {
                documents: Object.fromEntries(this.documents),
                idCounter: this.idCounter
            };

            fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving documents to file:', error);
        }
    }

    addDocument(filename: string, chunks: string[]): void {
        const documentChunks: DocumentChunk[] = [];

        for (let i = 0; i < chunks.length; i++) {
            documentChunks.push({
                id: `${this.idCounter++}`,
                text: chunks[i],
                source: filename,
                type: "pdf",
                chunk_index: i,
                total_chunks: chunks.length
            });
        }

        this.documents.set(filename, documentChunks);
        this.saveToFile();
    }

    getAllDocuments(): DocumentChunk[] {
        const allChunks: DocumentChunk[] = [];
        this.documents.forEach(chunks => {
            allChunks.push(...chunks);
        });
        return allChunks;
    }

    getDocument(filename: string): DocumentChunk[] | undefined {
        return this.documents.get(filename);
    }

    deleteDocument(filename: string): boolean {
        const deleted = this.documents.delete(filename);
        if (deleted) {
            this.saveToFile();
        }
        return deleted;
    }

    listFiles(): string[] {
        return Array.from(this.documents.keys());
    }

    hasDocuments(): boolean {
        return this.documents.size > 0;
    }

    clear(): void {
        this.documents.clear();
        this.idCounter = 1000;
        this.saveToFile();
    }
}

// Create a singleton instance
const documentStore = new DocumentStore();

export default documentStore;