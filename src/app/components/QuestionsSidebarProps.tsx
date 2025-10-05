interface Message {
    id: string;
    question: string;
    answer: string;
    timestamp: Date;
}

interface QuestionsSidebarProps {
    messages: Message[];
    editingMessageId?: string | null;
    editingText?: string;
    setEditingText?: (text: string) => void;
    onEditQuestion?: (messageId: string, currentQuestion: string) => void;
    onSaveEdit?: (messageId: string) => void;
    onCancelEdit?: () => void;
}

export default function QuestionsSidebar({
                                             messages,
                                             editingMessageId,
                                             editingText,
                                             setEditingText,
                                             onEditQuestion,
                                             onSaveEdit,
                                             onCancelEdit
                                         }: QuestionsSidebarProps) {
    const handleQuestionClick = (messageId: string) => {
        const answerElement = document.getElementById(`answer-${messageId}`);
        if (answerElement) {
            answerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="w-80 bg-gray-900/50 border-r border-gray-700 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((message, index) => (
                    <div
                        key={message.id}
                        className={`w-full p-3 rounded-lg border transition-all ${
                            index === messages.length - 1
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                                : 'bg-gray-800/50 border-gray-600/50 text-gray-300'
                        }`}
                    >
                        {editingMessageId === message.id ? (
                            /* Edit Mode */
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                                        {index + 1}
                                    </div>
                                    <span className="text-xs text-gray-400">Editing question:</span>
                                </div>
                                <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText?.(e.target.value)}
                                    className="w-full p-2 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    rows={3}
                                    placeholder="Edit your question..."
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onSaveEdit?.(message.id)}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={onCancelEdit}
                                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Display Mode */
                            <div className="group">
                                <button
                                    onClick={() => handleQuestionClick(message.id)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium mt-0.5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <p className="text-sm font-medium line-clamp-2 flex-1">{message.question}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditQuestion?.(message.id, message.question);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-gray-400 hover:text-blue-400 transition-all flex-shrink-0"
                                                    title="Edit question"
                                                >
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}