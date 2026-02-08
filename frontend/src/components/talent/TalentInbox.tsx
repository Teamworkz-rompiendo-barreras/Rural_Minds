import React, { useState, useEffect } from 'react';
import {
    Box, Typography, List, ListItem, ListItemAvatar,
    ListItemText, Avatar, IconButton, Paper,
    TextField, Stack, Badge
} from '@mui/material';
import { ListItemButton } from '@mui/material';
import {
    Chat, Mic, VolumeUp,
    Send, ArrowBack, Business,
    AccountBalance, Celebration
} from '@mui/icons-material';
import axios from '../../config/api';

interface Conversation {
    id: string;
    type: 'application' | 'support';
    title: string;
    entity: string;
    status: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

const TalentInbox: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const res = await axios.get('/api/talent/inbox');
                setConversations(res.data);
            } catch (err) {
                console.error("Error fetching inbox", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInbox();
    }, []);

    const fetchMessages = async (id: string) => {
        try {
            const res = await axios.get(`/api/applications/${id}/messages`);
            setMessages(res.data);
        } catch (err) {
            // Support messages might not have a message history yet in this MVP
            setMessages([]);
        }
    };

    const handleSelect = (conv: Conversation) => {
        setSelectedId(conv.id);
        if (conv.type === 'application') {
            fetchMessages(conv.id);
        } else {
            setMessages([{
                id: 'wel',
                content: conv.last_message,
                sender_id: 'system',
                created_at: conv.last_message_at
            }]);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || !selectedId) return;

        try {
            const res = await axios.post(`/api/applications/${selectedId}/messages`, {
                content: text,
                message_type: 'text'
            });
            setMessages([...messages, res.data]);
            setText('');
        } catch (err) {
            console.error("Error sending message", err);
        }
    };

    const speak = (content: string) => {
        const ut = new SpeechSynthesisUtterance(content);
        ut.lang = 'es-ES';
        window.speechSynthesis.speak(ut);
    };

    if (loading) return <Typography>Cargando mensajes...</Typography>;

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <Box sx={{ height: 600, display: 'flex', bgcolor: 'white', borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {/* Sidebar: List */}
            <Box sx={{
                width: selectedId ? { xs: 0, md: 350 } : '100%',
                display: selectedId ? { xs: 'none', md: 'block' } : 'block',
                borderRight: '1px solid #E2E8F0',
                overflowY: 'auto'
            }}>
                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #E2E8F0' }}>
                    <Typography variant="h6" fontWeight="bold">Conversaciones</Typography>
                </Box>
                <List sx={{ p: 0 }}>
                    {conversations.map((conv) => (
                        <ListItem
                            key={conv.id}
                            disablePadding
                            sx={{
                                borderBottom: '1px solid #f1f5f9'
                            }}
                        >
                            <ListItemButton
                                onClick={() => handleSelect(conv)}
                                selected={selectedId === conv.id}
                                sx={{
                                    py: 2, px: 3,
                                    '&.Mui-selected': { bgcolor: '#f0f4ff', '&:hover': { bgcolor: '#eef2ff' } }
                                }}
                            >
                                <ListItemAvatar>
                                    <Badge color="error" badgeContent={conv.unread_count} variant="standard">
                                        <Avatar sx={{ bgcolor: conv.type === 'support' ? '#0F5C2E' : '#374BA6' }}>
                                            {conv.type === 'support' ? <AccountBalance fontSize="small" /> : <Business fontSize="small" />}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                                            {conv.entity}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                                            {conv.last_message}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {conversations.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Chat sx={{ color: '#CBD5E1', fontSize: 40, mb: 1 }} />
                            <Typography variant="body2" color="text.disabled">Aún no tienes mensajes</Typography>
                        </Box>
                    )}
                </List>
            </Box>

            {/* Chat Area */}
            <Box sx={{
                flexGrow: 1,
                display: selectedId ? 'flex' : { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                bgcolor: '#fdfdfd'
            }}>
                {selectedId ? (
                    <>
                        {/* Header */}
                        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
                            <IconButton onClick={() => setSelectedId(null)} sx={{ display: { md: 'none' } }}>
                                <ArrowBack />
                            </IconButton>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">{selectedConv?.entity}</Typography>
                                <Typography variant="caption" color="text.secondary">{selectedConv?.title} • {selectedConv?.status}</Typography>
                            </Box>
                        </Box>

                        {/* Messages */}
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {messages.map((m, i) => (
                                <Box key={i} sx={{
                                    maxWidth: '80%',
                                    alignSelf: m.sender_id === 'system' ? 'center' : (m.sender_id === 'me' ? 'flex-end' : 'flex-start'),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: m.sender_id === 'me' ? 'flex-end' : 'flex-start'
                                }}>
                                    <Paper sx={{
                                        p: 2, px: 3,
                                        borderRadius: 4,
                                        bgcolor: m.sender_id === 'system' ? '#E2E8F0' : (m.sender_id === 'me' ? '#0F5C2E' : 'white'),
                                        color: m.sender_id === 'me' ? 'white' : 'inherit',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                        position: 'relative'
                                    }}>
                                        <Typography variant="body2">{m.content}</Typography>
                                        <IconButton size="small" onClick={() => speak(m.content)} sx={{ position: 'absolute', right: -35, top: 5, color: '#A0AEC0' }}>
                                            <VolumeUp fontSize="inherit" />
                                        </IconButton>
                                    </Paper>
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, px: 1 }}>
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ p: 3, borderTop: '1px solid #E2E8F0', bgcolor: 'white' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <IconButton color="primary">
                                    <Mic />
                                </IconButton>
                                <TextField
                                    fullWidth
                                    placeholder="Escribe un mensaje..."
                                    variant="outlined"
                                    size="small"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <IconButton color="primary" onClick={handleSend} disabled={!text.trim()}>
                                    <Send />
                                </IconButton>
                            </Stack>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#A0AEC0' }}>
                        <Celebration sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                        <Typography variant="body1">Selecciona una conversación para empezar</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default TalentInbox;
