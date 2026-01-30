
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    message_type: string;
    attachment_url?: string;
    attachment_label?: string;
    is_read: boolean;
    created_at: string;
}

// Future: SensoryProfile interface for displaying real profile context in sidebar
// interface SensoryProfile { ... }

// Future: Application interface for fetching and displaying application context
// interface Application { ... }

const Chat: React.FC = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    // Application data state reserved for future use when fetching application details
    const [error, setError] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch application details and messages
    useEffect(() => {
        const fetchData = async () => {
            if (!applicationId) return;

            setLoading(true);
            try {
                // Fetch messages
                const messagesRes = await axios.get(`/api/applications/${applicationId}/messages`);
                setMessages(messagesRes.data);

                // In a real implementation, fetch application details too
                // For now, we'll use mock data structure
                // const appRes = await axios.get(`/api/applications/${applicationId}`);
                // setApplication(appRes.data);

            } catch (err: any) {
                console.error('Error fetching chat data:', err);
                setError('No se pudo cargar la conversación.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [applicationId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(`/api/applications/${applicationId}/messages`, {
                content: newMessage.trim(),
                message_type: 'text'
            });

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            inputRef.current?.focus();

        } catch (err: any) {
            console.error('Error sending message:', err);
            setError('No se pudo enviar el mensaje. Intenta de nuevo.');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
        const date = new Date(message.created_at).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-pulse text-4xl mb-4">💬</div>
                    <p className="text-gray-600">Cargando conversación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)] max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">

                {/* Chat Header */}
                <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Link to="/talent-dashboard" className="text-gray-400 hover:text-p2 transition-colors p-1">
                            <span className="text-xl">←</span>
                        </Link>
                        <div>
                            <h1 className="font-heading font-bold text-lg text-n900">
                                Conversación sobre la vacante
                            </h1>
                            <p className="text-sm text-gray-500">
                                Comunicación asíncrona • Sin presión de respuesta
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            Canal Activo
                        </span>
                    </div>
                </header>

                {/* Protocol Reminder Banner */}
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 text-sm text-indigo-800 shrink-0">
                    <strong>📌 Recordatorio:</strong> Consulta el Perfil Sensorial del candidato antes de escribir.
                    Sé directo y utiliza listas numeradas para las tareas.
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center" role="alert">
                            {error}
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <div className="text-5xl mb-4">💬</div>
                            <p className="font-medium text-lg mb-2">Sin mensajes aún</p>
                            <p className="text-sm max-w-md">
                                Inicia la conversación de forma clara y directa.
                                Recuerda que el talento trabaja mejor sin presión de respuesta inmediata.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, dayMessages]) => (
                            <div key={date}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center my-4">
                                    <span className="bg-white text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                        {formatDate(dayMessages[0].created_at)}
                                    </span>
                                </div>

                                {/* Messages for this day */}
                                <div className="space-y-4">
                                    {dayMessages.map((message) => {
                                        const isOwnMessage = message.sender_id === user?.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isOwnMessage
                                                        ? 'bg-p2 text-white rounded-br-sm' // Enterprise/Sender: P2 background
                                                        : 'bg-n100 text-n900 rounded-bl-sm' // Talent/Receiver: N100 background
                                                        }`}
                                                    style={{
                                                        fontFamily: 'Atkinson Hyperlegible, sans-serif',
                                                        fontSize: '16px',
                                                        lineHeight: '1.5'
                                                    }}
                                                >
                                                    {/* Message Content */}
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>

                                                    {/* Attachment if present */}
                                                    {message.attachment_url && (
                                                        <a
                                                            href={message.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`mt-2 flex items-center gap-2 text-sm underline ${isOwnMessage ? 'text-white/90' : 'text-p2'
                                                                }`}
                                                        >
                                                            📎 {message.attachment_label || 'Archivo adjunto'}
                                                        </a>
                                                    )}

                                                    {/* Timestamp */}
                                                    <div className={`text-xs mt-2 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                                        }`}>
                                                        {formatTime(message.created_at)}
                                                        {isOwnMessage && message.is_read && (
                                                            <span className="ml-2">✓✓</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white shrink-0">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label htmlFor="message-input" className="sr-only">Escribe tu mensaje</label>
                            <textarea
                                ref={inputRef}
                                id="message-input"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu mensaje de forma clara y directa..."
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-4 focus:ring-focus-ring focus:border-p2 outline-none transition-all"
                                style={{
                                    fontFamily: 'Atkinson Hyperlegible, sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '1.5'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-p2 text-white font-bold px-6 py-3 rounded-xl hover:bg-p2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-focus-ring outline-none flex items-center gap-2"
                        >
                            {sending ? (
                                <span>Enviando...</span>
                            ) : (
                                <>
                                    <span>Enviar</span>
                                    <span aria-hidden="true">→</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Pulsa <kbd className="bg-gray-100 px-1 rounded">Enter</kbd> para enviar.
                        <kbd className="bg-gray-100 px-1 rounded">Shift+Enter</kbd> para salto de línea.
                    </p>
                </form>
            </div>

            {/* Sensory Profile Sidebar (Context Panel) */}
            <aside className="w-80 bg-white border-l border-gray-100 p-6 hidden lg:flex flex-col shrink-0">
                <h2 className="font-heading font-bold text-lg text-n900 mb-4 pb-3 border-b border-gray-100">
                    Perfil Sensorial del Talento
                </h2>

                {/* Placeholder Sensory Profile - In production, fetch real data */}
                <div className="space-y-4 flex-1">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="font-bold text-sm text-n900 mb-2">Preferencias de Comunicación</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Comunicación Asíncrona
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Instrucciones por Escrito
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-yellow-500">⚠</span> Evitar Llamadas Sorpresa
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="font-bold text-sm text-n900 mb-2">Necesidades Sensoriales</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">🔇</span> Entorno de Bajo Ruido
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-amber-500">☀️</span> Luz Natural Preferida
                            </li>
                        </ul>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-sm text-p2 mb-2">💡 Consejo</h3>
                        <p className="text-xs text-gray-700 leading-relaxed">
                            Envía las preguntas de la entrevista con 24 horas de antelación.
                            Esto reduce la ansiedad y obtendrás respuestas más completas.
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs text-gray-500 font-medium mb-2">Plantillas Rápidas:</p>
                    <button
                        onClick={() => setNewMessage("¿Podemos agendar una videollamada sin cámara para conocernos mejor?")}
                        className="w-full text-left text-sm text-p2 bg-p2/5 hover:bg-p2/10 px-3 py-2 rounded-lg transition-colors"
                    >
                        📹 Proponer videollamada sin cámara
                    </button>
                    <button
                        onClick={() => setNewMessage("Te envío el orden del día para nuestra próxima reunión:\n\n1. \n2. \n3. ")}
                        className="w-full text-left text-sm text-p2 bg-p2/5 hover:bg-p2/10 px-3 py-2 rounded-lg transition-colors"
                    >
                        📋 Enviar orden del día
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default Chat;
