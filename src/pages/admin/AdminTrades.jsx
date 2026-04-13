import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, query, orderBy } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';

const AdminTrades = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        setLoading(true);
        try {
            const q = query(collectionGroup(db, 'trades'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTrades(list);
        } catch (error) {
            console.error("Error fetching trades:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTrades = trades.filter(t => 
        t.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '280px', height: '35px', marginBottom: '30px' }}></div>
            <div className="admin-table-container">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '50px', borderRadius: '10px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ color: '#fff' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>Global Trading History</h2>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by asset or user email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff' }}
                    />
                </div>
                <button onClick={fetchTrades} style={{ padding: '0 20px', backgroundColor: '#00c087', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Refresh</button>
            </div>

            <div className="admin-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #222', color: '#888', fontSize: '13px' }}>
                            <th style={{ padding: '20px' }}>Asset</th>
                            <th>Direction</th>
                            <th>Amount</th>
                            <th>Rate</th>
                            <th>User (UID)</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.map(trade => (
                            <tr key={trade.id} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '14px' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: '700' }}>{trade.asset}</div>
                                </td>
                                <td>
                                    <span style={{ 
                                        color: trade.direction === 'BUY' ? '#00c087' : '#ff4d4f',
                                        backgroundColor: trade.direction === 'BUY' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {trade.direction}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{trade.amount} USDT</td>
                                <td style={{ color: '#888' }}>{trade.entryRate}</td>
                                <td>
                                    <div style={{ fontSize: '12px', color: '#ccc' }}>{trade.userEmail || 'User'}</div>
                                    <div style={{ fontSize: '10px', color: '#555' }}>ID: {trade.userId?.slice(-6).toUpperCase()}</div>
                                </td>
                                <td style={{ fontSize: '12px', color: '#888' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {new Date(trade.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ color: trade.status === 'open' ? '#00c087' : '#888' }}>{trade.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTrades.length === 0 && (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>No trades found.</div>
                )}
            </div>
        </div>
    );
};

export default AdminTrades;
