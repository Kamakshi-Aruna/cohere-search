'use client';

import { useState, useEffect } from 'react';
import QuestionsSidebar from "@/app/components/QuestionsSidebarProps";
import Header from "@/app/components/Header";
import AnswersArea from "@/app/components/AnswersArea";
import SearchBar from "@/app/components/SearchBar";

interface Message {
    id: string;
    question: string;
    answer: string;
    timestamp: Date;
}

export default function Home() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    // Load uploaded files on component mount
    const loadUploadedFiles = async () => {
        try {
            const response = await fetch('/api/list-files');
            const data = await response.json();

            if (data.success) {
                setUploadedFiles(data.files);
            }
        } catch (err) {
            // Silently fail - it's okay if we can't load files
            console.error('Failed to load uploaded files:', err);
        }
    };

    // Load files when component mounts
    useEffect(() => {
        loadUploadedFiles();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        const newMessageId = Date.now().toString();
        const userQuestion = query.trim();

        console.log('🔍 [Frontend] Starting search for:', userQuestion);
        console.log('🆔 [Frontend] Message ID:', newMessageId);

        // Add user message immediately
        setMessages(prev => [...prev, {
            id: newMessageId,
            question: userQuestion,
            answer: '',
            timestamp: new Date()
        }]);

        setLoading(true);
        setError('');
        setQuery(''); // Clear input immediately

        const requestBody = {
            query: userQuestion,
            useEnhancedSearch: true,
            rerankingEnabled: true
        };

        console.log('📤 [Frontend] Sending request to /api/enhanced-search with body:', requestBody);
        console.time('🕐 [Frontend] Search request duration');

        try {
            const response = await fetch('/api/enhanced-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.timeEnd('🕐 [Frontend] Search request duration');
            console.log('📥 [Frontend] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                console.error('❌ [Frontend] HTTP error:', {
                    status: response.status,
                    statusText: response.statusText
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 [Frontend] Response data:', {
                success: data.success,
                hasAnswer: !!data.answer,
                answerLength: data.answer?.length || 0,
                sourcesCount: data.sources?.length || 0,
                searchMethod: data.searchMethod,
                rerankingApplied: data.rerankingApplied,
                hasError: !!data.error
            });

            if (data.success) {
                console.log('✅ [Frontend] Search successful, updating message with answer');
                // Update the message with the answer
                setMessages(prev => prev.map(msg =>
                    msg.id === newMessageId
                        ? { ...msg, answer: data.answer }
                        : msg
                ));
            } else {
                console.error('❌ [Frontend] Search failed:', data.error);
                setError(data.error || 'Search failed');
                // Remove the message if there was an error
                setMessages(prev => prev.filter(msg => msg.id !== newMessageId));
            }
        } catch (err) {
            console.error('❌ [Frontend] Network error during search:', err);
            setError('Failed to connect to search service');
            // Remove the message if there was an error
            setMessages(prev => prev.filter(msg => msg.id !== newMessageId));
        } finally {
            setLoading(false);
            console.log('🏁 [Frontend] Search process completed');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSearch();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }

        setUploadLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setUploadedFiles(prev => [...prev, file.name]);
                setError('');
                setShowUploadModal(false); // Close modal after successful upload
                // Reset file input
                e.target.value = '';
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Failed to upload PDF');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteFile = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) {
            return;
        }

        setDeletingFile(filename);
        setError('');

        try {
            const response = await fetch('/api/delete-pdf', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename }),
            });

            const data = await response.json();

            if (data.success) {
                setUploadedFiles(prev => prev.filter(f => f !== filename));
                alert(`Successfully deleted ${filename}`);
            } else {
                alert(`Error: ${data.error || 'Failed to delete file'}`);
            }
        } catch (err) {
            alert('Error: Failed to delete file');
        } finally {
            setDeletingFile(null);
        }
    };

    const handleEditQuestion = (messageId: string, currentQuestion: string) => {
        setEditingMessageId(messageId);
        setEditingText(currentQuestion);
    };

    const handleSaveEdit = async (messageId: string) => {
        if (!editingText.trim()) return;

        const editedQuestion = editingText.trim();

        // Update the question in the message
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, question: editedQuestion, answer: '', timestamp: new Date() }
                : msg
        ));

        // Clear edit state
        setEditingMessageId(null);
        setEditingText('');

        // Re-search with the edited question
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/enhanced-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: editedQuestion,
                    useEnhancedSearch: true,
                    rerankingEnabled: true
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update the message with the new answer
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, answer: data.answer }
                        : msg
                ));
            } else {
                setError(data.error || 'Search failed');
            }
        } catch (err) {
            setError('Failed to connect to search service');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    return (
        <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            {/* Questions Sidebar - Full Height */}
            <QuestionsSidebar
                messages={messages}
                editingMessageId={editingMessageId}
                editingText={editingText}
                setEditingText={setEditingText}
                onEditQuestion={handleEditQuestion}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {messages.length > 0 ? (
                    <>
                        <Header />
                        <AnswersArea
                            messages={messages}
                            editingMessageId={editingMessageId}
                            editingText={editingText}
                            setEditingText={setEditingText}
                            onEditQuestion={handleEditQuestion}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                        />

                        {/* Error Message */}
                        {error && (
                            <div className="flex-shrink-0 px-4 pb-2">
                                <div className="max-w-4xl mx-auto">
                                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                                        <p className="font-semibold">Error:</p>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <SearchBar
                            query={query}
                            setQuery={setQuery}
                            loading={loading}
                            handleSearch={handleSearch}
                            handleKeyPress={handleKeyPress}
                            showUploadModal={showUploadModal}
                            setShowUploadModal={setShowUploadModal}
                            uploadLoading={uploadLoading}
                            uploadedFiles={uploadedFiles}
                            deletingFile={deletingFile}
                            handleFileUpload={handleFileUpload}
                            handleDeleteFile={handleDeleteFile}
                            messages={messages}
                        />
                    </>
                ) : (
                    /* Centered Layout for No Messages */
                    <>
                        <Header />

                        {/* Centered Search Area */}
                        <div className="flex-1 flex items-center justify-center px-8">
                            {/* Error Message for Empty State */}
                            {error && (
                                <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
                                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                                        <p className="font-semibold">Error:</p>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="w-full max-w-4xl">
                                <SearchBar
                                    query={query}
                                    setQuery={setQuery}
                                    loading={loading}
                                    handleSearch={handleSearch}
                                    handleKeyPress={handleKeyPress}
                                    showUploadModal={showUploadModal}
                                    setShowUploadModal={setShowUploadModal}
                                    uploadLoading={uploadLoading}
                                    uploadedFiles={uploadedFiles}
                                    deletingFile={deletingFile}
                                    handleFileUpload={handleFileUpload}
                                    handleDeleteFile={handleDeleteFile}
                                    messages={messages}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}