import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const NewsAndBlog = () => {
    const navigate = useNavigate();
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const q = query(collection(db, 'news_blogs'), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNewsData(list);
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                padding: '0 0 40px 0',
                color: '#fff'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid #222',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-primary)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                    <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>News And Blog</h1>
                </div>
                <Share2 size={20} style={{ cursor: 'pointer', color: '#888' }} />
            </div>

            <div style={{ padding: '20px 16px' }}>
                {loading && <div style={{ textAlign: 'center', color: '#888', padding: '50px 0' }}>Loading news...</div>}
                
                {!loading && newsData.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', padding: '100px 0' }}>
                        No news available yet.
                    </div>
                )}

                {!loading && newsData.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            marginBottom: '24px',
                            background: '#111',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid #222'
                        }}
                    >
                        {item.image && (
                            <div style={{ width: '100%', height: '180px', backgroundColor: '#1a1a1a' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                        <div style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, lineHeight: '1.4', flex: 1, paddingRight: '12px' }}>
                                    {item.title}
                                </h2>
                                <span style={{ fontSize: '11px', color: 'var(--accent-gold)', whiteSpace: 'nowrap', background: 'rgba(240, 185, 11, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                    {item.category || 'Crypto'}
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                                {item.description}
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666' }}>
                                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                <span>Views: {item.views || Math.floor(Math.random() * 2000) + 100}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default NewsAndBlog;
