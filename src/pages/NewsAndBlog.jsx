import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, TrendingUp, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const newsData = [
    {
        id: 1,
        category: 'Market',
        title: 'Bitcoin Surges Past $72,000 as Institutional Demand Rises',
        summary: 'Bitcoin has hit a new yearly high amidst growing demand from institutional investors and ETF inflows crossing $500M in a single day.',
        time: '2 hours ago',
        img: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80',
        featured: true,
    },
    {
        id: 2,
        category: 'Blog',
        title: 'How to Read Candlestick Charts: A Beginner\'s Guide',
        summary: 'Understanding candlestick charts is the first step to becoming a successful trader. This guide breaks it down simply.',
        time: '5 hours ago',
        img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
        featured: false,
    },
    {
        id: 3,
        category: 'Market',
        title: 'Ethereum 2.0 Staking Rewards Attract Millions of New Users',
        summary: 'The ETH staking ecosystem has expanded dramatically with over $40B locked in staking protocols globally.',
        time: '1 day ago',
        img: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80',
        featured: false,
    },
    {
        id: 4,
        category: 'Blog',
        title: 'Top 5 Risk Management Strategies Every Trader Should Know',
        summary: 'Risk management separates amateur traders from professionals. Here are five strategies that can protect your portfolio.',
        time: '2 days ago',
        img: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=400&q=80',
        featured: false,
    },
    {
        id: 5,
        category: 'Market',
        title: 'USDT Remains Dominant Stablecoin with $110B Market Cap',
        summary: 'Tether continues to dominate the stablecoin market, accounting for over 70% of all stablecoin volume in 2026.',
        time: '3 days ago',
        img: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=400&q=80',
        featured: false,
    },
];

const categories = ['All', 'Market', 'Blog'];

const NewsAndBlog = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = activeCategory === 'All'
        ? newsData
        : newsData.filter(n => n.category === activeCategory);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 80px 0', color: '#fff' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #222',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-primary)',
                zIndex: 10
            }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>
                    News & Blog
                </h1>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '16px', borderBottom: '1px solid #222' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '7px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            background: activeCategory === cat ? 'var(--accent-gold)' : '#2c2c2e',
                            color: activeCategory === cat ? '#000' : '#aaa',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Featured Article */}
            {filtered[0]?.featured && (
                <div style={{ padding: '16px' }}>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <img
                            src={filtered[0].img}
                            alt={filtered[0].title}
                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                            padding: '16px'
                        }}>
                            <span style={{ background: 'var(--accent-gold)', color: '#000', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', marginBottom: '6px', display: 'inline-block' }}>
                                {filtered[0].category}
                            </span>
                            <div style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1.3', color: '#fff' }}>
                                {filtered[0].title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#aaa', fontSize: '11px' }}>
                                <Clock size={12} />
                                <span>{filtered[0].time}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Article List */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filtered.filter(n => !n.featured).map((article, i) => (
                    <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            display: 'flex',
                            gap: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            border: '1px solid #2a2a2a'
                        }}
                    >
                        <img
                            src={article.img}
                            alt={article.title}
                            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                                background: article.category === 'Market' ? 'rgba(0,192,135,0.15)' : 'rgba(240,185,11,0.15)',
                                color: article.category === 'Market' ? '#00c087' : 'var(--accent-gold)',
                                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                                display: 'inline-block', marginBottom: '6px'
                            }}>
                                {article.category}
                            </span>
                            <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: '#fff' }}>
                                {article.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#666', fontSize: '11px' }}>
                                <Clock size={11} />
                                <span>{article.time}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
                    <Newspaper size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p>No articles found</p>
                </div>
            )}
        </motion.div>
    );
};

export default NewsAndBlog;
