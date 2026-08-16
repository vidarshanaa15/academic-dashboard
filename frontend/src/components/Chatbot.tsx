/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Subject {
    id: string;
    name: string;
    credits: number;
    grade: string | null;
    tag: string;
}

interface Semester {
    id: string;
    name: string;
    year: number;
    term: string;
    gpa: number | null;
    cgpa: number | null;
    status: string;
    subjects: Subject[];
}

interface Goal {
    id: string;
    title: string;
    target_semester: string;
    priority: string;
    completed: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Builds the system prompt using real student data
function buildSystemPrompt(semesters: Semester[], goals: Goal[]): string {
    const completedSems = semesters.filter(s => s.status === 'completed');
    const plannedSems = semesters.filter(s => s.status === 'planned');
    const latestCGPA = completedSems.at(-1)?.cgpa ?? 'N/A';
    const latestGPA = completedSems.at(-1)?.gpa ?? 'N/A';

    const totalCredits = semesters
        .flatMap(s => s.subjects)
        .reduce((sum, sub) => sum + Number(sub.credits), 0);

    const semesterDetails = completedSems.map(sem => {
        const subjectList = sem.subjects.map(sub =>
            `    - ${sub.name} (${sub.credits} credits, Grade: ${sub.grade ?? 'N/A'}, Tag: ${sub.tag})`
        ).join('\n');
        return `  • ${sem.name} — GPA: ${sem.gpa ?? 'N/A'}, CGPA after this sem: ${sem.cgpa ?? 'N/A'}
${subjectList}`;
    }).join('\n\n');

    const plannedDetails = plannedSems.map(sem => {
        const subjectList = sem.subjects.map(sub =>
            `    - ${sub.name} (${sub.credits} credits, Tag: ${sub.tag})`
        ).join('\n');
        return `  • ${sem.name} (Planned)
${subjectList}`;
    }).join('\n\n');

    const goalsList = goals.map(g =>
        `  - [${g.completed ? 'DONE' : g.priority + ' priority'}] ${g.title} (Target: ${g.target_semester})`
    ).join('\n');

    return `You are a personal academic advisor embedded inside this student's academic dashboard. You have full access to their academic history. Never say you don't know their data — it is provided below.

=== STUDENT ACADEMIC PROFILE ===

Current CGPA: ${latestCGPA}
Latest Semester GPA: ${latestGPA}
Total Credits Completed: ${totalCredits}
Semesters Completed: ${completedSems.length}

=== SEMESTER HISTORY ===
${semesterDetails || 'No completed semesters yet.'}

=== PLANNED SEMESTERS ===
${plannedDetails || 'No planned semesters.'}

=== GOALS ===
${goalsList || 'No goals set yet.'}

=== GRADING SCALE ===
O = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5

=== YOUR BEHAVIOUR ===
- You already know everything above. Never ask the student for info you already have.
- Answer questions about their specific grades, subjects, CGPA trends, and goals directly.
- When asked about improvement, reference their actual weak subjects and grades.
- Keep responses concise, friendly, and encouraging.
- If asked to predict GPA, use the grading scale above to calculate accurately.

=== FORMATTING RULES (IMPORTANT) ===
- Always respond in Markdown.
- Keep responses SHORT. Default to 2-4 sentences or a short list. Only go longer if the user explicitly asks for detail or a full breakdown.
- Use **bold** for key numbers (GPA, CGPA, credits, grades) so they stand out.
- If an answer involves multiple steps, options, or subjects, use a bullet list ("- ") instead of a paragraph. One idea per line.
- If an answer involves a calculation (like a target GPA), don't show the algebra. Just state the assumption in one line and give the result in bold. Example:
  "Assuming ~22 credits next sem, you'd need around **9.4–9.6 GPA** to hit a 9.0 CGPA."
- Never restate the question back to the student before answering.
- No headers (#, ##) — this is a chat bubble, not a report.`;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState<string>('');
    const [dataLoaded, setDataLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch data when chatbot is opened for the first time
    useEffect(() => {
        if (isOpen && !dataLoaded) {
            fetchStudentData();
        }
    }, [isOpen]);

    const fetchStudentData = async () => {
        const { data: semestersRaw } = await supabase
            .from('semesters')
            .select('*')
            .order('year', { ascending: true });

        const { data: subjectsRaw } = await supabase
            .from('subjects')
            .select('*');

        const { data: goalsRaw } = await supabase
            .from('goals')
            .select('*');

        const semesters: Semester[] = (semestersRaw ?? []).map(sem => ({
            ...sem,
            subjects: (subjectsRaw ?? []).filter(sub => sub.semester_id === sem.id),
        }));

        const prompt = buildSystemPrompt(semesters, goalsRaw ?? []);
        setSystemPrompt(prompt);
        setDataLoaded(true);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading || !dataLoaded) return;

        const userMessage: Message = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: updatedMessages,
                systemPrompt,           // send the personalized prompt to backend
            }),
        });

        const data = await response.json();
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
        setIsLoading(false);
    };

    return (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000 }}>

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
                    <div style={{
                        padding: 'var(--space-4) var(--space-6)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        flexShrink: 0,
                    }}>
                        <div style={{
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
                        }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: dataLoaded ? 'var(--success)' : 'var(--warning)',
                                    flexShrink: 0,
                                }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {dataLoaded ? 'Ready' : 'Loading your data...'}
                                </span>
                            </div>
                        </div>
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
                                    {dataLoaded
                                        ? "I've loaded your academic profile. Ask me anything!"
                                        : 'Loading your academic data...'}
                                </p>
                                {dataLoaded && [
                                    'How is my CGPA trending?',
                                    'Which subject pulled my GPA down?',
                                    'How can I reach a 9.0 CGPA?',
                                ].map(prompt => (
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
                                <div style={{
                                    maxWidth: '82%',
                                    padding: 'var(--space-3) var(--space-4)',
                                    borderRadius: msg.role === 'user'
                                        ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
                                        : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                                        : 'var(--glass-bg)',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.8125rem',
                                    lineHeight: 1.6,
                                    boxShadow: msg.role === 'user' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                                }}>
                                    {msg.role === 'assistant' ? (
                                        <div className="markdown-body">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => (
                                                        <p style={{ margin: '0 0 8px 0' }}>{children}</p>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li style={{ marginBottom: '4px' }}>{children}</li>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong style={{ color: 'var(--accent-2)' }}>{children}</strong>
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <div className="glass-inner" style={{
                                    padding: 'var(--space-3) var(--space-4)',
                                    borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center',
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'var(--accent)',
                                            animation: 'pulse-glow 1.2s ease infinite',
                                            animationDelay: `${i * 0.2}s`,
                                            opacity: 0.7,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex',
                        gap: 'var(--space-2)',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder={dataLoaded ? 'Ask something...' : 'Loading...'}
                            disabled={!dataLoaded}
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
                                opacity: dataLoaded ? 1 : 0.5,
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
                            disabled={isLoading || !input.trim() || !dataLoaded}
                            style={{
                                width: '38px',
                                height: '38px',
                                fontSize: '16px',
                                flexShrink: 0,
                                opacity: isLoading || !input.trim() || !dataLoaded ? 0.5 : 1,
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