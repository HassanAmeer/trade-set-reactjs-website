import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload, ChevronLeft, CheckCircle2, Loader2, Camera, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFileChunks } from '../services/dbs';

const Verification = () => {
    const { user, updateUser, loading } = useAuth();
    const navigate = useNavigate();

    // Local state for files before upload
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingType, setUploadingType] = useState(null); // 'front' or 'back'
    const [showToast, setShowToast] = useState(false);
    const [isReverifying, setIsReverifying] = useState(false);

    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'front') {
                setFrontFile(file);
                setFrontPreview(reader.result);
            } else {
                setBackFile(file);
                setBackPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!frontFile || !backFile) {
            alert("Please select both Front and Back sides of your CNIC.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload Front Side
            setUploadingType('front');
            const frontResult = await uploadFileChunks(frontFile);
            if (!frontResult.success) throw new Error("Front side upload failed");

            // 2. Upload Back Side
            setUploadingType('back');
            const backResult = await uploadFileChunks(backFile);
            if (!backResult.success) throw new Error("Back side upload failed");

            // 3. Update Firestore
            await updateUser({
                cnicFront: frontResult.url,
                cnicBack: backResult.url,
                updatedAt: new Date().toISOString()
            });

            // 4. Success Toast
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);

            // Clear local files
            setFrontFile(null);
            setBackFile(null);
            setFrontPreview(null);
            setBackPreview(null);
            setIsReverifying(false);

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
            setUploadingType(null);
        }
    };

    if (loading) return null;

    const isReadyToSubmit = frontFile && backFile;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1a1a1a' }}>
                <ChevronLeft size={24} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Account Verification</h2>
            </div>

            <div style={{ padding: '20px' }}>
                {user?.isVerified && !isReverifying ? (
                    /* Verified View */
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ textAlign: 'center', padding: '40px 20px', }}
                    >
                        <div style={{ marginBottom: '20px', display: 'inline-flex', padding: '20px', backgroundColor: 'rgba(0, 192, 135, 0.1)', borderRadius: '50%' }}>
                            <ShieldCheck size={60} color="#00c087" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: '#00c087' }}>Verified Account</h3>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
                            Your identity has been successfully verified. You now have full access to all trading features.
                        </p>
                        <br /><br />

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', justifyContent: 'center' }}>
                            <div style={{ width: '100px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={user.cnicFront} alt="CNIC Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ width: '100px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={user.cnicBack} alt="CNIC Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsReverifying(true)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#00c087',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                textTransform: 'uppercase',
                                fontSize: '14px'
                            }}
                        >
                            Verify It Again
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
                                {(frontFile || user?.cnicFront) && <Check size={16} color="#00c087" />}
                            </div>
                            <div
                                onClick={() => !isSubmitting && frontInputRef.current?.click()}
                                style={{
                                    height: '180px',
                                    backgroundColor: '#111',
                                    border: frontFile ? '2px solid var(--accent-gold)' : '2px dashed #222',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {frontPreview || user?.cnicFront ? (
                                    <img src={frontPreview || user.cnicFront} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <Camera size={40} color="#333" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontSize: '12px', color: '#555' }}>Click to select Front Side</div>
                                    </>
                                )}

                                {uploadingType === 'front' && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        <div className="circular-loader-simple"></div>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={frontInputRef} onChange={(e) => handleFileSelect(e, 'front')} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        {/* Back Side */}
                        <div style={{ marginBottom: '35px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>CNIC Back Side</span>
                                {(backFile || user?.cnicBack) && <Check size={16} color="#00c087" />}
                            </div>
                            <div
                                onClick={() => !isSubmitting && backInputRef.current?.click()}
                                style={{
                                    height: '180px',
                                    backgroundColor: '#111',
                                    border: backFile ? '2px solid var(--accent-gold)' : '2px dashed #222',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {backPreview || user?.cnicBack ? (
                                    <img src={backPreview || user.cnicBack} alt="Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <Camera size={40} color="#333" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontSize: '12px', color: '#555' }}>Click to select Back Side</div>
                                    </>
                                )}

                                {uploadingType === 'back' && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        <div className="circular-loader-simple"></div>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={backInputRef} onChange={(e) => handleFileSelect(e, 'back')} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <ul style={{ padding: '0 20px', fontSize: '12px', color: '#555', lineHeight: '1.8', marginBottom: '30px' }}>
                            <li>Ensure all text on ID card is clearly readable.</li>
                            <li>The card must not be expired.</li>
                            <li>Use original documents, only high quality photos.</li>
                        </ul>

                        <button
                            onClick={handleSubmit}
                            disabled={!isReadyToSubmit || isSubmitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: isReadyToSubmit ? 'var(--accent-gold)' : '#222',
                                color: isReadyToSubmit ? '#000' : '#555',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '16px',
                                cursor: (isReadyToSubmit && !isSubmitting) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                marginBottom: '40px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                'Submit Verification'
                            )}
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
