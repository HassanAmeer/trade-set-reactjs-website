import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, Settings2, Save, Trash2, X, User as UserIcon, Phone, Mail, Wallet, TrendingUp, Users } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(list);
        } catch (error) {
            console.error("Error fetching users:", error);
            // Fallback if index not ready
            const querySnapshot = await getDocs(collection(db, 'users'));
             const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(list);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            balance: user.balance || 0,
            referralEarnings: user.referralEarnings || 0,
            tradeEarnings: user.tradeEarnings || 0,
            totalReferrals: user.totalReferrals || 0,
            isActive: user.isActive !== false,
            isVerified: user.isVerified || false,
            password: user.password || ''
        });
    };

    const handleSaveUser = async () => {
        try {
            const userRef = doc(db, 'users', selectedUser.id);
            const updatedData = {
                ...editForm,
                balance: Number(editForm.balance),
                referralEarnings: Number(editForm.referralEarnings),
                tradeEarnings: Number(editForm.tradeEarnings),
                totalReferrals: Number(editForm.totalReferrals),
                updatedAt: new Date().toISOString()
            };
            await updateDoc(userRef, updatedData);
            setSelectedUser(null);
            fetchAllUsers();
            alert('User updated successfully');
        } catch (error) {
            alert('Failed to update user: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you SURE you want to delete this user? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
            fetchAllUsers();
        } catch (error) {
            alert('Delete failed');
        }
    };

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading users database...</div>;

    return (
        <div style={{ padding: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', margin: 0 }}>User Management</h2>
                <div style={{ fontSize: '14px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '6px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                    Total Users: <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{users.length}</span>
                </div>
            </div>
            
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#111', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>User Details</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Status & KYC</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Referral Stats</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Financials</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #222', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'rgba(0,192,135,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c087' }}>
                                            {user.profile ? (
                                                <img src={user.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <UserIcon size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{user.name || 'N/A'}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{user.email}</div>
                                            <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>UID: {user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ 
                                            display: 'inline-flex', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', width: 'fit-content',
                                            backgroundColor: user.isActive !== false ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                            color: user.isActive !== false ? '#00c087' : '#ff4d4f'
                                        }}>
                                            {user.isActive !== false ? 'ACTIVE' : 'BLOCKED'}
                                        </span>
                                        <span style={{ 
                                            display: 'inline-flex', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', width: 'fit-content',
                                            backgroundColor: user.isVerified ? 'rgba(0,192,135,0.1)' : 'rgba(255,184,0,0.1)',
                                            color: user.isVerified ? '#00c087' : '#ffb800'
                                        }}>
                                            {user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '13px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ color: '#666' }}>Total Referral:</span>
                                            <span style={{ fontWeight: '700' }}>{user.totalReferrals || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ color: '#666' }}>Refer EARN:</span>
                                            <span style={{ color: '#00c087', fontWeight: '700' }}>{user.referralEarnings || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid #222', paddingTop: '4px' }}>
                                            <span style={{ color: '#666' }}>Ref By:</span>
                                            <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                                                {user.referredBy 
                                                    ? (users.find(u => u.id === user.referredBy)?.name || user.referredBy.slice(-6).toUpperCase())
                                                    : 'Direct'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '13px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ color: '#666' }}>Balance:</span>
                                            <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>{user.balance || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Trade Earnings:</span>
                                            <span style={{ color: '#fff', fontWeight: '700' }}>{user.tradeEarnings || 0}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleOpenEdit(user)}
                                            style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                        >
                                            <Settings2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            style={{ background: 'rgba(255,77,79,0.05)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#111', borderRadius: '24px', border: '1px solid #333', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '800' }}>Edit User Information</h3>
                                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '12px' }}>Updating UID: <span style={{color: 'var(--accent-gold)'}}>{selectedUser.id}</span></p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Basic Info */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Phone</label>
                                <input 
                                    type="text" 
                                    value={editForm.phone} 
                                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Password (Login Password)</label>
                                <input 
                                    type="text" 
                                    value={editForm.password} 
                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>

                            <hr style={{ gridColumn: 'span 2', border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                            {/* Financial Info */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Wallet Balance (USDT)</label>
                                <input 
                                    type="number" 
                                    value={editForm.balance} 
                                    onChange={(e) => setEditForm({...editForm, balance: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #00c087', borderRadius: '8px', color: '#00c087', fontWeight: '800' }} 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Trade Earnings</label>
                                <input 
                                    type="number" 
                                    value={editForm.tradeEarnings} 
                                    onChange={(e) => setEditForm({...editForm, tradeEarnings: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Ref. Earnings</label>
                                <input 
                                    type="number" 
                                    value={editForm.referralEarnings} 
                                    onChange={(e) => setEditForm({...editForm, referralEarnings: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Total Ref Count</label>
                                <input 
                                    type="number" 
                                    value={editForm.totalReferrals} 
                                    onChange={(e) => setEditForm({...editForm, totalReferrals: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
                                />
                            </div>

                            <hr style={{ gridColumn: 'span 2', border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                            {/* Switches */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <label style={{ color: '#fff', fontSize: '13px' }}>Account Active</label>
                                <input 
                                    type="checkbox" 
                                    checked={editForm.isActive} 
                                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <label style={{ color: '#fff', fontSize: '13px' }}>KYC Verified</label>
                                <input 
                                    type="checkbox" 
                                    checked={editForm.isVerified} 
                                    onChange={(e) => setEditForm({...editForm, isVerified: e.target.checked})}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveUser}
                            style={{ 
                                width: '100%', padding: '15px', background: 'var(--accent-gold)', color: '#000', 
                                border: 'none', borderRadius: '12px', fontWeight: '800', marginTop: '30px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            <Save size={18} /> SAVE ALL CHANGES
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
