import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, Settings2, Save } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editBalance, setEditBalance] = useState('');

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            }));
            // Sort by createdAt desc if exists
            list.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setUsers(list);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (user) => {
        try {
            const newStatus = !user.isActive;
            await updateDoc(user.ref, { isActive: newStatus });
            fetchAllUsers();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    const handleSaveBalance = async (user) => {
        try {
            await updateDoc(user.ref, { balance: parseFloat(editBalance) });
            setEditingUser(null);
            fetchAllUsers();
        } catch (error) {
            alert('Failed to update balance');
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading users...</div>;

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Users Management</h2>
            
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>User Details</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>KYC Verified</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Balance</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ color: '#00c087', fontSize: '14px', fontWeight: '700' }}>{user.email}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Name: {user.name || 'N/A'} | Phone: {user.phone || 'N/A'}</div>
                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>UID: {user.id}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '11px', 
                                        fontWeight: '700',
                                        backgroundColor: user.isActive !== false ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        color: user.isActive !== false ? '#00c087' : '#ff4d4f'
                                    }}>
                                        {user.isActive !== false ? 'ACTIVE' : 'BLOCKED'}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {user.isVerified ? (
                                        <CheckCircle2 size={18} color="#00c087" />
                                    ) : (
                                        <XCircle size={18} color="#ff4d4f" />
                                    )}
                                </td>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '700' }}>
                                    {editingUser === user.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="number" 
                                                value={editBalance} 
                                                onChange={(e) => setEditBalance(e.target.value)}
                                                style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #00c087', background: '#111', color: '#fff' }}
                                            />
                                            <button 
                                                onClick={() => handleSaveBalance(user)}
                                                style={{ background: '#00c087', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button 
                                                onClick={() => setEditingUser(null)}
                                                style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {user.balance || 0} USDT
                                            <Settings2 
                                                size={14} 
                                                color="#888" 
                                                style={{ cursor: 'pointer' }} 
                                                onClick={() => {
                                                    setEditingUser(user.id);
                                                    setEditBalance(user.balance || 0);
                                                }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <button 
                                        onClick={() => handleToggleActive(user)}
                                        style={{ 
                                            backgroundColor: user.isActive !== false ? '#ff4d4f' : '#00c087', 
                                            color: '#fff', 
                                            border: 'none', 
                                            padding: '6px 12px', 
                                            borderRadius: '6px', 
                                            fontSize: '12px', 
                                            fontWeight: '700', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        {user.isActive !== false ? 'Block User' : 'Unblock User'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
