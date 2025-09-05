// Download utilities for exporting documents
export const downloadUtils = {
    // Download as plain text file
    downloadAsText: (content, filename = 'document.txt') => {
        const blob = new Blob([content], { type: 'text/plain' });
        downloadUtils.triggerDownload(blob, filename);
    },

    // Download as Markdown file
    downloadAsMarkdown: (content, filename = 'document.md') => {
        const blob = new Blob([content], { type: 'text/markdown' });
        downloadUtils.triggerDownload(blob, filename);
    },

    // Download as HTML file
    downloadAsHTML: (content, filename = 'document.html') => {
        const htmlContent = downloadUtils.convertToHTML(content);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        downloadUtils.triggerDownload(blob, filename);
    },

    // Download as JSON (with metadata)
    downloadAsJSON: (content, filename = 'document.json') => {
        const documentData = {
            content: content,
            createdAt: new Date().toISOString(),
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            characterCount: content.length,
            lineCount: content.split('\n').length
        };
        
        const blob = new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json' });
        downloadUtils.triggerDownload(blob, filename);
    },

    // Download as RTF (Rich Text Format)
    downloadAsRTF: (content, filename = 'document.rtf') => {
        const rtfContent = downloadUtils.convertToRTF(content);
        const blob = new Blob([rtfContent], { type: 'application/rtf' });
        downloadUtils.triggerDownload(blob, filename);
    },

    // Main download trigger function
    triggerDownload: (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Convert plain text to HTML
    convertToHTML: (content) => {
        const htmlContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1
            .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2
            .replace(/^### (.*$)/gm, '<h3>$1</h3>'); // H3

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { border-bottom: 2px solid #3498db; }
        strong { color: #2c3e50; }
        em { color: #7f8c8d; }
    </style>
</head>
<body>
${htmlContent}
<hr>
<p><small>Generated on ${new Date().toLocaleString()}</small></p>
</body>
</html>`;
    },

    // Convert plain text to RTF
    convertToRTF: (content) => {
        const rtfContent = content
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\n/g, '\\par ');

        return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24
${rtfContent}
}`;
    },

    // Get file size in human readable format
    getFileSize: (content) => {
        const bytes = new Blob([content]).size;
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Get document statistics
    getDocumentStats: (content) => {
        const words = content.split(/\s+/).filter(word => word.length > 0);
        const characters = content.length;
        const charactersNoSpaces = content.replace(/\s/g, '').length;
        const lines = content.split('\n').length;
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

        return {
            words: words.length,
            characters: characters,
            charactersNoSpaces: charactersNoSpaces,
            lines: lines,
            paragraphs: paragraphs,
            fileSize: downloadUtils.getFileSize(content)
        };
    },

    // Generate suggested filename based on content
    generateFilename: (content, extension = 'txt') => {
        const firstLine = content.split('\n')[0].trim();
        let filename = 'document';
        
        if (firstLine && firstLine.length > 0 && firstLine.length <= 50) {
            filename = firstLine
                .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .toLowerCase()
                .substring(0, 30); // Limit length
        }
        
        if (!filename || filename === '' || filename === '_') {
            filename = 'document';
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
        return `${filename}_${timestamp}.${extension}`;
    }
};

export default downloadUtils;
