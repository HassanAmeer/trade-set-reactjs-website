import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Paperclip, X, Image as ImageIcon, FileText, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { uploadFileChunks } from '../services/dbs';

const LiveChat = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [textMsg, setTextMsg] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Listen to messages
    useEffect(() => {
        if (!user) return;

        const msgsRef = collection(db, 'chat_sessions', user.id, 'messages');
        const q = query(msgsRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(list);
            scrollToBottom();
        }, (error) => {
            console.error("Error loading chat messages:", error);
        });

        // Mark messages as read for User
        const sessionRef = doc(db, 'chat_sessions', user.id);
        updateDoc(sessionRef, { unreadUser: 0 }).catch(err => {
            // If the document doesn't exist yet, we don't need to update it
            console.log("No existing session to update unread count for");
        });

        return () => unsubscribe();
    }, [user]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setUploadProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (!textMsg.trim() && !selectedFile) return;

        setSending(true);
        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        try {
            if (selectedFile) {
                setUploadProgress(0);
                const res = await uploadFileChunks(selectedFile, (progress) => {
                    setUploadProgress(progress);
                });
                if (res.success) {
                    fileUrl = res.url;
                    fileName = selectedFile.name;
                    fileType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
                } else {
                    throw new Error("File upload failed: " + res.error);
                }
            }

            const messageData = {
                text: textMsg.trim() || '',
                sender: 'user',
                timestamp: new Date().toISOString(),
                read: false,
                fileUrl,
                fileName,
                fileType
            };

            // Add message to subcollection
            await addDoc(collection(db, 'chat_sessions', user.id, 'messages'), messageData);

            // Update/Set session root document
            const sessionRef = doc(db, 'chat_sessions', user.id);
            await setDoc(sessionRef, {
                userId: user.id,
                userName: user.name || user.email.split('@')[0],
                userEmail: user.email,
                lastMessage: textMsg.trim() ? textMsg.trim() : `📎 [${fileType}] ${fileName}`,
                lastMessageAt: new Date().toISOString(),
                unreadAdmin: increment(1),
                unreadUser: 0
            }, { merge: true });

            setTextMsg('');
            removeFile();
            scrollToBottom();
        } catch (error) {
            alert(error.message);
        } finally {
            setSending(false);
            setUploadProgress(null);
        }
    };

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
                minHeight: '100vh',
                backgroundColor: '#0a0a0a',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000
            }}
        >
            {/* Header */}
            <div style={{
                background: 'rgba(17, 17, 17, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #222',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <ChevronLeft size={24} style={{ cursor: 'pointer', color: '#ffb800' }} onClick={() => navigate(-1)} />
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffb800' }}>Live Support</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00c087' }}></span>
                            <span style={{ fontSize: '12px', color: '#888' }}>Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                backgroundColor: '#0e0e0e',
                backgroundImage: 'radial-gradient(rgba(255,184,0,0.02) 1px, transparent 0)',
                backgroundSize: '24px 24px'
            }}>
                {messages.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#555',
                        textAlign: 'center',
                        padding: '40px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 184, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: '#ffb800'
                        }}>
                            <Send size={36} style={{ transform: 'rotate(-45deg)' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Start Conversation</h3>
                        <p style={{ fontSize: '13px', color: '#888', maxWidth: '280px', lineHeight: '1.5' }}>
                            Type a message below or attach a document to chat with our online support agent.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                                    width: '100%'
                                }}
                            >
                                <div style={{
                                    maxWidth: '75%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isAdmin ? 'flex-start' : 'flex-end'
                                }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: isAdmin ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                        backgroundColor: isAdmin ? 'rgba(0, 192, 135, 0.12)' : 'rgba(240, 185, 11, 0.12)',
                                        border: isAdmin ? '1px solid rgba(0, 192, 135, 0.25)' : '1px solid rgba(240, 185, 11, 0.25)',
                                        color: '#eee',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        wordBreak: 'break-word',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}>
                                        {/* File attachment rendering */}
                                        {msg.fileUrl && (
                                            <div style={{ marginBottom: msg.text ? '10px' : 0 }}>
                                                {msg.fileType === 'image' ? (
                                                    <img
                                                        src={msg.fileUrl}
                                                        alt={msg.fileName}
                                                        onClick={() => window.open(msg.fileUrl, '_blank')}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '220px',
                                                            borderRadius: '12px',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer',
                                                            display: 'block'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        padding: '10px 14px',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}>
                                                        <FileText size={24} color="#ffb800" style={{ flexShrink: 0 }} />
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {msg.fileName}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Document</div>
                                                        </div>
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                marginLeft: 'auto',
                                                                color: '#ffb800',
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {msg.text && <div>{msg.text}</div>}
                                    </div>
                                    <span style={{
                                        fontSize: '10px',
                                        color: '#555',
                                        marginTop: '4px',
                                        padding: '0 4px'
                                    }}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{
                padding: '16px 20px',
                background: 'rgba(17, 17, 17, 0.95)',
                borderTop: '1px solid #222',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0
            }}>
                {/* Selected file preview */}
                <AnimatePresence>
                    {selectedFile && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: 'rgba(255,184,0,0.05)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(240, 185, 11, 0.2)',
                                overflow: 'hidden'
                            }}
                        >
                            {selectedFile.type.startsWith('image/') ? (
                                <ImageIcon size={18} color="#ffb800" />
                            ) : (
                                <FileText size={18} color="#ffb800" />
                            )}
                            <span style={{ fontSize: '13px', color: '#eee', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedFile.name}
                            </span>
                            {uploadProgress !== null && (
                                <span style={{ fontSize: '11px', color: '#ffb800', fontWeight: 'bold' }}>
                                    {uploadProgress}%
                                </span>
                            )}
                            <button
                                onClick={removeFile}
                                disabled={sending}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid #222',
                            color: '#888',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ffb800'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    <input
                        type="text"
                        value={textMsg}
                        onChange={(e) => setTextMsg(e.target.value)}
                        placeholder="Type message here..."
                        disabled={sending}
                        style={{
                            flex: 1,
                            height: '42px',
                            backgroundColor: '#111',
                            border: '1px solid #222',
                            borderRadius: '10px',
                            color: '#fff',
                            padding: '0 15px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#ffb800'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#222'}
                    />

                    <button
                        type="submit"
                        disabled={sending || (!textMsg.trim() && !selectedFile)}
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: (textMsg.trim() || selectedFile) && !sending ? '#ffb800' : 'rgba(255,184,0,0.1)',
                            border: 'none',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (textMsg.trim() || selectedFile) && !sending ? 'pointer' : 'not-allowed',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        {sending ? (
                            <Loader2 className="animate-spin" size={18} color="#000" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default LiveChat;
