import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, doc, updateDoc, increment, getDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { CheckCircle2, XCircle, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { sendEmail } from '../../services/emailService';

const AdminDeposits = () => {
    const loggedAdminEmail = (localStorage.getItem('adminEmail') || '').trim().toLowerCase();
    const adminToken = localStorage.getItem('adminToken');

    // Strict check: ONLY sajju@gmail.com or dev@gmail.com are Super Admins
    const isSuperAdmin = (loggedAdminEmail === 'sajju@gmail.com' || loggedAdminEmail === 'dev@gmail.com') || (adminToken === 'super' && loggedAdminEmail !== 'admin@gmail.com');

    const { referralCommission } = useBranding();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchAllDeposits();
    }, []);

    const fetchAllDeposits = async (targetPage = 1) => {
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

            const visibleList = list.filter(item => isSuperAdmin || !item.deleted);
            const totalPages = Math.max(1, Math.ceil(visibleList.length / ITEMS_PER_PAGE));
            if (targetPage > totalPages) {
                setPage(totalPages);
            } else {
                setPage(targetPage);
            }
        } catch (error) {
            console.error("Error fetching deposits:", error);
        } finally {
            setLoading(false);
        }
    };

    const visibleDeposits = deposits.filter(item => isSuperAdmin || !item.deleted);
    const totalRequests = visibleDeposits.length;
    const totalPages = Math.max(1, Math.ceil(totalRequests / ITEMS_PER_PAGE));
    const hasMore = page < totalPages;
    const displayedDeposits = visibleDeposits.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    const getPageNumbers = () => {
        const current = page;
        const pages = [];
        
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            
            if (current > 3) {
                pages.push('...');
            }
            
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);
            
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            
            if (current < totalPages - 2) {
                pages.push('...');
            }
            
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const renderPagination = () => {
        const pageNumbers = getPageNumbers();
        
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', padding: '10px 0', flexWrap: 'wrap', gap: '15px' }}>
                <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: (page === 1) ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                        color: (page === 1) ? '#444' : '#fff',
                        border: '1px solid #333',
                        borderRadius: '10px',
                        cursor: (page === 1) ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        transition: 'all 0.3s'
                    }}
                >
                    Previous
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {pageNumbers.map((p, index) => {
                        if (p === '...') {
                            return <span key={`ellipsis-${index}`} style={{ color: '#666', padding: '0 5px' }}>...</span>;
                        }
                        const isActive = p === page;
                        return (
                            <button
                                key={`page-${p}`}
                                onClick={() => handlePageChange(p)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: isActive ? '1px solid var(--accent-gold, #f0b90b)' : '1px solid #333',
                                    backgroundColor: isActive ? 'var(--accent-gold, #f0b90b)' : '#1a1a1a',
                                    color: isActive ? '#000' : '#fff',
                                    fontWeight: '800',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: isActive ? '0 0 10px rgba(240, 185, 11, 0.2)' : 'none'
                                }}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={!hasMore}
                    onClick={() => handlePageChange(page + 1)}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: (!hasMore) ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                        color: (!hasMore) ? '#444' : '#fff',
                        border: '1px solid #333',
                        borderRadius: '10px',
                        cursor: (!hasMore) ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        transition: 'all 0.3s'
                    }}
                >
                    Next
                </button>
            </div>
        );
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

                    // 1. Update user balance and total deposit
                    await updateDoc(userRef, {
                        balance: increment(depositAmount),
                        totalDeposit: increment(depositAmount)
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
            fetchAllDeposits(page);
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (itemRef, isAlreadyDeleted = false) => {
        if (isSuperAdmin) {
            // Super Admin (sajju@gmail.com / dev@gmail.com): Permanently delete from database
            if (window.confirm("Super Admin: Permanently delete this deposit record from database forever?")) {
                try {
                    await deleteDoc(itemRef);
                    fetchAllDeposits(page);
                } catch (error) {
                    alert("Delete failed: " + error.message);
                }
            }
        } else {
            // Normal Admin: 1-step soft delete (Hides from normal admin & user, visible ONLY to Super Admin)
            if (window.confirm("Are you sure you want to delete this deposit record?")) {
                try {
                    await updateDoc(itemRef, {
                        deleted: true,
                        deletedAt: new Date().toISOString(),
                        deletedBy: 'Admin'
                    });
                    fetchAllDeposits(page);
                } catch (error) {
                    alert("Delete failed: " + error.message);
                }
            }
        }
    };

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '220px', height: '30px', marginBottom: '25px' }}></div>
            <div className="admin-table-container">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '60px', borderRadius: '12px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Deposit Requests</h2>

            {renderPagination()}

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
                        {displayedDeposits.map((item) => {
                            const isDeleted = Boolean(item.deleted);
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #222', backgroundColor: isDeleted ? 'rgba(255, 77, 79, 0.08)' : 'transparent' }}>
                                    <td style={{ padding: '16px', fontSize: '12px', color: isDeleted ? '#ff7875' : '#888' }}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: isDeleted ? '#ff4d4f' : '#00c087', fontWeight: '600' }}>
                                        {item.userEmail || "N/A"}
                                        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>ID: {item.userId || item.uid}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '15px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                                        {item.amount} USDT
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {item.screenshot && (
                                            <div
                                                onClick={() => setSelectedVoucher(item.screenshot)}
                                                style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #333' }}
                                            >
                                                <img src={item.screenshot} alt="Voucher" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDeleted ? 0.6 : 1 }} />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            backgroundColor: isDeleted ? 'rgba(255,77,79,0.2)' : (item.status === 'pending' ? 'rgba(255,184,0,0.1)' : item.status === 'approved' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)'),
                                            color: isDeleted ? '#ff4d4f' : (item.status === 'pending' ? '#ffb800' : item.status === 'approved' ? '#00c087' : '#ff4d4f'),
                                            border: `1px solid ${isDeleted ? '#ff4d4f' : (item.status === 'pending' ? 'rgba(255,184,0,0.2)' : item.status === 'approved' ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)')}`
                                        }}>
                                            {isDeleted ? 'DELETED' : item.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {!isDeleted && item.status === 'pending' && (
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
                                            onClick={() => handleDelete(item.ref, isDeleted)}
                                            style={{ backgroundColor: 'transparent', color: isDeleted ? '#ff4d4f' : '#444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                            title={isDeleted ? "Permanently Delete" : "Delete Record"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {renderPagination()}

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
