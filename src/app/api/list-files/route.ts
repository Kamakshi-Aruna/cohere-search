import { NextResponse } from "next/server";
import {getVectorStore} from "@/app/lib/vectorStore";

export async function GET() {
    try {
        // Get vector store config
        const { client, collectionName } = await getVectorStore();

        // Check if collection exists
        try {
            await client.getCollection(collectionName);
        } catch (error) {
            return NextResponse.json({
                success: true,
                files: [],
            });
        }

        // Get all points from the collection to find unique source files
        const scrollResult = await client.scroll(collectionName, {
            limit: 1000, // Adjust if you have many files
            with_payload: true,
            with_vector: false
        });

        if (!scrollResult.points || scrollResult.points.length === 0) {
            return NextResponse.json({
                success: true,
                files: [],
            });
        }

        // Extract unique filenames from the points
        const uniqueFiles = new Set<string>();

        scrollResult.points.forEach((point: any) => {
            if (point.payload?.source && point.payload?.type === "pdf") {
                uniqueFiles.add(point.payload.source);
            }
        });

        // Convert Set to Array
        const files = Array.from(uniqueFiles).sort();

        return NextResponse.json({
            success: true,
            files: files,
        });

    } catch (error: any) {
        console.error("❌ List files error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to list files",
                details: error.message
            },
            { status: 500 }
        );
    }
}