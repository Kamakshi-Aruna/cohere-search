import UploadModal from './UploadModal';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    loading: boolean;
    handleSearch: () => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    showUploadModal: boolean;
    setShowUploadModal: (show: boolean) => void;
    uploadLoading: boolean;
    uploadedFiles: string[];
    deletingFile: string | null;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteFile: (filename: string) => void;
    messages: any[];
}

export default function SearchBar({
                                      query,
                                      setQuery,
                                      loading,
                                      handleSearch,
                                      handleKeyPress,
                                      showUploadModal,
                                      setShowUploadModal,
                                      uploadLoading,
                                      uploadedFiles,
                                      deletingFile,
                                      handleFileUpload,
                                      handleDeleteFile,
                                      messages,
                                  }: SearchBarProps) {
    const isEmptyState = messages.length === 0;

    return (
        <div className={`flex-shrink-0 p-4 ${!isEmptyState ? 'bg-gray-800/50 backdrop-blur-sm' : ''}`}>
            <div className="max-w-4xl mx-auto">
                <div className="relative">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about your uploaded PDF documents..."
                            className="w-full pl-4 pr-20 py-4 bg-gray-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-lg"
                            disabled={loading}
                        />

                        {/* Upload Button */}
                        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                            <button
                                onClick={() => setShowUploadModal(!showUploadModal)}
                                className="p-2 text-green-400 hover:text-green-300 transition-colors rounded-lg hover:bg-gray-600"
                                title="Upload PDF"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>

                            {/* Upload Modal */}
                            <UploadModal
                                showUploadModal={showUploadModal}
                                setShowUploadModal={setShowUploadModal}
                                uploadLoading={uploadLoading}
                                uploadedFiles={uploadedFiles}
                                deletingFile={deletingFile}
                                handleFileUpload={handleFileUpload}
                                handleDeleteFile={handleDeleteFile}
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Welcome Message - Only show when no messages */}
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-6">
                        <p className="mb-4">Upload PDFs and ask questions about the content</p>
                    </div>
                )}
            </div>
        </div>
    );
}