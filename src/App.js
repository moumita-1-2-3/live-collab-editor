import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSidebar';
import FloatingToolbar from './components/FloatingToolbar';
import PreviewModal from './components/PreviewModal';
import TiptapEditor from './components/TiptapEditor';
import aiService from './services/aiService';
import './App.css';

function App() {
    const [document, setDocument] = useState("");
    const [documentText, setDocumentText] = useState("");
    const [socket, setSocket] = useState(null);
    
    // Floating toolbar states
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState(null);
    
    // Preview modal states
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [originalText, setOriginalText] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [currentEditType, setCurrentEditType] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const editorRef = useRef(null);

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:5000');
        setSocket(newSocket);

        newSocket.onopen = () => {
            console.log('WebSocket connection established');
        };

        newSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'init') {
                    setDocument(message.data);
                } else if (message.type === 'update') {
                    setDocument(message.data);
                } else if (message.type === 'chat') {
                    // Handle chat messages if needed
                    console.log('Chat message received:', message);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        newSocket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        newSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            newSocket.close();
        };
    }, []);

    const handleEditorChange = (html, text) => {
        setDocumentText(text);
        updateDocument(html);
    };

    const handleEditorSelection = (selection) => {
        if (selection && selection.text.trim() && selection.text.length > 3) {
            setSelectedText(selection.text);
            setSelectionRange({
                from: selection.range.from,
                to: selection.range.to
            });
            
            setToolbarPosition({
                x: Math.min(selection.position.x, window.innerWidth - 320),
                y: Math.max(selection.position.y, 60)
            });
            setToolbarVisible(true);
        } else {
            hideFloatingToolbar();
        }
    };

    const updateDocument = (newContent) => {
        setDocument(newContent);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'update', data: newContent }));
        }
    };

    const handleDocumentUpdate = (newContent) => {
        updateDocument(newContent);
    };


    const hideFloatingToolbar = () => {
        setToolbarVisible(false);
        setSelectedText('');
        setSelectionRange(null);
    };

    // Handle AI text editing
    const handleEditWithAI = async (editType, text) => {
        setCurrentEditType(editType);
        setOriginalText(text);
        setAiSuggestion('');
        setPreviewModalOpen(true);
        
        if (editType !== 'custom') {
            setIsAiLoading(true);
            try {
                const result = await aiService.getTextEdit(editType, text);
                setAiSuggestion(result.editedText);
            } catch (error) {
                console.error('Error getting AI edit:', error);
                setAiSuggestion('Error: Could not process text edit.');
            } finally {
                setIsAiLoading(false);
            }
        }
        
        setToolbarVisible(false);
    };

    // Handle custom AI edit
    const handleCustomEdit = async (customPrompt) => {
        setIsAiLoading(true);
        try {
            const result = await aiService.getTextEdit('custom', originalText, customPrompt);
            setAiSuggestion(result.editedText);
        } catch (error) {
            console.error('Error getting custom AI edit:', error);
            setAiSuggestion('Error: Could not process custom edit.');
        } finally {
            setIsAiLoading(false);
        }
    };

    // Confirm AI edit - replace selected text
    const handleConfirmEdit = () => {
        if (selectionRange && aiSuggestion && editorRef.current) {
            const editor = editorRef.current;
            editor.replaceRange(selectionRange.from, selectionRange.to, aiSuggestion);
        }
        
        setPreviewModalOpen(false);
        setAiSuggestion('');
        setOriginalText('');
        setSelectionRange(null);
    };

    // Cancel AI edit
    const handleCancelEdit = () => {
        setPreviewModalOpen(false);
        setAiSuggestion('');
        setOriginalText('');
        setIsAiLoading(false);
    };

    return (
        <div className="App">
            <div className="app-header">
                <h1>Collaborative Editor with AI Assistant</h1>
            </div>
            <div className="app-content">
                <div className="editor-container">
                    <div className="editor-header">
                        <h2>Rich Text Editor</h2>
                        <p>Start typing or ask the AI assistant to help you!</p>
                    </div>
                    <TiptapEditor
                        ref={editorRef}
                        content={document}
                        onChange={handleEditorChange}
                        onSelectionChange={handleEditorSelection}
                        placeholder="Start writing your document here..."
                    />
                </div>
                <ChatSidebar 
                    onDocumentUpdate={handleDocumentUpdate}
                    currentDocument={documentText}
                />
            </div>
            
            {/* Floating Toolbar */}
            <FloatingToolbar 
                isVisible={toolbarVisible}
                position={toolbarPosition}
                selectedText={selectedText}
                onEditWithAI={handleEditWithAI}
                onClose={hideFloatingToolbar}
            />
            
            {/* Preview Modal */}
            <PreviewModal 
                isOpen={previewModalOpen}
                originalText={originalText}
                aiSuggestion={aiSuggestion}
                editType={currentEditType}
                isLoading={isAiLoading}
                onConfirm={handleConfirmEdit}
                onCancel={handleCancelEdit}
                onCustomEdit={handleCustomEdit}
            />
        </div>
    );
}

export default App;
