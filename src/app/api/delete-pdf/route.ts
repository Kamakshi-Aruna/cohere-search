import { NextRequest, NextResponse } from "next/server";
import documentStore from "@/app/lib/documentStore";

export async function DELETE(request: NextRequest) {
    try {
        const { filename } = await request.json();

        if (!filename) {
            return NextResponse.json(
                { error: "Filename is required" },
                { status: 400 }
            );
        }

        // Check if file exists in document store
        const documentChunks = documentStore.getDocument(filename);

        if (!documentChunks) {
            return NextResponse.json({
                success: false,
                error: "File not found in database",
                filename: filename
            });
        }

        // Delete document from store
        const deleted = documentStore.deleteDocument(filename);

        if (deleted) {
            return NextResponse.json({
                success: true,
                message: `Deleted ${documentChunks.length} chunks for ${filename}`,
                deletedCount: documentChunks.length
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to delete file",
                filename: filename
            });
        }

    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json(
            {
                error: "Failed to delete PDF",
                details: error.message
            },
            { status: 500 }
        );
    }
}