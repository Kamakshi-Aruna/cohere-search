interface UploadModalProps {
    showUploadModal: boolean;
    setShowUploadModal: (show: boolean) => void;
    uploadLoading: boolean;
    uploadedFiles: string[];
    deletingFile: string | null;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteFile: (filename: string) => void;
}

export default function UploadModal({
                                        showUploadModal,
                                        setShowUploadModal,
                                        uploadLoading,
                                        uploadedFiles,
                                        deletingFile,
                                        handleFileUpload,
                                        handleDeleteFile,
                                    }: UploadModalProps) {
    if (!showUploadModal) {
        return null;
    }

    return (
        <div className="absolute right-0 bottom-full mb-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">📄 Upload PDF</h3>
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-700 transition-all"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Upload Area */}
                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-500 transition-colors mb-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-2 bg-green-600/20 rounded-full">
                            <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">Drop PDF files here</p>
                            <p className="text-gray-400 text-xs">or click to browse</p>
                        </div>
                    </div>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploadLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                </div>

                {/* Upload Status */}
                {uploadLoading && (
                    <div className="mb-4 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-green-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-green-400 text-sm font-medium">Processing PDF...</span>
                        </div>
                    </div>
                )}

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-300 mb-2">Documents ({uploadedFiles.length})</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {uploadedFiles.map((filename, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-gray-600/50 group"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1 bg-red-600/20 rounded">
                                            <svg className="h-3 w-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-200 text-xs font-medium truncate">{filename}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFile(filename)}
                                        disabled={deletingFile === filename}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                                        title="Delete file"
                                    >
                                        {deletingFile === filename ? (
                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Text */}
                <p className="text-xs text-gray-500 text-center">
                    Upload PDFs to build your searchable library
                </p>
            </div>
        </div>
    );
}