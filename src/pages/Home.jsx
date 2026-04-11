import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import {
    CreditCard, Wallet, ArrowRightLeft, Headphones, Volume2, Menu, Mail, Globe, Zap
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { assets } = useMarket();
    const [activeTab, setActiveTab] = useState('Foreign Exchange');
    const navigate = useNavigate();

    const filteredAssets = assets.filter(a => a.category === activeTab);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
        >
            <div className="flex-between" style={{ marginBottom: '16px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={20} fill="var(--accent-gold)" /> Bitop
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Mail size={22} color="var(--text-primary)" onClick={() => navigate('/inbox')} style={{ cursor: 'pointer' }} />
                    <Globe size={22} color="var(--text-primary)" onClick={() => navigate('/language')} style={{ cursor: 'pointer' }} />
                </div>
            </div>

            <div className="hero-container">
                <img src={heroImage} alt="Trading Hero" className="hero-image" />
                <div className="hero-overlay"></div>
            </div>

            <div className="flex-between" style={{ marginBottom: '16px', padding: '0 4px' }}>
                <Volume2 size={20} color="var(--accent-gold)" />
                <Menu size={24} color="var(--text-primary)" onClick={() => navigate('/news')} style={{ cursor: 'pointer' }} />
            </div>

            <div className="action-grid">
                <div className="action-item" onClick={() => navigate('/deposit')}>
                    <div className="action-icon"><CreditCard size={20} /></div>
                    <span className="action-label">Deposit</span>
                </div>
                <div className="action-item" onClick={() => navigate('/withdrawal')}>
                    <div className="action-icon"><Wallet size={20} /></div>
                    <span className="action-label">Withdrawal</span>
                </div>
                <div className="action-item" onClick={() => navigate('/c2c')}>
                    <div className="action-icon"><ArrowRightLeft size={20} /></div>
                    <span className="action-label">C2C</span>
                </div>
                <div className="action-item" onClick={() => navigate('/support')}>
                    <div className="action-icon"><Headphones size={20} /></div>
                    <span className="action-label">Customer service</span>
                </div>
            </div>

            <div className="ticker-section">
                {assets.slice(0, 3).map(asset => (
                    <div key={asset.id} className="ticker-card">
                        <div className="ticker-pair">{asset.name}</div>
                        <div className="ticker-price">{asset.rate}</div>
                        <div className="ticker-change" style={{ color: asset.change.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {asset.change}
                        </div>
                    </div>
                ))}
            </div>

            <div className="asset-tabs">
                {['Foreign Exchange', 'Cryptocurrency', 'Precious Metals'].map(tab => (
                    <div
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            <div className="asset-list">
                <div className="asset-header">
                    <span>Currency</span>
                    <span>New exchange rate</span>
                    <span style={{ textAlign: 'center' }}>Exchange rate changes</span>
                </div>

                {filteredAssets.map((asset, index) => {
                    const isUp = asset.change.startsWith('+');
                    return (
                        <motion.div
                            layout
                            key={asset.id}
                            className="asset-row"
                            style={{ '--index': index }}
                        >
                            <div className="asset-info">
                                <img src={asset.flag} alt={asset.name} className="asset-flag" />
                                <span className="asset-name">{asset.name}</span>
                            </div>
                            <div className="asset-rate">{asset.rate}</div>
                            <div style={{ justifySelf: 'end' }}>
                                <div className={`rate-btn ${isUp ? 'rate-up' : 'rate-down'}`}>
                                    {asset.change}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default Home;
