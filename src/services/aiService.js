// Multi-Provider AI Service with OpenAI, Claude, and free options
class AIService {
    constructor() {
        // API Keys from environment variables
        this.openaiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
        this.claudeKey = process.env.REACT_APP_CLAUDE_API_KEY || null;
        this.huggingFaceKey = process.env.REACT_APP_HUGGINGFACE_API_KEY || null;
        
        // API Endpoints
        this.endpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            claude: 'https://api.anthropic.com/v1/messages',
            huggingface: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
            cohere: 'https://api.cohere.ai/v1/generate',
            // Free alternatives
            ollama: 'http://localhost:11434/api/generate', // Local Ollama
            groq: 'https://api.groq.com/openai/v1/chat/completions' // Groq (free tier)
        };
        
        // Default provider priority (will use first available)
        this.providers = ['openai', 'claude', 'groq', 'huggingface', 'simulation'];
        this.currentProvider = 'simulation'; // Default fallback
        
        this.detectAvailableProvider();
    }
    
    detectAvailableProvider() {
        for (const provider of this.providers) {
            if (this.isProviderAvailable(provider)) {
                this.currentProvider = provider;
                console.log(`Using AI provider: ${provider}`);
                break;
            }
        }
    }
    
    isProviderAvailable(provider) {
        switch (provider) {
            case 'openai':
                return !!this.openaiKey;
            case 'claude':
                return !!this.claudeKey;
            case 'huggingface':
                return !!this.huggingFaceKey;
            case 'groq':
                return process.env.REACT_APP_GROQ_API_KEY;
            case 'simulation':
                return true; // Always available
            default:
                return false;
        }
    }

    async getChatResponse(message, documentContent = '') {
        try {
            return await this.callAI(message, documentContent, 'chat');
        } catch (error) {
            console.error('AI API Error:', error);
            return this.simulateAIResponse(message, documentContent);
        }
    }
    
    async callAI(message, documentContent = '', type = 'chat') {
        const provider = this.currentProvider;
        
        if (provider === 'simulation') {
            return type === 'chat' 
                ? this.simulateAIResponse(message, documentContent)
                : this.getTextEdit(message, documentContent);
        }
        
        const prompt = this.buildPrompt(message, documentContent, type);
        
        switch (provider) {
            case 'openai':
                return await this.callOpenAI(prompt);
            case 'claude':
                return await this.callClaude(prompt);
            case 'groq':
                return await this.callGroq(prompt);
            case 'huggingface':
                return await this.callHuggingFace(prompt);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    
    buildPrompt(message, documentContent, type) {
        const systemPrompt = type === 'chat'
            ? `You are an AI assistant integrated into a collaborative text editor. You can either:
1. Provide helpful chat responses to user questions
2. Directly modify the document content when asked

When the user asks you to modify the document (fix grammar, improve text, add content, etc.), respond with a JSON object containing:
- action: 'modify'
- message: 'Brief description of what you did'
- newContent: 'The improved/modified document content'

For regular chat, respond with:
- action: 'chat'
- message: 'Your response'

Current document content: ${documentContent}`
            : `You are a text editing AI. Edit the provided text according to the user's request. Return only the edited text.`;
        
        return {
            system: systemPrompt,
            user: message,
            context: documentContent
        };
    }
    
    async callOpenAI(prompt) {
        const response = await fetch(this.endpoints.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            try {
                return JSON.parse(data.choices[0].message.content);
            } catch (e) {
                return {
                    action: 'chat',
                    message: data.choices[0].message.content
                };
            }
        }
        
        throw new Error('No response from OpenAI');
    }
    
    async callClaude(prompt) {
        const response = await fetch(this.endpoints.claude, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.claudeKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [
                    { role: 'user', content: `${prompt.system}\n\nUser: ${prompt.user}` }
                ]
            })
        });
        
        const data = await response.json();
        
        if (data.content && data.content[0]) {
            try {
                return JSON.parse(data.content[0].text);
            } catch (e) {
                return {
                    action: 'chat',
                    message: data.content[0].text
                };
            }
        }
        
        throw new Error('No response from Claude');
    }
    
    async callGroq(prompt) {
        const response = await fetch(this.endpoints.groq, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            try {
                return JSON.parse(data.choices[0].message.content);
            } catch (e) {
                return {
                    action: 'chat',
                    message: data.choices[0].message.content
                };
            }
        }
        
        throw new Error('No response from Groq');
    }
    
    async callHuggingFace(prompt) {
        const response = await fetch(this.endpoints.huggingface, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.huggingFaceKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `${prompt.system}\n\nUser: ${prompt.user}`,
                parameters: {
                    max_length: 500,
                    temperature: 0.7,
                    do_sample: true
                }
            })
        });
        
        const data = await response.json();
        
        if (data && data[0] && data[0].generated_text) {
            return {
                action: 'chat',
                message: data[0].generated_text
            };
        }
        
        throw new Error('No response from Hugging Face');
    }

    simulateAIResponse(userMessage, currentDocument) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const lowerMessage = userMessage.toLowerCase();
                
                // Grammar and style improvements
                if (lowerMessage.includes('fix grammar') || lowerMessage.includes('correct') || lowerMessage.includes('improve')) {
                    const improvedContent = this.improveText(currentDocument);
                    resolve({
                        action: 'modify',
                        message: "I've improved the grammar and style of your document!",
                        newContent: improvedContent
                    });
                } 
                // Add content requests
                else if (lowerMessage.includes('add') && (lowerMessage.includes('content') || lowerMessage.includes('paragraph') || lowerMessage.includes('text'))) {
                    let addedContent = '';
                    
                    if (lowerMessage.includes('introduction') || lowerMessage.includes('intro')) {
                        addedContent = '\n\n## Introduction\n\nThis document serves as a comprehensive guide that aims to provide valuable insights and information on the topic at hand. Through careful analysis and research, we present the following findings and recommendations.';
                    } else if (lowerMessage.includes('conclusion')) {
                        addedContent = '\n\n## Conclusion\n\nIn conclusion, the points discussed above highlight the importance of this topic and its implications for future development. We recommend continued research and implementation of the strategies outlined in this document.';
                    } else {
                        addedContent = '\n\n[AI Generated Content]\nThis additional content has been generated based on your request. It provides supplementary information that complements the existing text and enhances the overall quality of the document.';
                    }
                    
                    resolve({
                        action: 'modify',
                        message: "I've added relevant content to your document!",
                        newContent: currentDocument + addedContent
                    });
                }
                // Summarize requests
                else if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
                    if (currentDocument.trim()) {
                        const summary = '\n\n## Summary\nThis document contains ' + 
                                      currentDocument.split(' ').length + ' words covering the main topics discussed above. ' +
                                      'The key points have been organized to provide a clear understanding of the subject matter.';
                        resolve({
                            action: 'modify',
                            message: "I've added a summary to your document!",
                            newContent: currentDocument + summary
                        });
                    } else {
                        resolve({
                            action: 'chat',
                            message: 'There\'s no content to summarize yet. Please add some text first, and I\'ll be happy to create a summary!'
                        });
                    }
                }
                // Formatting requests
                else if (lowerMessage.includes('format') || lowerMessage.includes('organize')) {
                    const formatted = this.formatDocument(currentDocument);
                    resolve({
                        action: 'modify',
                        message: "I've improved the formatting and organization of your document!",
                        newContent: formatted
                    });
                }
                // Regular chat responses
                else {
                    const responses = [
                        "I'm here to help! You can ask me to fix grammar, improve writing, add content, or format your document.",
                        "That's an interesting question! I can also help you edit your document directly. Try asking me to 'fix grammar' or 'add an introduction'.",
                        "I'd be happy to assist you! Some things I can do: improve text, add summaries, fix formatting, or just chat about your document.",
                        "Great question! I can provide suggestions or directly modify your document. Just let me know what you need - I can add content, fix grammar, or organize your text.",
                        "I'm your AI writing assistant! I can help improve your document's grammar, add new content, create summaries, or answer any questions you have.",
                        "Feel free to ask me anything! I can also edit your document directly - try asking me to 'improve the writing' or 'add a conclusion'.",
                        "I'm designed to help with both conversation and document editing. What would you like me to help you with today?",
                        "That's a good point! I can also assist with your document - whether you need grammar fixes, additional content, or better formatting.",
                        "Interesting! While we chat, remember I can also directly modify your document. Try commands like 'add an introduction' or 'fix the grammar'.",
                        "I understand! Let me know if you'd like me to make any changes to your document. I can improve writing, add content, or organize the text better."
                    ];
                    
                    resolve({
                        action: 'chat',
                        message: responses[Math.floor(Math.random() * responses.length)]
                    });
                }
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        });
    }

    improveText(text) {
        if (!text) return text;
        
        // Basic improvements
        let improved = text
            .replace(/\bi\b/g, 'I')  // Capitalize 'i'
            .replace(/\s+/g, ' ')    // Remove extra spaces
            .replace(/\.+/g, '.')    // Fix multiple periods
            .replace(/\?+/g, '?')    // Fix multiple question marks
            .replace(/!+/g, '!')     // Fix multiple exclamation marks
            .replace(/,+/g, ',')     // Fix multiple commas
            .trim();
        
        // Capitalize first letter of sentences
        improved = improved.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
        
        // Fix common grammar issues
        improved = improved
            .replace(/\bteh\b/g, 'the')
            .replace(/\bnad\b/g, 'and')
            .replace(/\bwas\s+were\b/g, 'were')
            .replace(/\btheir\s+they\b/g, 'they')
            .replace(/\byour\s+you\b/g, 'you');
        
        return improved;
    }

    formatDocument(text) {
        if (!text) return text;
        
        // Basic formatting improvements
        let formatted = text;
        
        // Add proper spacing after periods
        formatted = formatted.replace(/\.([A-Z])/g, '. $1');
        
        // Ensure proper paragraph breaks
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        
        // Format lists if present
        formatted = formatted.replace(/^(-|\*)\s*(.+)$/gm, '• $2');
        
        // Add title formatting if it looks like a title
        const lines = formatted.split('\n');
        if (lines.length > 0 && lines[0].length < 60 && !lines[0].includes('.')) {
            lines[0] = '# ' + lines[0];
            formatted = lines.join('\n');
        }
        
        return formatted;
    }

    // Advanced text editing functions for floating toolbar
    async getTextEdit(editType, selectedText, customPrompt = '') {
        return new Promise((resolve) => {
            setTimeout(() => {
                let editedText = '';
                let message = '';

                switch (editType) {
                    case 'shorten':
                        editedText = this.shortenText(selectedText);
                        message = 'Text shortened while preserving key meaning';
                        break;
                    case 'lengthen':
                        editedText = this.lengthenText(selectedText);
                        message = 'Text expanded with additional detail';
                        break;
                    case 'improve':
                        editedText = this.improveWriting(selectedText);
                        message = 'Writing quality improved';
                        break;
                    case 'formal':
                        editedText = this.makeFormal(selectedText);
                        message = 'Text made more formal';
                        break;
                    case 'casual':
                        editedText = this.makeCasual(selectedText);
                        message = 'Text made more casual';
                        break;
                    case 'table':
                        editedText = this.convertToTable(selectedText);
                        message = 'Converted to table format';
                        break;
                    case 'list':
                        editedText = this.convertToList(selectedText);
                        message = 'Converted to list format';
                        break;
                    case 'summarize':
                        editedText = this.summarizeText(selectedText);
                        message = 'Text summarized';
                        break;
                    case 'custom':
                        editedText = this.customEdit(selectedText, customPrompt);
                        message = `Custom edit applied: ${customPrompt}`;
                        break;
                    default:
                        editedText = this.improveText(selectedText);
                        message = 'Text improved';
                }

                resolve({
                    originalText: selectedText,
                    editedText: editedText,
                    message: message,
                    editType: editType
                });
            }, 1000 + Math.random() * 2000);
        });
    }

    shortenText(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length <= 1) return text;
        
        return sentences
            .map(s => s.trim())
            .filter((s, i) => i < Math.ceil(sentences.length * 0.7)) // Keep 70% of sentences
            .join('. ') + '.';
    }

    lengthenText(text) {
        const enhanced = text
            .replace(/\b(good|bad|nice|great)\b/gi, (match) => {
                const expansions = {
                    'good': 'excellent and well-executed',
                    'bad': 'problematic and concerning',
                    'nice': 'pleasant and appealing',
                    'great': 'outstanding and remarkable'
                };
                return expansions[match.toLowerCase()] || match;
            })
            .replace(/\. /g, '. Furthermore, ')
            .replace(/\bthis\b/gi, 'this particular aspect');
        
        return enhanced + ' This demonstrates the complexity and importance of the matter at hand.';
    }

    improveWriting(text) {
        return text
            .replace(/\bvery (\w+)/gi, (match, word) => {
                const intensifiers = {
                    'good': 'exceptional',
                    'bad': 'terrible',
                    'big': 'enormous',
                    'small': 'tiny',
                    'important': 'crucial',
                    'difficult': 'challenging'
                };
                return intensifiers[word.toLowerCase()] || match;
            })
            .replace(/\bthing(s?)\b/gi, 'element$1')
            .replace(/\bstuff\b/gi, 'material')
            .replace(/\bgot\b/gi, 'obtained')
            .replace(/\ba lot of\b/gi, 'numerous');
    }

    makeFormal(text) {
        return text
            .replace(/\bcan't\b/gi, 'cannot')
            .replace(/\bwon't\b/gi, 'will not')
            .replace(/\bdoesn't\b/gi, 'does not')
            .replace(/\bisn't\b/gi, 'is not')
            .replace(/\bI think\b/gi, 'It is my opinion that')
            .replace(/\bmaybe\b/gi, 'perhaps')
            .replace(/\bokay\b/gi, 'acceptable')
            .replace(/\bkind of\b/gi, 'somewhat')
            .replace(/\bguys\b/gi, 'individuals');
    }

    makeCasual(text) {
        return text
            .replace(/\bcannot\b/gi, "can't")
            .replace(/\bwill not\b/gi, "won't")
            .replace(/\bdoes not\b/gi, "doesn't")
            .replace(/\bis not\b/gi, "isn't")
            .replace(/\bIt is my opinion that\b/gi, 'I think')
            .replace(/\bperhaps\b/gi, 'maybe')
            .replace(/\bacceptable\b/gi, 'okay')
            .replace(/\bsomewhat\b/gi, 'kind of')
            .replace(/\bindividuals\b/gi, 'people');
    }

    convertToTable(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length < 2) return text;
        
        let table = '| Item | Description |\n|------|-------------|\n';
        sentences.forEach((sentence, i) => {
            const trimmed = sentence.trim();
            table += `| ${i + 1} | ${trimmed} |\n`;
        });
        
        return table;
    }

    convertToList(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length < 2) return text;
        
        return sentences
            .map(sentence => `• ${sentence.trim()}`)
            .join('\n');
    }

    summarizeText(text) {
        const words = text.split(/\s+/);
        if (words.length <= 20) return text;
        
        const firstSentence = text.split(/[.!?]+/)[0].trim();
        const keyWords = words
            .filter(word => word.length > 5)
            .slice(0, 5)
            .join(', ');
        
        return `Summary: ${firstSentence}. Key terms: ${keyWords}.`;
    }

    customEdit(text, prompt) {
        // Simulate custom editing based on prompt
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('professional') || lowerPrompt.includes('formal')) {
            return this.makeFormal(text);
        } else if (lowerPrompt.includes('casual') || lowerPrompt.includes('friendly')) {
            return this.makeCasual(text);
        } else if (lowerPrompt.includes('shorter') || lowerPrompt.includes('concise')) {
            return this.shortenText(text);
        } else if (lowerPrompt.includes('longer') || lowerPrompt.includes('detail')) {
            return this.lengthenText(text);
        } else {
            return this.improveWriting(text);
        }
    }
}

const aiService = new AIService();
export default aiService;
