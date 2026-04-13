import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Key, ArrowRight, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ShieldCheck, MailCheck, Fingerprint } from 'lucide-react';
import { sendEmail } from '../services/emailService';
import { useBranding } from '../context/BrandingContext';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const { websiteName, logoUrl } = useBranding();

    // 1. Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cleanEmail = email.toLowerCase().trim();
            console.log(`[ForgotPassword] STEP 1: Checking database for email: "${cleanEmail}"`);

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', cleanEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error(`[ForgotPassword] NOT FOUND: No account exists with email: ${cleanEmail}`);
                setError('This email address is not registered with TradeSet.');
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const userName = userData.name || 'Trader';

            console.log(`[ForgotPassword] SUCCESS: User found (UID: ${userDoc.id}). Proceeding to send OTP...`);

            // Generate OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);

            console.log(`[ForgotPassword] STEP 2: Dispatching OTP via EmailJS to: ${cleanEmail}`);
            // Send Email
            const emailResult = await sendEmail('otp', {
                to_email: cleanEmail,
                otp_code: code,
                user_name: userName,
                subject: 'Secure Password Reset OTP'
            });

            if (emailResult.success) {
                setStep(2);
                setSuccess('Security code sent to your email!');
                setTimeout(() => setSuccess(''), 4000);
            } else {
                throw new Error(emailResult.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp === generatedOtp) {
            setStep(3);
            setError('');
        } else {
            setError('The verification code you entered is invalid.');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'users', userDoc.id), {
                    password: newPassword,
                    updatedAt: new Date().toISOString()
                });
                setSuccess('Security credentials updated! Redirecting...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError('Internal error. Please restart the process.');
            }
        } catch (err) {
            setError('Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            {/* Background Decorations */}
            <div style={glowStyle1}></div>
            <div style={glowStyle2}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={cardWrapperStyle}
            >
                {/* Back Button */}
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
                    style={backButtonStyle}
                >
                    <ChevronLeft size={18} /> {step > 1 ? 'Go Back' : 'Back to Login'}
                </button>

                {/* Branding */}
                <div style={headerSectionStyle}>
                    <div style={iconBadgeStyle}>
                        <AnimatePresence mode="wait">
                            {step === 1 && <motion.div key="icon1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Mail size={32} color="var(--accent-gold)" /></motion.div>}
                            {step === 2 && <motion.div key="icon2" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><MailCheck size={32} color="#00c087" /></motion.div>}
                            {step === 3 && <motion.div key="icon3" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Fingerprint size={32} color="var(--accent-gold)" /></motion.div>}
                        </AnimatePresence>
                    </div>
                    <h2 style={titleStyle}>
                        {step === 1 ? 'Password Recovery' : step === 2 ? 'Security Check' : 'Create New Password'}
                    </h2>
                    <p style={subtitleStyle}>
                        {step === 1 ? 'Enter the email associated with your account' :
                            step === 2 ? `Verify the 6-digit code sent to ${email}` :
                                'Your new password must be different from previous ones.'}
                    </p>
                </div>

                {/* Step Progress Dots */}
                <div style={progressContainerStyle}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: step === i ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: step >= i ? (i === 2 ? '#00c087' : 'var(--accent-gold)') : '#222',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.form key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleSendOtp} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <div style={iconInsideStyle}><Mail size={20} /></div>
                                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                            </div>
                            <button type="submit" disabled={loading} style={primaryButtonStyle}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={20} /></>}
                            </button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleVerifyOtp} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <div style={iconInsideStyle}><ShieldCheck size={20} /></div>
                                <input type="text" placeholder="Enter OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required style={inputStyle} />
                            </div>
                            <button type="submit" style={{ ...primaryButtonStyle, backgroundColor: '#00c087' }}>
                                Verify Identity <CheckCircle2 size={20} />
                            </button>
                            <div onClick={() => setStep(1)} style={textLinkStyle}>Didn't receive code? Re-send</div>
                        </motion.form>
                    )}

                    {step === 3 && (
                        <motion.form key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleResetPassword} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <div style={iconInsideStyle}><Lock size={20} /></div>
                                <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
                            </div>
                            <div style={inputGroupStyle}>
                                <div style={iconInsideStyle}><Lock size={20} /></div>
                                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
                            </div>
                            <button type="submit" disabled={loading} style={primaryButtonStyle}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Secure Profile'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Feedback Alerts */}
                {error && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={errorAlertStyle}>
                        <AlertCircle size={16} /> {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={successAlertStyle}>
                        <CheckCircle2 size={16} /> {success}
                    </motion.div>
                )}

                <div style={footerNoteStyle}>
                    Secure 256-bit SSL encrypted recovery process.
                </div>
            </motion.div>
        </div>
    );
};

// --- ELITE STYLES ---

const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#000',
    backgroundImage: 'radial-gradient(circle at 50% 50%, #0d0d0d 0%, #000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden'
};

const glowStyle1 = {
    position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,185,11,0.05) 0%, transparent 70%)',
    top: '-50px', right: '-50px', zIndex: 0
};

const glowStyle2 = {
    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,192,135,0.05) 0%, transparent 70%)',
    bottom: '-100px', left: '-100px', zIndex: 0
};

const cardWrapperStyle = {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(15, 15, 15, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '32px',
    padding: '40px 30px',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const backButtonStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: 'transparent', border: 'none', color: '#666',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
    marginBottom: '40px', padding: '0', transition: 'color 0.2s',
    '&:hover': { color: '#fff' }
};

const headerSectionStyle = {
    textAlign: 'center',
    marginBottom: '35px'
};

const iconBadgeStyle = {
    width: '70px',
    height: '70px',
    borderRadius: '24px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px auto',
    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.01)'
};

const titleStyle = {
    fontSize: '26px',
    fontWeight: '900',
    color: '#fff',
    letterSpacing: '-0.5px',
    marginBottom: '12px'
};

const subtitleStyle = {
    fontSize: '14px',
    color: '#777',
    lineHeight: '1.6',
    fontWeight: '500'
};

const progressContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '35px'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
};

const inputGroupStyle = {
    position: 'relative'
};

const iconInsideStyle = {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#444'
};

const inputStyle = {
    width: '100%',
    padding: '18px 18px 18px 55px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    '&:focus': {
        borderColor: 'rgba(240,185,11,0.3)',
        backgroundColor: 'rgba(255,255,255,0.05)'
    }
};

const primaryButtonStyle = {
    width: '100%',
    padding: '18px',
    backgroundColor: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '900',
    fontSize: '15px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '10px',
    transition: 'transform 0.2s active'
};

const textLinkStyle = {
    textAlign: 'center',
    color: '#555',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'color 0.2s'
};

const errorAlertStyle = {
    marginTop: '25px', color: '#ff4d4f', fontSize: '13px',
    backgroundColor: 'rgba(255, 77, 79, 0.08)', padding: '15px',
    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
    border: '1px solid rgba(255,77,79,0.1)'
};

const successAlertStyle = {
    marginTop: '25px', color: '#00c087', fontSize: '13px',
    backgroundColor: 'rgba(0, 192, 135, 0.08)', padding: '15px',
    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
    border: '1px solid rgba(0,192,135,0.1)'
};

const footerNoteStyle = {
    marginTop: '40px',
    fontSize: '11px',
    color: '#333',
    textAlign: 'center',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

export default ForgotPassword;
