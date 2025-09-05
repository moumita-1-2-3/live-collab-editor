import React, { useEffect, useRef } from 'react';
import './FloatingToolbar.css';

const FloatingToolbar = ({ 
    isVisible, 
    position, 
    selectedText, 
    onEditWithAI, 
    onClose 
}) => {
    const toolbarRef = useRef(null);

    const toolbarOptions = [
        {
            id: 'shorten',
            label: 'Shorten',
            icon: '📉',
            description: 'Make text more concise',
            action: () => onEditWithAI('shorten', selectedText)
        },
        {
            id: 'lengthen',
            label: 'Lengthen',
            icon: '📈',
            description: 'Expand and elaborate',
            action: () => onEditWithAI('lengthen', selectedText)
        },
        {
            id: 'improve',
            label: 'Improve',
            icon: '✨',
            description: 'Enhance writing quality',
            action: () => onEditWithAI('improve', selectedText)
        },
        {
            id: 'formal',
            label: 'Formal',
            icon: '🎩',
            description: 'Make more formal',
            action: () => onEditWithAI('formal', selectedText)
        },
        {
            id: 'casual',
            label: 'Casual',
            icon: '😊',
            description: 'Make more casual',
            action: () => onEditWithAI('casual', selectedText)
        },
        {
            id: 'table',
            label: 'To Table',
            icon: '📊',
            description: 'Convert to table format',
            action: () => onEditWithAI('table', selectedText)
        },
        {
            id: 'list',
            label: 'To List',
            icon: '📋',
            description: 'Convert to bullet points',
            action: () => onEditWithAI('list', selectedText)
        },
        {
            id: 'summarize',
            label: 'Summarize',
            icon: '📄',
            description: 'Create brief summary',
            action: () => onEditWithAI('summarize', selectedText)
        }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div 
            ref={toolbarRef}
            className="floating-toolbar"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className="toolbar-header">
                <span className="selected-text-preview">
                    "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
                </span>
                <button className="close-toolbar" onClick={onClose}>×</button>
            </div>
            
            <div className="toolbar-options">
                {toolbarOptions.map((option) => (
                    <button
                        key={option.id}
                        className="toolbar-option"
                        onClick={option.action}
                        title={option.description}
                    >
                        <span className="option-icon">{option.icon}</span>
                        <span className="option-label">{option.label}</span>
                    </button>
                ))}
            </div>

            <div className="toolbar-footer">
                <button 
                    className="custom-edit-btn"
                    onClick={() => onEditWithAI('custom', selectedText)}
                >
                    🎯 Custom Edit with AI
                </button>
            </div>
        </div>
    );
};

export default FloatingToolbar;
