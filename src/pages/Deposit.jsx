import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, Clock, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { uploadFileChunks } from '../services/dbs';
import { db } from '../firebase-setup';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const Deposit = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { minDeposit, usdtAddress } = useBranding();
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleCopy = () => {
        if (!usdtAddress) return;
        navigator.clipboard.writeText(usdtAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setScreenshot(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) < minDeposit) return;
        if (!screenshot) return;

        setSubmitting(true);
        try {
            // 1. Upload Screenshot
            const uploadResult = await uploadFileChunks(screenshot);
            if (!uploadResult.success) throw new Error("Screenshot upload failed");

            // 2. Save to Firestore: users/{userId}/deposits
            const depositData = {
                amount: parseFloat(amount),
                screenshot: uploadResult.url,
                address: usdtAddress,
                status: 'pending',
                timestamp: new Date().toISOString(),
                type: 'deposit',
                userEmail: user.email,
                userId: user.id,
                uid: user.id
            };

            await addDoc(collection(db, 'users', user.id, 'deposits'), depositData);

            alert("Deposit submitted! Admin will review it soon.");
            navigate('/deposit-history');
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-container"
            style={{ paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}
        >
            <div className="flex-between" style={{ marginBottom: '32px', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Deposit</h2>
                </div>
                <button
                    onClick={() => navigate('/deposit-history')}
                    style={{
                        backgroundColor: 'rgba(255,184,0,0.1)',
                        border: '1px solid rgba(255,184,0,0.2)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        color: 'var(--accent-gold)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    <Clock size={14} /> History
                </button>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>

                {/* QR Code Section */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '12px',
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${usdtAddress}`}
                            alt="Payment QR"
                            style={{ width: '150px', height: '150px', display: 'block' }}
                        />
                    </div>
                    <p style={{ color: 'var(--accent-gold)', fontSize: '12px', marginTop: '12px', fontWeight: '600' }}>Scan QR to Pay</p>
                </div>

                {/* Network Info & Address */}
                <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Network</span>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '20px' }}>USDT - TRC20</span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Payment Address</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <span style={{ color: '#fff', fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>{usdtAddress}</span>
                        <button
                            onClick={handleCopy}
                            style={{
                                backgroundColor: copied ? '#00c087' : 'var(--accent-gold)',
                                color: '#000',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                minWidth: '70px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {copied ? 'COPIED' : 'COPY'}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Recharge Amount</div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            placeholder={`Min ${minDeposit} USDT`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 50px 16px 16px',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: amount ? (parseFloat(amount) < minDeposit ? '1px solid #ff4d4f' : '1px solid var(--accent-gold)') : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '700',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                        />
                        <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: amount ? (parseFloat(amount) < minDeposit ? '#ff4d4f' : 'var(--accent-gold)') : 'var(--text-secondary)' }}>USDT</span>
                    </div>
                    {amount && parseFloat(amount) < minDeposit && (
                        <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '6px', fontWeight: '600', paddingLeft: '4px' }}>
                            Minimum recharge amount is {minDeposit} USDT
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '20px', overflow: 'hidden', textAlign: 'left' }}>
                    <span className="shimmer-text" style={{ fontSize: '11px' }}>AFTER SENDING PAYMENT YOU SHOULD UPLOAD YOUR SCREENSHOT</span>
                </div>

                {/* Voucher Upload */}
                <div style={{ marginBottom: '32px', textAlign: 'left' }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={16} color="var(--accent-gold)" /> Recharge voucher (Screenshot)
                    </div>
                    <div
                        onClick={() => !submitting && fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            height: '180px',
                            border: preview ? '2px solid var(--accent-gold)' : '2px dashed rgba(255,255,255,0.1)',
                            borderRadius: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: 'rgba(0,0,0,0.2)'
                        }}
                    >
                        {preview ? (
                            <img src={preview} alt="Voucher" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <>
                                <Upload size={32} color="#333" />
                                <span style={{ fontSize: '13px', marginTop: '10px', color: '#555' }}>Tap to upload proof</span>
                            </>
                        )}
                        {submitting && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <div className="circular-loader-simple"></div>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />
                </div>

                <button
                    onClick={handleDeposit}
                    disabled={submitting || !amount || !screenshot}
                    style={{
                        width: '100%',
                        padding: '18px',
                        backgroundColor: (submitting || !amount || !screenshot) ? '#1a1a1a' : 'var(--accent-gold)',
                        color: (submitting || !amount || !screenshot) ? '#444' : '#000',
                        border: 'none',
                        borderRadius: '14px',
                        fontWeight: '800',
                        fontSize: '16px',
                        cursor: (submitting || !amount || !screenshot) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.3s ease',
                        boxShadow: (submitting || !amount || !screenshot) ? 'none' : '0 10px 20px rgba(255, 184, 0, 0.2)'
                    }}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        'Submit Recharge'
                    )}
                </button>
            </div>

            {/* Hint Box */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(0, 192, 135, 0.05)', borderRadius: '16px', border: '1px solid rgba(0, 192, 135, 0.1)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#00c087" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                        After transfer, wait 5-10 minutes for confirmation. If balance is not reflected, contact 24/7 customer support with your voucher.
                    </p>
                </div>
            </div>
        </motion.div >
    );
};

export default Deposit;
