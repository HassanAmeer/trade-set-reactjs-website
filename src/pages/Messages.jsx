import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
    const navigate = useNavigate();

    const dummyMessages = [
        {
            id: 1,
            title: 'Welcome to Bitop',
            description: 'Registration successful! Enjoy your trading journey with us.',
            time: '2026-03-05 10:24',
            type: 'notification'
        },
        {
            id: 2,
            title: 'Security Alert',
            description: 'Your account was logged in from a new device (iPhone 15 Pro).',
            time: '2026-03-04 15:45',
            type: 'alert'
        },
        {
            id: 3,
            title: 'Market Update',
            description: 'BTC has reached a new monthly high of $72,000!',
            time: '2026-03-03 09:12',
            type: 'info'
        },
        {
            id: 4,
            title: 'Promotion',
            description: 'Deposit 100 USDT and get a 10 USDT trading bonus!',
            time: '2026-03-01 12:00',
            type: 'info'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0', color: '#fff' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #222',
                background: 'var(--bg-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Inbox</h1>
            </div>

            {/* Messages List */}
            <div style={{ padding: '0' }}>
                {dummyMessages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            padding: '16px',
                            borderBottom: '1px solid #222',
                            display: 'flex',
                            gap: '12px',
                            background: 'transparent'
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(240, 185, 11, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-gold)'
                        }}>
                            {msg.type === 'alert' ? <Bell size={20} /> : <Info size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700' }}>{msg.title}</span>
                                <span style={{ fontSize: '11px', color: '#666' }}>{msg.time}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                                {msg.description}
                            </p>
                        </div>
                    </div>
                ))}
                {dummyMessages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666' }}>
                        No messages found
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Messages;
