import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, updateDoc, doc, increment, getDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { CheckCircle2, XCircle, ExternalLink, Trash2, Copy, Check } from 'lucide-react';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchAllWithdrawals();
    }, []);

    const handleCopy = (address, id) => {
        navigator.clipboard.writeText(address);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const fetchAllWithdrawals = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collectionGroup(db, 'withdrawals'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            }));
            // Sort by timestamp desc
            list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setWithdrawals(list);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (item, newStatus) => {
        try {
            const uid = item.userId || item.uid;

            if (newStatus === 'rejected') {
                // Refund balance if rejected (since it was deducted on request)
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    balance: increment(Number(item.amount))
                });
                // Send rejection notification
                await addDoc(collection(db, 'users', uid, 'messages'), {
                    title: '❌ Withdrawal Rejected',
                    description: `Your withdrawal of ${item.amount} USDT was rejected. The amount has been refunded to your balance.`,
                    type: 'alert',
                    read: false,
                    timestamp: new Date().toISOString()
                });
            }

            if (newStatus === 'approved') {
                // Balance already cut at request time — just send notification
                await addDoc(collection(db, 'users', uid, 'messages'), {
                    title: '✅ Withdrawal Approved',
                    description: `Your withdrawal of ${item.amount} USDT has been approved and is being processed.`,
                    type: 'alert',
                    read: false,
                    timestamp: new Date().toISOString()
                });
            }

            await updateDoc(item.ref, { status: newStatus });
            fetchAllWithdrawals();
        } catch (error) {
            console.error(error);
            alert('Failed to update status: ' + error.message);
        }
    };

    const handleDelete = async (itemRef) => {
        if (!window.confirm("Delete this record?")) return;
        try {
            await deleteDoc(itemRef);
            fetchAllWithdrawals();
        } catch (error) {
            alert("Delete failed");
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading withdrawals...</div>;

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Withdrawal Requests</h2>
            
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Date / Time</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>User Email</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Amount</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Method</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Dest Address</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.map((item) => (
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
                                <td style={{ padding: '16px', fontSize: '13px' }}>
                                    {item.method || 'USDT'}
                                </td>
                                <td style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#fff' }}>{item.address}</span>
                                        <div 
                                            onClick={() => handleCopy(item.address, item.id)}
                                            style={{ cursor: 'pointer', color: copiedId === item.id ? '#00c087' : '#888' }}
                                        >
                                            {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                                        </div>
                                    </div>
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
                                <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {item.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={() => handleUpdateStatus(item, 'approved')}
                                                style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(item, 'rejected')}
                                                style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {/* Delete icon ONLY if status is approved */}
                                    {item.status === 'approved' && (
                                        <button 
                                            onClick={() => handleDelete(item.ref)}
                                            style={{ backgroundColor: 'transparent', color: '#666', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {withdrawals.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No withdrawal requests found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWithdrawals;
