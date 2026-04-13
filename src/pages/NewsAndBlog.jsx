import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, LucideTableOfContents, Newspaper, Share2 } from 'lucide-react';
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
                <Newspaper size={20} style={{ cursor: 'pointer', color: '#888' }} />
            </div>

            <div style={{ padding: '20px 16px' }}>
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>
                        ))}
                    </div>
                )}

                {!loading && newsData.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', padding: '100px 0' }}>
                        No news available yet.
                    </div>
                )}

                {!loading && newsData.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(`/news/${item.id}`)}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '16px',
                            background: '#111',
                            borderRadius: '12px',
                            padding: '12px',
                            alignItems: 'center',
                            border: '1px solid #222',
                            cursor: 'pointer'
                        }}
                    >
                        {/* Thumbnail Image */}
                        {item.image ? (
                            <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#1a1a1a' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#555', fontSize: '10px' }}>No Image</span>
                            </div>
                        )}

                        {/* Title and details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.title}
                                    </h2>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--accent-gold)', background: 'rgba(240, 185, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                                    {item.category || 'News'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#666' }}>
                                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                <span>{item.views || 0} views</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

            </div>
        </motion.div>
    );
};

export default NewsAndBlog;
