import { NextRequest, NextResponse } from "next/server";
import {getVectorStore} from "@/app/lib/vectorStore";

export async function DELETE(request: NextRequest) {
    try {
        const { filename } = await request.json();

        if (!filename) {
            return NextResponse.json(
                { error: "Filename is required" },
                { status: 400 }
            );
        }

        // Get vector store config
        const { client, collectionName } = await getVectorStore();

        // Check if collection exists
        try {
            await client.getCollection(collectionName);
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: "No collection found",
            });
        }

        // Search for all points with this filename
        const scrollResult = await client.scroll(collectionName, {
            filter: {
                must: [
                    {
                        key: "source",
                        match: {
                            value: filename
                        }
                    }
                ]
            },
            limit: 1000, // Max number of chunks per file
            with_payload: false,
            with_vector: false
        });

        if (scrollResult.points && scrollResult.points.length > 0) {
            // Extract point IDs
            const pointIds = scrollResult.points.map((point: any) => point.id);

            // Delete all points for this file
            await client.delete(collectionName, {
                points: pointIds
            });

            return NextResponse.json({
                success: true,
                message: `Deleted ${pointIds.length} chunks for ${filename}`,
                deletedCount: pointIds.length
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "File not found in database",
                filename: filename
            });
        }

    } catch (error: any) {
        console.error("❌ Delete error:", error);
        return NextResponse.json(
            {
                error: "Failed to delete PDF",
                details: error.message
            },
            { status: 500 }
        );
    }
}