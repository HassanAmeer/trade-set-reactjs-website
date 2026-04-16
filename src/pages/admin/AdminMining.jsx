import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, query, orderBy } from 'firebase/firestore';
import { Clock, Search, Lock, Unlock, Pickaxe } from 'lucide-react';

const AdminMining = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // 1. Fetch from 'trades' subcollections
            const q = query(collectionGroup(db, 'trades'));
            const querySnapshot = await getDocs(q);
            const tradesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Fetch from individual user documents (to catch records stored in miningHistory)
            const usersSnap = await getDocs(query(collection(db, 'users')));
            const usersHistoryList = [];
            
            usersSnap.forEach(userDoc => {
                const userData = userDoc.data();
                if (userData.miningHistory && Array.isArray(userData.miningHistory)) {
                    userData.miningHistory.forEach(item => {
                        usersHistoryList.push({
                            ...item,
                            userEmail: userData.email,
                            username: userData.username || userData.fullName || 'User',
                            userId: userDoc.id,
                            category: item.category || 'mining'
                        });
                    });
                }
            });

            // 3. Merge and Deduplicate (by ID)
            const combinedMap = {};
            [...tradesList, ...usersHistoryList].forEach(item => {
                if (item.id) combinedMap[item.id] = item;
            });
            
            const list = Object.values(combinedMap).filter(log => 
                log.category === 'mining' || 
                ['FREEZE', 'RELEASE', 'SECURE', 'LIQUIDATE'].includes(log.direction) ||
                ['buy', 'sell', 'freeze', 'release'].includes(log.type)
            );
            
            // Sort locally
            list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            setLogs(list);
        } catch (error) {
            console.error("Error fetching mining logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
// ... skeleton code same ...
        <div>
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
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Pickaxe color="var(--accent-gold)" /> Mining Logs
            </h2>

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
                <button onClick={fetchLogs} style={{ padding: '0 20px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Refresh</button>
            </div>

            <div className="admin-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #222', color: '#888', fontSize: '13px' }}>
                            <th style={{ padding: '20px' }}>Asset</th>
                            <th>Status</th>
                            <th>Invested</th>
                            <th>Current/Release Val</th>
                            <th>User</th>
                            <th>Time</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '14px' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: '700', color: '#fff' }}>{log.asset}</div>
                                    <div style={{ fontSize: '10px', color: '#555' }}>Qty: {log.assetAmount?.toFixed(6)}</div>
                                </td>
                                <td>
                                    <span style={{
                                        color: (log.direction === 'FREEZE' || log.type === 'freeze' || log.type === 'buy') ? '#ff4d4f' : '#00c087',
                                        backgroundColor: (log.direction === 'FREEZE' || log.type === 'freeze' || log.type === 'buy') ? 'rgba(255,77,79,0.1)' : 'rgba(0,192,135,0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: '800'
                                    }}>
                                        {(log.direction === 'FREEZE' || log.type === 'freeze' || log.type === 'buy') ? 'FROZEN' : 'RELEASED'}
                                    </span>
                                </td>
                                <td style={{ fontWeight: '700', color: '#888' }}>
                                    {log.amount?.toFixed(2)} USDT
                                </td>
                                <td style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                                    {log.releaseValue?.toFixed(2) || log.currentValue?.toFixed(2) || '---'} USDT
                                </td>
                                <td>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{log.username || 'N/A'}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>{log.userEmail}</div>
                                    <div style={{ fontSize: '10px', color: '#444' }}>ID: {log.userId?.slice(-6).toUpperCase()}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {new Date(log.timestamp).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ 
                                        color: (log.resultAmount || 0) >= 0 ? '#00c087' : '#ff4d4f',
                                        fontWeight: '700',
                                        fontSize: '12px'
                                    }}>
                                        {(log.resultAmount || 0) >= 0 ? '+' : ''}{log.resultAmount?.toFixed(2) || '0.00'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#555' }}>No mining logs found</div>
                )}
            </div>
        </div>
    );
};

export default AdminMining;
