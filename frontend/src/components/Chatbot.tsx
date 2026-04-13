/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: updatedMessages }),
        });

        const data = await response.json();
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
        setIsLoading(false);
    };

    return (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000 }}>

            {/* Chat window */}
            {isOpen && (
                <div
                    className="animate-fade-in-up glass-card accent-top"
                    style={{
                        width: '360px',
                        height: '520px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: 'var(--space-4) var(--space-6)',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            flexShrink: 0,
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                flexShrink: 0,
                                boxShadow: 'var(--shadow-glow)',
                            }}
                        >
                            🎓
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                margin: 0,
                                lineHeight: 1.2,
                            }}>
                                Academic Advisor
                            </p>
                            {/* Online indicator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--success)',
                                    flexShrink: 0,
                                }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Online</span>
                            </div>
                        </div>
                        {/* Close button */}
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => setIsOpen(false)}
                            style={{ fontSize: '16px', color: 'var(--text-muted)' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        className="custom-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: 'var(--space-4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-3)',
                        }}
                    >
                        {messages.length === 0 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                gap: 'var(--space-3)',
                                opacity: 0.7,
                            }}>
                                <div style={{ fontSize: '2rem' }}>🎓</div>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8125rem',
                                    textAlign: 'center',
                                    lineHeight: 1.6,
                                    maxWidth: '220px',
                                }}>
                                    Ask me anything about your grades, CGPA, or academic goals!
                                </p>
                                {/* Quick prompts */}
                                {[
                                    'How can I improve my CGPA?',
                                    'Tips for exam preparation?',
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setInput(prompt)}
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className="animate-fade-in"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '82%',
                                        padding: 'var(--space-3) var(--space-4)',
                                        borderRadius: msg.role === 'user'
                                            ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
                                            : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                                            : 'var(--glass-bg)',
                                        border: msg.role === 'user'
                                            ? 'none'
                                            : '1px solid var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.8125rem',
                                        lineHeight: 1.6,
                                        boxShadow: msg.role === 'user' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <div
                                    className="glass-inner"
                                    style={{
                                        padding: 'var(--space-3) var(--space-4)',
                                        borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                                        display: 'flex',
                                        gap: '4px',
                                        alignItems: 'center',
                                    }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: 'var(--accent)',
                                                animation: 'pulse-glow 1.2s ease infinite',
                                                animationDelay: `${i * 0.2}s`,
                                                opacity: 0.7,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div
                        style={{
                            padding: 'var(--space-3) var(--space-4)',
                            borderTop: '1px solid var(--glass-border)',
                            display: 'flex',
                            gap: 'var(--space-2)',
                            alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask something..."
                            style={{
                                flex: 1,
                                padding: '8px 14px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.8125rem',
                                fontFamily: 'inherit',
                                outline: 'none',
                                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'var(--glass-border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <button
                            className="btn btn-primary btn-icon"
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            style={{
                                width: '38px',
                                height: '38px',
                                fontSize: '16px',
                                flexShrink: 0,
                                opacity: isLoading || !input.trim() ? 0.5 : 1,
                            }}
                        >
                            ↑
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-primary glow-accent"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 'auto',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
                    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
}