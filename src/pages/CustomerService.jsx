import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, addDoc } from 'firebase/firestore';

const CustomerService = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!phone || !message) {
            alert('Please fill out all fields');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'support_messages'), {
                userId: user?.id || 'guest',
                userEmail: user?.email || 'guest',
                phone: phone,
                content: message,
                timestamp: new Date().toISOString(),
                status: 'unread'
            });
            alert('Message submitted successfully. Admin will reply to your Inbox.');
            setMessage('');
            setPhone('');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-container"
            style={{
                minHeight: '100vh',
                background: '#f5f5f5',
                padding: '0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            <div style={{ background: '#007bff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronLeft size={24} color="#fff" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0' }}>Leave us a message</h1>
            </div>

            <div style={{ padding: '20px 16px', background: '#fff', color: '#000' }}>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
                    Hello, we are sorry that we are unable to provide you with service at the moment. If you need help, please leave a message. We will contact you as soon as possible and solve your problem.
                </p>

                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>
                    Phone <span style={{ color: '#ff4d4f' }}>*</span>
                </div>
                <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        marginBottom: '24px',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        color: '#000'
                    }}
                />

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: '0' }}>
                        Your Message <span style={{ color: '#ff4d4f' }}>*</span>
                    </p>
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your issue here..."
                    style={{
                        width: '100%',
                        height: '100px',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        marginBottom: '24px',
                        outline: 'none',
                        fontSize: '14px',
                        resize: 'none',
                        backgroundColor: '#fff',
                        color: '#000'
                    }}
                />

                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        width: '100%',
                        background: '#007bff',
                        color: '#fff',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit'}
                </button>
            </div>
        </motion.div>
    );
};

export default CustomerService;
