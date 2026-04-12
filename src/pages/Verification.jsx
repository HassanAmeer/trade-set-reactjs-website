import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload, ChevronLeft, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFileChunks } from '../services/dbs';

const Verification = () => {
    const { user, updateUser, loading } = useAuth();
    const navigate = useNavigate();
    const [uploadingFront, setUploadingFront] = useState(false);
    const [uploadingBack, setUploadingBack] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);

    const handleUpload = async (file, type) => {
        if (!file) return;

        if (type === 'front') setUploadingFront(true);
        else setUploadingBack(true);

        const result = await uploadFileChunks(file);

        if (result.success) {
            const updateData = type === 'front' ? { cnicFront: result.url } : { cnicBack: result.url };
            await updateUser(updateData);
        } else {
            alert("Upload failed. Please try again.");
        }

        setUploadingFront(false);
        setUploadingBack(false);
    };

    if (loading) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1a1a1a' }}>
                <ChevronLeft size={24} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Account Verification</h2>
            </div>

            <div style={{ padding: '20px' }}>
                {user?.isVerified ? (
                    /* Verified View */
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'rgba(0, 192, 135, 0.05)', borderRadius: '24px', border: '1px solid rgba(0, 192, 135, 0.2)' }}
                    >
                        <div style={{ marginBottom: '20px', display: 'inline-flex', padding: '20px', backgroundColor: 'rgba(0, 192, 135, 0.1)', borderRadius: '50%' }}>
                            <ShieldCheck size={60} color="#00c087" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: '#00c087' }}>Verified Account</h3>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
                            Your identity has been successfully verified. You now have full access to all trading features.
                        </p>
                        <button 
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                backgroundColor: '#00c087', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '12px', 
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <CheckCircle2 size={20} /> Identity Verified
                        </button>
                    </motion.div>
                ) : (
                    /* Unverified View */
                    <div>
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Verify Your Identity</h3>
                            <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                                To ensure the security of your account and comply with regulations, please upload clear photos of your National ID Card.
                            </p>
                        </div>

                        {/* Front Side */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>CNIC Front Side</span>
                                {user?.cnicFront && <span style={{ color: '#00c087', fontSize: '12px' }}>Uploaded</span>}
                            </div>
                            <div 
                                onClick={() => !uploadingFront && frontInputRef.current?.click()}
                                style={{ 
                                    height: '180px', 
                                    backgroundColor: '#111', 
                                    border: '2px dashed #222', 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                            >
                                {user?.cnicFront ? (
                                    <img src={user.cnicFront} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                ) : (
                                    <>
                                        <Camera size={40} color="#333" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontSize: '12px', color: '#555' }}>Click to upload Front Side</div>
                                    </>
                                )}
                                
                                {uploadingFront && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        <div className="circular-loader-simple"></div>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={frontInputRef} onChange={(e) => handleUpload(e.target.files[0], 'front')} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        {/* Back Side */}
                        <div style={{ marginBottom: '35px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>CNIC Back Side</span>
                                {user?.cnicBack && <span style={{ color: '#00c087', fontSize: '12px' }}>Uploaded</span>}
                            </div>
                            <div 
                                onClick={() => !uploadingBack && backInputRef.current?.click()}
                                style={{ 
                                    height: '180px', 
                                    backgroundColor: '#111', 
                                    border: '2px dashed #222', 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                            >
                                {user?.cnicBack ? (
                                    <img src={user.cnicBack} alt="Back" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                ) : (
                                    <>
                                        <Camera size={40} color="#333" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontSize: '12px', color: '#555' }}>Click to upload Back Side</div>
                                    </>
                                )}

                                {uploadingBack && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        <div className="circular-loader-simple"></div>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={backInputRef} onChange={(e) => handleUpload(e.target.files[0], 'back')} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <ul style={{ padding: '0 20px', fontSize: '12px', color: '#555', lineHeight: '1.8', marginBottom: '30px' }}>
                            <li>Ensure all text on ID card is clearly readable.</li>
                            <li>The card must not be expired.</li>
                            <li>Use original documents, no photocopies.</li>
                        </ul>

                        <button 
                            onClick={() => {
                                if (!user?.cnicFront || !user?.cnicBack) return;
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 3000);
                            }}
                            disabled={!user?.cnicFront || !user?.cnicBack}
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                backgroundColor: (!user?.cnicFront || !user?.cnicBack) ? '#222' : 'var(--accent-gold)', 
                                color: (!user?.cnicFront || !user?.cnicBack) ? '#555' : '#000', 
                                border: 'none', 
                                borderRadius: '12px', 
                                fontWeight: '800', 
                                fontSize: '16px',
                                cursor: (!user?.cnicFront || !user?.cnicBack) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                marginBottom: '40px'
                            }}
                        >
                            Submit Verification
                        </button>
                    </div>
                )}
            </div>

            {/* Simple Toast Notification */}
            {showToast && (
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        backgroundColor: '#00c087', 
                        color: '#fff', 
                        padding: '12px 24px', 
                        borderRadius: '30px', 
                        zIndex: 1000,
                        fontWeight: '700',
                        fontSize: '14px',
                        boxShadow: '0 4px 15px rgba(0, 192, 135, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <CheckCircle2 size={18} /> Admin will review it soon
                </motion.div>
            )}
        </div>
    );
};

export default Verification;
