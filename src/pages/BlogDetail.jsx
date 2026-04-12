import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Calendar, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase-setup';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const BlogDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const docRef = doc(db, 'news_blogs', id);
                const snapshot = await getDoc(docRef);
                
                if (snapshot.exists()) {
                    setBlog({ id: snapshot.id, ...snapshot.data() });
                    // Increment views
                    await updateDoc(docRef, {
                        views: increment(1)
                    });
                }
            } catch (error) {
                console.error("Error fetching blog details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlog();
        }
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div className="circular-loader-simple"></div>
        </div>
    );

    if (!blog) return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#fff', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
            <h2>Blog Not Found</h2>
            <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', marginTop: '20px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px' }}>Go Back</button>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 60px 0', color: '#fff' }}
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
                </div>
                <Share2 size={20} style={{ cursor: 'pointer', color: '#888' }} />
            </div>

            <div style={{ padding: '20px 16px' }}>
                <span style={{ 
                    display: 'inline-block',
                    fontSize: '12px', 
                    color: 'var(--accent-gold)', 
                    background: 'rgba(240, 185, 11, 0.1)', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontWeight: '600'
                }}>
                    {blog.category || 'News'}
                </span>
                
                <h1 style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.4', marginBottom: '16px' }}>
                    {blog.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', color: '#888', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(blog.timestamp).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} />
                        {(blog.views || 0) + 1} views
                    </div>
                </div>

                {blog.image && (
                    <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', backgroundColor: '#111' }}>
                        <img 
                            src={blog.image} 
                            alt={blog.title} 
                            style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }} 
                        />
                    </div>
                )}

                <div style={{ 
                    fontSize: '15px', 
                    color: '#ddd', 
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                }}>
                    {blog.description}
                </div>
            </div>
        </motion.div>
    );
};

export default BlogDetail;
