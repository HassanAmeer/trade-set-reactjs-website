import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

const AdminDeposits = () => {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllDeposits();
    }, []);

    const fetchAllDeposits = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collectionGroup(db, 'deposits'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            }));
            // Sort by timestamp desc
            list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setDeposits(list);
        } catch (error) {
            console.error("Error fetching deposits:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (depositRef, newStatus) => {
        try {
            await updateDoc(depositRef, { status: newStatus });
            // Refresh list
            fetchAllDeposits();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading deposits...</div>;

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Deposit Requests</h2>
            
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Date / Time</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>User Email</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Amount</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Voucher</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deposits.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '16px', fontSize: '13px' }}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '16px', fontSize: '13px', color: '#00c087' }}>
                                    {item.userEmail || item.uid}
                                </td>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '700' }}>
                                    {item.amount} USDT
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <a href={item.screenshot} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00c087', fontSize: '12px', textDecoration: 'none', backgroundColor: 'rgba(0,192,135,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                        View <ExternalLink size={12} />
                                    </a>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '11px', 
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        backgroundColor: item.status === 'pending' ? 'rgba(255,184,0,0.1)' : item.status === 'approved' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        color: item.status === 'pending' ? '#ffb800' : item.status === 'approved' ? '#00c087' : '#ff4d4f'
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                                    {item.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={() => handleUpdateStatus(item.ref, 'approved')}
                                                style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(item.ref, 'rejected')}
                                                style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {deposits.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No deposits found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDeposits;
