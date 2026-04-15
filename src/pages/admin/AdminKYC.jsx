import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, ShieldCheck, Clock, Phone, Trash2 } from 'lucide-react';
import { sendEmail } from '../../services/emailService';

const AdminKYC = () => {
    const [kycRequests, setKycRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchKYCRequests();
    }, []);

    const fetchKYCRequests = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const list = querySnapshot.docs
                .map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
                .filter(user => user.cnicFront || user.kycStatus);
            list.sort((a, b) => {
                if (!a.updatedAt) return 1;
                if (!b.updatedAt) return -1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            setKycRequests(list);
        } catch (error) {
            console.error("Error fetching KYC:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (user, status) => {
        let reason = '';
        if (status === 'rejected') {
            reason = window.prompt("Reason for rejection:", "Invalid or Blur Image");
            if (!reason) return;
        }

        const messageMap = {
            approved: {
                title: '✅ KYC Verified Successfully',
                description: 'Congratulations! Your identity has been verified. You now have full access to all features including withdrawals.',
                type: 'alert'
            },
            pending: {
                title: '🕐 KYC Under Review',
                description: 'Your documents have been received and are currently under review. We will notify you once the process is complete.',
                type: 'info'
            },
            rejected: {
                title: '❌ KYC Rejected',
                description: `Your verification request was rejected. Reason: ${reason}. Please re-submit clear photos of your documents.`,
                type: 'alert'
            }
        };

        const kycMsg = messageMap[status];

        try {
            // 1. Update user KYC fields
            await updateDoc(user.ref, {
                isVerified: status === 'approved',
                kycStatus: status,
                kycMessage: status === 'approved'
                    ? "Congratulations! Your identity has been verified."
                    : status === 'pending'
                        ? "Your documents are under review."
                        : `Rejected: ${reason}`
            });

            // 2. Send inbox message to user
            await addDoc(collection(db, 'users', user.id, 'messages'), {
                title: kycMsg.title,
                description: kycMsg.description,
                type: kycMsg.type,
                read: false,
                timestamp: new Date().toISOString()
            });

            // 3. Send automated email notification
            if (status === 'approved' || status === 'rejected') {
                sendEmail('multi', {
                    to_email: user.email,
                    headline: status === 'approved' ? 'KYC Verified 🛡️' : 'KYC Action Required ⚠️',
                    user_name: user.name || 'Trader',
                    description: status === 'approved' 
                        ? 'Congratulations! Your identity verification has been successfully approved by our compliance team. You now have full access to all features.' 
                        : `Your identity verification was rejected for the following reason: ${reason}. Please re-submit clear documents to regain full access.`,
                    data_title: 'Status',
                    data_value: status.toUpperCase(),
                    button_text: 'Go to Profile',
                    button_url: window.location.origin + '/profile'
                });
            }

            fetchKYCRequests();
        } catch (error) {
            alert('Update failed: ' + error.message);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm("Are you sure you want to permanently delete this KYC record? The user will have to re-upload documents.")) return;
        
        try {
            await updateDoc(user.ref, {
                isVerified: false,
                kycStatus: null,
                kycMessage: null,
                cnicFront: null,
                cnicBack: null
            });
            fetchKYCRequests();
        } catch (error) {
            alert('Delete failed: ' + error.message);
        }
    };

    const statusColors = {
        pending: { bg: 'rgba(255,184,0,0.1)', color: '#ffb800' },
        approved: { bg: 'rgba(0,192,135,0.1)', color: '#00c087' },
        rejected: { bg: 'rgba(255,77,79,0.1)', color: '#ff4d4f' },
    };

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div className="skeleton-loader" style={{ width: '220px', height: '30px' }}></div>
                <div className="skeleton-loader" style={{ width: '100px', height: '25px', borderRadius: '20px' }}></div>
            </div>
            <div className="admin-table-container">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '70px', borderRadius: '12px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', margin: 0 }}>KYC Management</h2>
                <div style={{ fontSize: '14px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '6px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                    Total: <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{kycRequests.length}</span>
                </div>
            </div>

            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#111', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '14px 16px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                            <th style={{ padding: '14px 16px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Documents</th>
                            <th style={{ padding: '14px 16px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            <th style={{ padding: '14px 16px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kycRequests.map((user) => {
                            const status = user.kycStatus || (user.isVerified ? 'approved' : 'pending');
                            const sc = statusColors[status] || statusColors.pending;
                            return (
                                <tr key={user.id} style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                    {/* User Details */}
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{user.name || 'N/A'}</div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{user.email}</div>
                                        {user.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                <Phone size={11} /> {user.phone}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '10px', color: '#444', marginTop: '5px' }}>
                                            UID: {user.id.slice(-8).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>
                                            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''}
                                        </div>
                                        {user.docType && (
                                            <div style={{
                                                marginTop: '10px',
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                backgroundColor: 'rgba(212,175,55,0.1)',
                                                color: 'var(--accent-gold)',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                border: '1px solid rgba(212,175,55,0.2)'
                                            }}>
                                                {user.docType.toUpperCase()}
                                            </div>
                                        )}
                                    </td>

                                    {/* Document Thumbnails */}
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {user.cnicFront ? (
                                                <div
                                                    onClick={() => setSelectedImage(user.cnicFront)}
                                                    style={{ cursor: 'pointer', position: 'relative' }}
                                                    title="CNIC Front"
                                                >
                                                    <img
                                                        src={user.cnicFront}
                                                        alt="Front"
                                                        style={{ width: '70px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #333', display: 'block' }}
                                                     />
                                                     <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', marginTop: '3px' }}>{user.docType === 'Passport' ? 'MAIN' : 'FRONT'}</div>
                                                </div>
                                            ) : <div style={{ width: '70px', height: '48px', background: '#111', borderRadius: '6px', border: '1px dashed #333' }} />}

                                            {user.docType !== 'Passport' && (user.cnicBack ? (
                                                <div
                                                    onClick={() => setSelectedImage(user.cnicBack)}
                                                    style={{ cursor: 'pointer' }}
                                                    title="CNIC Back"
                                                >
                                                    <img
                                                        src={user.cnicBack}
                                                        alt="Back"
                                                        style={{ width: '70px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #333', display: 'block' }}
                                                    />
                                                    <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', marginTop: '3px' }}>BACK</div>
                                                </div>
                                            ) : <div style={{ width: '70px', height: '48px', background: '#111', borderRadius: '6px', border: '1px dashed #333' }} />)}
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '5px 12px', borderRadius: '20px',
                                            fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                                            backgroundColor: sc.bg, color: sc.color,
                                            border: `1px solid ${sc.color}30`
                                        }}>
                                            {status === 'pending' && <Clock size={11} />}
                                            {status === 'approved' && <CheckCircle2 size={11} />}
                                            {status === 'rejected' && <XCircle size={11} />}
                                            {status}
                                        </span>
                                        {user.kycMessage && (
                                            <div style={{ fontSize: '10px', color: '#555', marginTop: '6px', maxWidth: '160px', lineHeight: '1.4' }}>
                                                {user.kycMessage}
                                            </div>
                                        )}
                                    </td>

                                    {/* 3 Action Buttons */}
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <button
                                                onClick={() => handleStatus(user, 'pending')}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                    border: '1px solid rgba(255,184,0,0.3)', display: 'flex', alignItems: 'center', gap: '5px',
                                                    backgroundColor: status === 'pending' ? 'rgba(255,184,0,0.15)' : 'transparent',
                                                    color: '#ffb800'
                                                }}
                                            >
                                                <Clock size={12} /> Pending
                                            </button>
                                            <button
                                                onClick={() => handleStatus(user, 'approved')}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                    border: '1px solid rgba(0,192,135,0.3)', display: 'flex', alignItems: 'center', gap: '5px',
                                                    backgroundColor: status === 'approved' ? 'rgba(0,192,135,0.15)' : 'transparent',
                                                    color: '#00c087'
                                                }}
                                            >
                                                <CheckCircle2 size={12} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatus(user, 'rejected')}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                    border: '1px solid rgba(255,77,79,0.3)', display: 'flex', alignItems: 'center', gap: '5px',
                                                    backgroundColor: status === 'rejected' ? 'rgba(255,77,79,0.15)' : 'transparent',
                                                    color: '#ff4d4f'
                                                }}
                                            >
                                                <XCircle size={12} /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                    border: '1px solid rgba(136, 136, 136, 0.3)', display: 'flex', alignItems: 'center', gap: '5px',
                                                    backgroundColor: 'transparent',
                                                    color: '#888'
                                                }}
                                            >
                                                <Trash2 size={12} /> Delete KYC
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {kycRequests.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '60px 20px', textAlign: 'center', color: '#666' }}>
                                    <ShieldCheck size={48} color="#222" style={{ display: 'block', margin: '0 auto 15px' }} />
                                    No KYC records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img
                            src={selectedImage}
                            alt="Document"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{ position: 'absolute', top: '-40px', right: '0px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKYC;
