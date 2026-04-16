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
        t.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (trade) => {
        if (trade.status === 'profit' || trade.status === 'Completed') return '#00c087';
        if (trade.status === 'loss' || trade.direction === 'FREEZE') return '#ff4d4f';
        if (trade.status === 'open' || trade.status === 'Pending') return 'var(--accent-gold)';
        return '#888';
    };

    const getDirectionColor = (dir) => {
        if (dir === 'BUY' || dir === 'RELEASE' || dir === 'SECURE') return '#00c087';
        if (dir === 'SELL' || dir === 'FREEZE' || dir === 'LIQUIDATE') return '#ff4d4f';
        return '#888';
    };

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '280px', height: '35px', marginBottom: '30px' }}></div>
            <div className="admin-table-container">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '50px', borderRadius: '10px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ color: '#fff' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>Trade Logs</h2>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by asset, symbol or user email..."
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
                            <th>Action</th>
                            <th>USDT Value</th>
                            <th>Entry Rate</th>
                            <th>User (UID)</th>
                            <th>Time</th>
                            <th>Outcome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.map(trade => (
                            <tr key={trade.id} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '14px' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: '700' }}>{trade.asset || trade.symbol}</div>
                                    <div style={{ fontSize: '10px', color: '#555' }}>Type: {trade.category || (trade.direction === 'BUY' || trade.direction === 'SELL' ? 'Binary Trade' : 'Unknown')}</div>
                                </td>
                                <td>
                                    <span style={{
                                        color: getDirectionColor(trade.direction),
                                        backgroundColor: `${getDirectionColor(trade.direction)}15`,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {trade.direction || trade.type?.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                                    {(trade.amount || trade.usdtAmount || 0).toFixed(2)} USDT
                                </td>
                                <td style={{ color: '#888' }}>{trade.entryRate || trade.rate}</td>
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
                                    <span style={{
                                        color: getStatusColor(trade),
                                        fontWeight: '700',
                                        fontSize: '11px'
                                    }}>
                                        {trade.status === 'profit' ? `+${trade.resultAmount?.toFixed(2)} Profit` :
                                            trade.status === 'loss' ? `-${Math.abs(trade.amount || 0).toFixed(2)} Loss` :
                                                trade.status?.toUpperCase() || 'COMPLETED'}
                                    </span>
                                    {trade.intendedOutcome && (
                                        <div style={{ fontSize: '9px', color: '#444', marginTop: '2px' }}>
                                            Result: {trade.intendedOutcome === 'win' ? 'FORCED WIN' : 'FORCED LOSS'}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTrades.length === 0 && (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>No Trades found</div>
                )}
            </div>
        </div>
    );
};

export default AdminTrades;
