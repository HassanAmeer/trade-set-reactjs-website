import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, Trophy, Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';

const AdminRewards = () => {
    const [rewardsConfig, setRewardsConfig] = useState({
        active: false,
        levels: [
            { id: '1', label: 'VIP 1', deposit: 1000, reward: 200 },
            { id: '2', label: 'VIP 2', deposit: 3000, reward: 500 },
            { id: '3', label: 'VIP 3', deposit: 5000, reward: 1000 },
            { id: '4', label: 'VIP 4', deposit: 10000, reward: 2000 },
            { id: '5', label: 'VIP 5', deposit: 20000, reward: 4000 },
            { id: '6', label: 'VIP 6', deposit: 30000, reward: 6000 },
            { id: '7', label: 'VIP 7', deposit: 50000, reward: 10000 },
        ]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const ref = doc(db, 'admin_set', 'rewards');
            const snapshot = await getDoc(ref);
            if (snapshot.exists()) {
                setRewardsConfig(snapshot.data());
            }
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'admin_set', 'rewards'), rewardsConfig);
            alert('Rewards configuration updated successfully!');
        } catch (error) {
            alert('Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateLevel = (index, field, value) => {
        const newLevels = [...rewardsConfig.levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setRewardsConfig({ ...rewardsConfig, levels: newLevels });
    };

    const addLevel = () => {
        const nextId = (rewardsConfig.levels.length + 1).toString();
        setRewardsConfig({
            ...rewardsConfig,
            levels: [...rewardsConfig.levels, { id: nextId, label: `VIP ${nextId}`, deposit: 0, reward: 0 }]
        });
    };

    const removeLevel = (index) => {
        const newLevels = rewardsConfig.levels.filter((_, i) => i !== index);
        setRewardsConfig({ ...rewardsConfig, levels: newLevels });
    };

    if (loading) return (
        <div style={{ padding: '20px' }}>
            <div className="skeleton-loader" style={{ width: '300px', height: '40px', marginBottom: '40px' }}></div>
            <div className="skeleton-loader" style={{ width: '100%', height: '400px', borderRadius: '20px' }}></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', padding: '0 20px 50px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                        <Trophy size={32} color="#f0b90b" />
                        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>Deposit Rewards</h1>
                    </div>
                    <p style={{ color: '#666', fontSize: '14px' }}>Manage VIP tiers and bonus rewards for deposits.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111', padding: '10px 20px', borderRadius: '15px', border: '1px solid #222' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: rewardsConfig.active ? '#00c087' : '#555' }}>
                        SYSTEM {rewardsConfig.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                    <Toggle 
                        active={rewardsConfig.active} 
                        onClick={() => setRewardsConfig(prev => ({ ...prev, active: !prev.active }))} 
                        color="#00c087"
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', margin: 0 }}>Tier Configuration</h3>
                        <button 
                            onClick={addLevel}
                            style={{ background: 'rgba(240,185,11,0.1)', color: '#f0b90b', border: '1px solid rgba(240,185,11,0.2)', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Plus size={14} /> Add New Tier
                        </button>
                    </div>

                    <div style={{ padding: '25px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '20px', marginBottom: '15px', padding: '0 10px' }}>
                            <label style={labelStyle}>Tier Name</label>
                            <label style={labelStyle}>Required Deposit ($)</label>
                            <label style={labelStyle}>Bonus Reward ($)</label>
                            <label style={labelStyle}></label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <AnimatePresence>
                                {rewardsConfig.levels.map((level, index) => (
                                    <motion.div 
                                        key={level.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px', border: '1px solid #1a1a1a' }}
                                    >
                                        <input 
                                            type="text" 
                                            value={level.label} 
                                            onChange={(e) => updateLevel(index, 'label', e.target.value)} 
                                            style={inputStyle}
                                        />
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="number" 
                                                value={level.deposit} 
                                                onChange={(e) => updateLevel(index, 'deposit', parseFloat(e.target.value))} 
                                                style={{ ...inputStyle, paddingLeft: '25px' }}
                                            />
                                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '12px' }}>$</span>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="number" 
                                                value={level.reward} 
                                                onChange={(e) => updateLevel(index, 'reward', parseFloat(e.target.value))} 
                                                style={{ ...inputStyle, paddingLeft: '25px', color: '#00c087' }}
                                            />
                                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#00c087', fontSize: '12px' }}>$</span>
                                        </div>
                                        <button 
                                            onClick={() => removeLevel(index)}
                                            style={{ background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: 'none', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{ background: '#f0b90b', color: '#000', border: 'none', padding: '15px 40px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(240,185,11,0.2)' }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Rewards Config</>}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Reusable Components inside file
const Toggle = ({ active, onClick, color = '#f0b90b' }) => (
    <div 
        onClick={onClick}
        style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: active ? color : '#333',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s'
        }}
    >
        <div style={{
            position: 'absolute',
            top: '3px',
            left: active ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: active ? '#000' : '#888',
            transition: 'all 0.3s',
        }} />
    </div>
);

const labelStyle = {
    fontSize: '11px',
    color: '#555',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: '#0a0a0a',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
};

export default AdminRewards;
