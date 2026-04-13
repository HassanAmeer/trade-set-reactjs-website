import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, ExternalLink, ShieldCheck } from 'lucide-react';

const AdminKYC = () => {
    const [kycRequests, setKycRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKYCRequests();
    }, []);

    const fetchKYCRequests = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            // Filter users who have ever submitted something
            const list = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ref: doc.ref,
                    ...doc.data()
                }))
                .filter(user => user.cnicFront || user.kycStatus);
            
            // Sort by updatedAt desc
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

    const handleApprove = async (user) => {
        try {
            await updateDoc(user.ref, { 
                isVerified: true, 
                kycStatus: "approved",
                kycMessage: "Congratulations! Your identity has been verified."
            });
            fetchKYCRequests();
        } catch (error) {
            alert('Failed to approve KYC');
        }
    };

    const handleReject = async (user) => {
        const reason = window.prompt("Reason for rejection?", "Invalid or Blur Image");
        if (!reason) return;
        try {
            await updateDoc(user.ref, { 
                isVerified: false, 
                kycStatus: "rejected",
                kycMessage: `Rejected: ${reason}`
            });
            fetchKYCRequests();
        } catch (error) {
            alert('Failed to reject KYC');
        }
    };

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading KYC Database...</div>;

    return (
        <div style={{ padding: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', margin: 0 }}>KYC Request Management</h2>
                <div style={{ fontSize: '14px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '6px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                    Total Records: <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{kycRequests.length}</span>
                </div>
            </div>
            
            <div className="admin-table-container" style={{ borderRadius: '16px', border: '1px solid #222', overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#111', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>User & Date</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Documents</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kycRequests.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #222', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>{user.email}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>{user.name || 'N/A'}</div>
                                    <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>UID: {user.id}</div>
                                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>Updated: {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {user.cnicFront && (
                                            <a href={user.cnicFront} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00c087', fontSize: '11px', textDecoration: 'none', backgroundColor: 'rgba(0,192,135,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(0,192,135,0.1)' }}>
                                                Front <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {user.cnicBack && (
                                            <a href={user.cnicBack} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00c087', fontSize: '11px', textDecoration: 'none', backgroundColor: 'rgba(0,192,135,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(0,192,135,0.1)' }}>
                                                Back <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', width: 'fit-content',
                                            textTransform: 'uppercase',
                                            backgroundColor: user.kycStatus === 'pending' ? 'rgba(255,184,0,0.1)' : (user.kycStatus === 'approved' || user.isVerified) ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                            color: user.kycStatus === 'pending' ? '#ffb800' : (user.kycStatus === 'approved' || user.isVerified) ? '#00c087' : '#ff4d4f'
                                        }}>
                                            {user.kycStatus || (user.isVerified ? 'approved' : 'pending')}
                                        </span>
                                        {user.kycMessage && <div style={{ fontSize: '10px', color: '#666', maxWidth: '200px' }}>{user.kycMessage}</div>}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {(user.kycStatus !== 'approved' && !user.isVerified) && (
                                            <button 
                                                onClick={() => handleApprove(user)}
                                                style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                        )}
                                        {user.kycStatus !== 'rejected' && (
                                            <button 
                                                onClick={() => handleReject(user)}
                                                style={{ backgroundColor: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid #ff4d4f33', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {kycRequests.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '60px 20px', textAlign: 'center', color: '#666', backgroundColor: '#0a0a0a' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                        <ShieldCheck size={48} color="#222" />
                                        <span>No KYC records found in database.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminKYC;
