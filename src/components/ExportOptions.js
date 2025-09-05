import React, { useState, useEffect } from 'react';
import './ExportOptions.css';
import downloadUtils from '../utils/downloadUtils';

const ExportOptions = ({ isOpen, onClose, documentContent }) => {
    const [selectedFormat, setSelectedFormat] = useState('txt');
    const [filename, setFilename] = useState('');
    const [documentStats, setDocumentStats] = useState({});

    const exportFormats = [
        { value: 'txt', label: 'Plain Text (.txt)', icon: '📄' },
        { value: 'md', label: 'Markdown (.md)', icon: '📝' },
        { value: 'html', label: 'HTML (.html)', icon: '🌐' },
        { value: 'json', label: 'JSON with metadata (.json)', icon: '💾' },
        { value: 'rtf', label: 'Rich Text Format (.rtf)', icon: '📋' }
    ];

    useEffect(() => {
        if (documentContent) {
            setDocumentStats(downloadUtils.getDocumentStats(documentContent));
            setFilename(downloadUtils.generateFilename(documentContent, selectedFormat));
        }
    }, [documentContent, selectedFormat]);

    const handleExport = () => {
        if (!documentContent.trim()) {
            alert('Document is empty. Please add some content before exporting.');
            return;
        }

        const finalFilename = filename || downloadUtils.generateFilename(documentContent, selectedFormat);

        switch (selectedFormat) {
            case 'txt':
                downloadUtils.downloadAsText(documentContent, finalFilename);
                break;
            case 'md':
                downloadUtils.downloadAsMarkdown(documentContent, finalFilename);
                break;
            case 'html':
                downloadUtils.downloadAsHTML(documentContent, finalFilename);
                break;
            case 'json':
                downloadUtils.downloadAsJSON(documentContent, finalFilename);
                break;
            case 'rtf':
                downloadUtils.downloadAsRTF(documentContent, finalFilename);
                break;
            default:
                downloadUtils.downloadAsText(documentContent, finalFilename);
        }

        onClose();
    };

    const handleFilenameChange = (e) => {
        let value = e.target.value;
        // Remove invalid filename characters
        value = value.replace(/[<>:"/\\|?*]/g, '');
        setFilename(value);
    };

    if (!isOpen) return null;

    return (
        <div className="export-overlay">
            <div className="export-modal">
                <div className="export-header">
                    <h3>📥 Export Document</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="export-content">
                    {/* Document Statistics */}
                    <div className="document-stats">
                        <h4>Document Statistics</h4>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Words:</span>
                                <span className="stat-value">{documentStats.words}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Characters:</span>
                                <span className="stat-value">{documentStats.characters}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Lines:</span>
                                <span className="stat-value">{documentStats.lines}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">File Size:</span>
                                <span className="stat-value">{documentStats.fileSize}</span>
                            </div>
                        </div>
                    </div>

                    {/* Export Format Selection */}
                    <div className="format-selection">
                        <h4>Choose Export Format</h4>
                        <div className="format-options">
                            {exportFormats.map((format) => (
                                <label key={format.value} className="format-option">
                                    <input
                                        type="radio"
                                        name="format"
                                        value={format.value}
                                        checked={selectedFormat === format.value}
                                        onChange={(e) => setSelectedFormat(e.target.value)}
                                    />
                                    <div className="format-info">
                                        <span className="format-icon">{format.icon}</span>
                                        <span className="format-label">{format.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filename Input */}
                    <div className="filename-input">
                        <h4>Filename</h4>
                        <div className="input-group">
                            <input
                                type="text"
                                value={filename}
                                onChange={handleFilenameChange}
                                placeholder="Enter filename..."
                                className="filename-field"
                            />
                            <button
                                className="generate-filename-btn"
                                onClick={() => setFilename(downloadUtils.generateFilename(documentContent, selectedFormat))}
                                title="Generate filename from content"
                            >
                                🔄
                            </button>
                        </div>
                        <p className="filename-help">
                            Leave empty to auto-generate from content
                        </p>
                    </div>

                    {/* Preview */}
                    {documentContent.trim() && (
                        <div className="content-preview">
                            <h4>Preview</h4>
                            <div className="preview-content">
                                {documentContent.substring(0, 200)}
                                {documentContent.length > 200 && '...'}
                            </div>
                        </div>
                    )}
                </div>

                <div className="export-actions">
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="export-button" 
                        onClick={handleExport}
                        disabled={!documentContent.trim()}
                    >
                        📥 Export Document
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportOptions;
