import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, doc, updateDoc, increment, getDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { CheckCircle2, XCircle, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { sendEmail } from '../../services/emailService';

const AdminDeposits = () => {
    const { referralCommission } = useBranding();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

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

    const handleUpdateStatus = async (item, newStatus) => {
        try {
            if (newStatus === 'approved') {
                const uid = item.userId || item.uid;
                if (!uid) throw new Error("User ID not found in deposit record!");

                const userRef = doc(db, 'users', uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const depositAmount = Number(item.amount);

                    // 1. Update user balance
                    await updateDoc(userRef, {
                        balance: increment(depositAmount)
                    });

                    // 2. Handle Referral Commission
                    if (userData.referredBy) {
                        try {
                            const commissionAmount = (depositAmount * (Number(referralCommission) || 0)) / 100;
                            if (commissionAmount > 0) {
                                const referrerRef = doc(db, 'users', userData.referredBy);
                                await updateDoc(referrerRef, {
                                    balance: increment(commissionAmount),
                                    referralEarnings: increment(commissionAmount)
                                });
                            }
                        } catch (e) {
                            console.error("Referral commission credit failed:", e);
                        }
                    }

                    // 3. Send inbox notification
                    await addDoc(collection(db, 'users', uid, 'messages'), {
                        title: '✅ Deposit Approved',
                        description: `Your deposit of ${item.amount} USDT has been approved and added to your balance.`,
                        type: 'alert',
                        read: false,
                        timestamp: new Date().toISOString()
                    });

                    // 4. Send Email
                    sendEmail('multi', {
                        to_email: item.userEmail,
                        headline: 'Deposit Successful 💰',
                        user_name: userData.name || 'Trader',
                        description: `Your deposit of ${item.amount} USDT has been verified and added to your balance. You can start trading now.`,
                        data_title: 'Amount Added',
                        data_value: `${item.amount} USDT`,
                        button_text: 'Trade Now',
                        button_url: window.location.origin + '/trade'
                    });
                } else {
                    console.error("User document does not exist in /users/", uid);
                    alert("User record not found in database. Balance NOT added.");
                }
            }

            if (newStatus === 'rejected') {
                const uid = item.userId || item.uid;
                if (uid) {
                    await addDoc(collection(db, 'users', uid, 'messages'), {
                        title: '❌ Deposit Rejected',
                        description: `Your deposit request of ${item.amount} USDT was rejected. Please contact support if you believe this is an error.`,
                        type: 'alert',
                        read: false,
                        timestamp: new Date().toISOString()
                    });

                    // Send Email
                    sendEmail('multi', {
                        to_email: item.userEmail,
                        headline: 'Deposit Rejected ❌',
                        user_name: 'Trader',
                        description: `Your deposit request for ${item.amount} USDT was rejected. This may be due to an invalid voucher or transaction error.`,
                        data_title: 'Ref ID',
                        data_value: item.id.slice(-8).toUpperCase(),
                        button_text: 'Contact Support',
                        button_url: window.location.origin + '/customer-service'
                    });
                }
            }

            await updateDoc(item.ref, { status: newStatus });
            fetchAllDeposits();
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (itemRef) => {
        if (!window.confirm("Delete this record?")) return;
        try {
            await deleteDoc(itemRef);
            fetchAllDeposits();
        } catch (error) {
            alert("Delete failed");
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading deposits...</div>;

    return (
        <div style={{ position: 'relative' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Deposit Requests</h2>

            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Date / Time</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>User Email</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Amount</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Voucher Thumbnail</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deposits.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '16px', fontSize: '12px', color: '#888' }}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '16px', fontSize: '13px', color: '#00c087', fontWeight: '600' }}>
                                    {item.userEmail || "N/A"}
                                    <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>ID: {item.userId || item.uid}</div>
                                </td>
                                <td style={{ padding: '16px', fontSize: '15px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                                    {item.amount} USDT
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div
                                        onClick={() => setSelectedVoucher(item.screenshot)}
                                        style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #333' }}
                                    >
                                        <img src={item.screenshot} alt="Voucher" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        backgroundColor: item.status === 'pending' ? 'rgba(255,184,0,0.1)' : item.status === 'approved' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        color: item.status === 'pending' ? '#ffb800' : item.status === 'approved' ? '#00c087' : '#ff4d4f',
                                        border: `1px solid ${item.status === 'pending' ? 'rgba(255,184,0,0.2)' : item.status === 'approved' ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)'}`
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {item.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(item, 'approved')}
                                                style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(item, 'rejected')}
                                                style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(item.ref)}
                                        style={{ backgroundColor: 'transparent', color: '#444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Voucher Modal */}
            {selectedVoucher && (
                <div
                    onClick={() => setSelectedVoucher(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img
                            src={selectedVoucher}
                            alt="Full Voucher"
                            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                        />
                        <button
                            onClick={() => setSelectedVoucher(null)}
                            style={{ position: 'absolute', top: '-40px', right: '-40px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDeposits;
