import { NextResponse } from "next/server";
    import documentStore from "@/app/lib/documentStore";

export async function GET() {
    try {
        // Get list of files from document store
        const files = documentStore.listFiles();

        return NextResponse.json({
            success: true,
            files: files,
        });

    } catch (error: any) {
        console.error("List files error:", error);
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