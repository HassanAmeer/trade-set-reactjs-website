import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

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
            // Filter users who have submitted documents but are not verified
            const list = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ref: doc.ref,
                    ...doc.data()
                }))
                .filter(user => user.cnicFront && user.cnicBack && !user.isVerified);
            
            // Sort by updatedAt if possible
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
            await updateDoc(user.ref, { isVerified: true });
            fetchKYCRequests();
        } catch (error) {
            alert('Failed to approve KYC');
        }
    };

    const handleReject = async (user) => {
        try {
            // Rejection could mean we remove the documents so they can re-upload, or just keep them unverified.
            // But we already have a Verify it Again button anyway. Let's clear the documents.
            await updateDoc(user.ref, { cnicFront: null, cnicBack: null, isVerified: false });
            fetchKYCRequests();
        } catch (error) {
            alert('Failed to reject KYC');
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading KYC Requests...</div>;

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>KYC Approvals</h2>
            
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>User Details</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>CNIC Front</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>CNIC Back</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kycRequests.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ color: '#00c087', fontSize: '14px', fontWeight: '700' }}>{user.email}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Name: {user.name || 'N/A'}</div>
                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>UID: {user.id}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <a href={user.cnicFront} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00c087', fontSize: '12px', textDecoration: 'none', backgroundColor: 'rgba(0,192,135,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                        View Front <ExternalLink size={12} />
                                    </a>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <a href={user.cnicBack} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00c087', fontSize: '12px', textDecoration: 'none', backgroundColor: 'rgba(0,192,135,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                        View Back <ExternalLink size={12} />
                                    </a>
                                </td>
                                <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleApprove(user)}
                                        style={{ backgroundColor: '#00c087', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <CheckCircle2 size={14} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleReject(user)}
                                        style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {kycRequests.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No pending KYC requests</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminKYC;
