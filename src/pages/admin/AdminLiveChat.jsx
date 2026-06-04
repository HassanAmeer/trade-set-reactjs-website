import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, setDoc, increment } from 'firebase/firestore';
import { MessageSquare, Send, Paperclip, X, Image as ImageIcon, FileText, Download, Loader2, User, Mail, Search, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileChunks } from '../../services/dbs';

const AdminLiveChat = () => {
    const [sessions, setSessions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [textMsg, setTextMsg] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Fetch active chat sessions
    useEffect(() => {
        const q = query(collection(db, 'chat_sessions'), orderBy('lastMessageAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(list);
        }, (error) => {
            console.error("Error fetching chat sessions:", error);
        });

        return () => unsubscribe();
    }, []);

    // Fetch all users to merge
    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || doc.data().email.split('@')[0],
                email: doc.data().email,
                profile: doc.data().profile || '',
                createdAt: doc.data().createdAt || ''
            }));
            setUsers(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch messages for selected session
    useEffect(() => {
        if (!selectedSession) {
            setMessages([]);
            return;
        }

        const msgsRef = collection(db, 'chat_sessions', selectedSession.id, 'messages');
        const q = query(msgsRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setMessages(list);
            scrollToBottom();

            // Mark any unread user messages as read
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.sender === 'user' && !data.read) {
                    updateDoc(docSnap.ref, { read: true }).catch(err => {
                        console.error("Error marking user message as read:", err);
                    });
                }
            });

            // Mark messages as read for Admin (if the session exists)
            if (selectedSession.hasChat) {
                const sessionRef = doc(db, 'chat_sessions', selectedSession.id);
                updateDoc(sessionRef, {
                    unreadAdmin: 0,
                    lastReadByAdminAt: new Date().toISOString()
                }).catch(err => {
                    console.error("Error updating admin unread status:", err);
                });
            }
        }, (error) => {
            console.error("Error loading chat messages:", error);
        });

        return () => unsubscribe();
    }, [selectedSession]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
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
        if (!selectedSession) return;
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
                sender: 'admin',
                timestamp: new Date().toISOString(),
                read: false,
                fileUrl,
                fileName,
                fileType
            };

            // Add message
            await addDoc(collection(db, 'chat_sessions', selectedSession.id, 'messages'), messageData);

            // Update/Set session root document
            const sessionRef = doc(db, 'chat_sessions', selectedSession.id);
            await setDoc(sessionRef, {
                userId: selectedSession.id,
                userName: selectedSession.userName,
                userEmail: selectedSession.userEmail,
                lastMessage: textMsg.trim() ? textMsg.trim() : `📎 [${fileType}] ${fileName}`,
                lastMessageAt: new Date().toISOString(),
                unreadUser: increment(1),
                unreadAdmin: 0
            }, { merge: true });

            // Dynamically update the selectedSession local hasChat value so mark-as-read listener works
            if (!selectedSession.hasChat) {
                setSelectedSession(prev => ({ ...prev, hasChat: true }));
            }

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

    // Combine sessions and users
    const getSidebarItems = () => {
        const sessionMap = {};
        sessions.forEach(session => {
            sessionMap[session.id] = session;
        });

        const list = users.map(user => {
            const session = sessionMap[user.id];
            if (session) {
                return {
                    id: user.id,
                    userName: session.userName || user.name,
                    userEmail: session.userEmail || user.email,
                    profile: user.profile,
                    lastMessage: session.lastMessage,
                    lastMessageAt: session.lastMessageAt,
                    unreadAdmin: session.unreadAdmin || 0,
                    hasChat: true
                };
            } else {
                return {
                    id: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    profile: user.profile,
                    lastMessage: 'No conversation yet',
                    lastMessageAt: user.createdAt || '',
                    unreadAdmin: 0,
                    hasChat: false
                };
            }
        });

        // Sort: 1. Has active chat (ordered by lastMessageAt desc), 2. No active chat (ordered by createdAt desc)
        return list.sort((a, b) => {
            if (a.hasChat && !b.hasChat) return -1;
            if (!a.hasChat && b.hasChat) return 1;

            const dateA = new Date(a.lastMessageAt || 0);
            const dateB = new Date(b.lastMessageAt || 0);
            return dateB - dateA;
        });
    };

    const sidebarItems = getSidebarItems();

    const filteredSidebarItems = sidebarItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            (item.userName && item.userName.toLowerCase().includes(query)) ||
            (item.userEmail && item.userEmail.toLowerCase().includes(query))
        );
    });

    if (loading) {
        return (
            <div className="support-layout" style={{ border: 'none' }}>
                <div className="support-sidebar">
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="skeleton-loader" style={{ width: '150px', height: '25px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '40px', borderRadius: '8px' }}></div>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '60px', borderRadius: '10px', marginTop: '5px' }}></div>
                        ))}
                    </div>
                </div>
                <div className="support-main">
                    <div style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="skeleton-loader" style={{ width: '40%', height: '30px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '250px', borderRadius: '16px' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="support-layout">
            {/* Sidebar - Chat list */}
            <div className="support-sidebar">
                <div style={{ padding: '20px', borderBottom: '1px solid #111' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#00c087', marginBottom: '15px' }}>Live Chats</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#555' }} />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 38px',
                                background: '#111',
                                border: '1px solid #222',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredSidebarItems.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '14px' }}>
                            No users found
                        </div>
                    ) : (
                        filteredSidebarItems.map((item) => {
                            const isSelected = selectedSession?.id === item.id;
                            const hasUnread = item.unreadAdmin > 0;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedSession(item)}
                                    style={{
                                        padding: '15px 20px',
                                        borderBottom: '1px solid #111',
                                        cursor: 'pointer',
                                        background: isSelected ? 'rgba(0, 192, 135, 0.05)' : 'transparent',
                                        borderLeft: isSelected ? '4px solid #00c087' : '4px solid transparent',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden', marginRight: '10px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#888',
                                            flexShrink: 0
                                        }}>
                                            {item.profile ? (
                                                <img src={item.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }} />
                                            ) : (
                                                <User size={18} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: '800',
                                                    color: isSelected ? '#00c087' : '#eee',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {item.userName}
                                                </span>
                                                {!item.hasChat && (
                                                    <span style={{
                                                        fontSize: '9px',
                                                        padding: '1px 5px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(240, 185, 11, 0.15)',
                                                        color: '#f0b90b',
                                                        fontWeight: '800'
                                                    }}>
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: isSelected ? '#aaa' : '#666',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {item.lastMessage}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                        <span style={{ fontSize: '10px', color: '#444' }}>
                                            {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                        {hasUnread && (
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                background: '#ff4d4f',
                                                color: '#fff',
                                                fontWeight: 'bold'
                                            }}>
                                                {item.unreadAdmin}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat detail window */}
            <div className="support-main" style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedSession ? (
                    <>
                        {/* Selected User Header */}
                        <div style={{
                            padding: '20px 30px',
                            borderBottom: '1px solid #111',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#0d0d0d'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 192, 135, 0.1)',
                                    border: '1px solid rgba(0, 192, 135, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#00c087',
                                    overflow: 'hidden'
                                }}>
                                    {selectedSession.profile ? (
                                        <img src={selectedSession.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }} />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                                        {selectedSession.userName}
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <Mail size={12} /> {selectedSession.userEmail}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages space */}
                        <div 
                            ref={chatContainerRef}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '30px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                backgroundColor: '#070707'
                            }}
                        >
                            {(() => {
                                const liveSession = sessions.find(s => s.id === selectedSession.id) || selectedSession;
                                return messages.map((msg) => {
                                    const isAdmin = msg.sender === 'admin';
                                    const isSeen = msg.read || (liveSession?.lastReadByUserAt && msg.timestamp <= liveSession.lastReadByUserAt);
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                                width: '100%'
                                            }}
                                        >
                                            <div style={{
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isAdmin ? 'flex-end' : 'flex-start'
                                            }}>
                                                <div style={{
                                                    padding: '12px 16px',
                                                    borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    backgroundColor: isAdmin ? 'rgba(0, 192, 135, 0.12)' : '#1b1b1b',
                                                    border: isAdmin ? '1px solid rgba(0, 192, 135, 0.25)' : '1px solid #222',
                                                    color: '#eee',
                                                    fontWeight: 'normal',
                                                    fontSize: '14px',
                                                    lineHeight: '1.5',
                                                    wordBreak: 'break-word',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }}>
                                                    {/* Image / File display */}
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
                                                                        borderRadius: '8px',
                                                                        objectFit: 'cover',
                                                                        cursor: 'pointer',
                                                                        display: 'block'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                                    padding: '10px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                                }}>
                                                                    <FileText size={20} color="#ffb800" />
                                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                                                                        <div style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {msg.fileName}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={msg.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            marginLeft: 'auto',
                                                                            color: '#ffb800',
                                                                            padding: '4px',
                                                                            borderRadius: '4px',
                                                                            backgroundColor: 'rgba(240, 185, 11, 0.1)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center'
                                                                        }}
                                                                    >
                                                                        <Download size={14} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.text && <div>{msg.text}</div>}
                                                </div>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: '#444',
                                                    marginTop: '4px',
                                                    padding: '0 4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    {isAdmin && (
                                                        <CheckCheck size={14} color={isSeen ? '#f0b90b' : '#666'} />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '20px 30px',
                            background: '#0d0d0d',
                            borderTop: '1px solid #111',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {/* Selected attachment preview */}
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
                                            backgroundColor: 'rgba(0, 192, 135, 0.05)',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(0, 192, 135, 0.2)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {selectedFile.type.startsWith('image/') ? (
                                            <ImageIcon size={18} color="#00c087" />
                                        ) : (
                                            <FileText size={18} color="#00c087" />
                                        )}
                                        <span style={{ fontSize: '13px', color: '#eee', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedFile.name}
                                        </span>
                                        {uploadProgress !== null && (
                                            <span style={{ fontSize: '11px', color: '#00c087', fontWeight: 'bold' }}>
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
                                        backgroundColor: '#111',
                                        border: '1px solid #222',
                                        color: '#666',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
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
                                    placeholder="Type official reply..."
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
                                        outline: 'none'
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={sending || (!textMsg.trim() && !selectedFile)}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        backgroundColor: (textMsg.trim() || selectedFile) && !sending ? '#00c087' : 'rgba(0,192,135,0.1)',
                                        border: 'none',
                                        color: '#000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: (textMsg.trim() || selectedFile) && !sending ? 'pointer' : 'not-allowed',
                                        flexShrink: 0
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
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                        <MessageSquare size={80} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>Select a chat session to start conversation</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLiveChat;
