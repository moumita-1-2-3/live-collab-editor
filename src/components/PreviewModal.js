import React, { useState, useEffect } from 'react';
import './PreviewModal.css';

const PreviewModal = ({ 
    isOpen, 
    originalText, 
    aiSuggestion, 
    editType,
    isLoading,
    onConfirm, 
    onCancel,
    onCustomEdit 
}) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    useEffect(() => {
        if (isOpen && editType === 'custom') {
            setShowCustomInput(true);
        } else {
            setShowCustomInput(false);
            setCustomPrompt('');
        }
    }, [isOpen, editType]);

    const getEditTypeLabel = (type) => {
        const labels = {
            'shorten': '📉 Shortened',
            'lengthen': '📈 Lengthened',
            'improve': '✨ Improved',
            'formal': '🎩 Formalized',
            'casual': '😊 Made Casual',
            'table': '📊 Table Format',
            'list': '📋 List Format',
            'summarize': '📄 Summarized',
            'custom': '🎯 Custom Edit'
        };
        return labels[type] || '✏️ Edited';
    };

    const handleCustomEdit = () => {
        if (customPrompt.trim()) {
            onCustomEdit(customPrompt);
            setCustomPrompt('');
        }
    };

    const getDiffHighlight = (original, suggested) => {
        // Simple diff highlighting - in a real app, you'd use a proper diff library
        if (original === suggested) return { type: 'same', text: suggested };
        if (suggested.length < original.length) return { type: 'shortened', text: suggested };
        if (suggested.length > original.length) return { type: 'lengthened', text: suggested };
        return { type: 'modified', text: suggested };
    };

    const diff = aiSuggestion ? getDiffHighlight(originalText, aiSuggestion) : null;

    if (!isOpen) return null;

    return (
        <div className="preview-modal-overlay">
            <div className="preview-modal">
                <div className="modal-header">
                    <h3>
                        {getEditTypeLabel(editType)}
                    </h3>
                    <button className="modal-close" onClick={onCancel}>×</button>
                </div>

                <div className="modal-content">
                    {showCustomInput && (
                        <div className="custom-prompt-section">
                            <h4>How would you like to edit this text?</h4>
                            <div className="custom-input-group">
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g., 'Make it more professional', 'Add more details about...', 'Change the tone to be more friendly'"
                                    className="custom-prompt-input"
                                    rows={3}
                                />
                                <button 
                                    onClick={handleCustomEdit}
                                    disabled={!customPrompt.trim() || isLoading}
                                    className="generate-custom-btn"
                                >
                                    {isLoading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="text-comparison">
                        <div className="comparison-side original">
                            <h4>📝 Original Text</h4>
                            <div className="text-content original-text">
                                {originalText}
                            </div>
                            <div className="text-stats">
                                <span>Words: {originalText.split(/\s+/).filter(w => w.length > 0).length}</span>
                                <span>Characters: {originalText.length}</span>
                            </div>
                        </div>

                        <div className="comparison-divider">
                            <div className="arrow-right">→</div>
                        </div>

                        <div className="comparison-side suggestion">
                            <h4>🤖 AI Suggestion</h4>
                            {isLoading ? (
                                <div className="loading-suggestion">
                                    <div className="loading-spinner"></div>
                                    <p>AI is working on your text...</p>
                                </div>
                            ) : aiSuggestion ? (
                                <>
                                    <div className={`text-content suggestion-text ${diff?.type}`}>
                                        {aiSuggestion}
                                    </div>
                                    <div className="text-stats">
                                        <span>Words: {aiSuggestion.split(/\s+/).filter(w => w.length > 0).length}</span>
                                        <span>Characters: {aiSuggestion.length}</span>
                                        <span className={`change-indicator ${diff?.type}`}>
                                            {diff?.type === 'shortened' && '📉 Shortened'}
                                            {diff?.type === 'lengthened' && '📈 Expanded'}
                                            {diff?.type === 'modified' && '✏️ Modified'}
                                            {diff?.type === 'same' && '✅ Same'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="no-suggestion">
                                    <p>Click Generate to see AI suggestion</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {aiSuggestion && !isLoading && (
                        <div className="suggestion-actions">
                            <div className="action-buttons">
                                <button 
                                    className="cancel-btn"
                                    onClick={onCancel}
                                >
                                    ❌ Cancel
                                </button>
                                <button 
                                    className="confirm-btn"
                                    onClick={onConfirm}
                                >
                                    ✅ Replace Original
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {aiSuggestion && (
                    <div className="modal-footer">
                        <p className="tip">
                            💡 Tip: You can always undo changes using Ctrl+Z
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreviewModal;
