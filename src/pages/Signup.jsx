import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User, ArrowRight, Loader2, Zap } from 'lucide-react';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const { websiteName, logoUrl } = useBranding();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const result = await signup(email, phone, password);
            if (result.success) {
                navigate('/profile');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Account creation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" style={{ height: '35px', width: 'auto' }} />
                        ) : (
                            <Zap size={30} color="var(--accent-gold)" fill="var(--accent-gold)" />
                        )}
                        <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-gold)' }}>{websiteName}</span>
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h2>
                    <p style={{ color: '#888', fontSize: '13px' }}>Join {websiteName} and start your trading journey</p>
                    <div style={{ height: '4px', width: '60px', backgroundColor: 'var(--accent-gold)', margin: '15px auto', borderRadius: '2px' }}></div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={18} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '14px 14px 14px 45px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Phone style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={18} />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            style={{ width: '100%', padding: '14px 14px 14px 45px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '14px 14px 14px 45px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', textAlign: 'center', backgroundColor: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '8px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ fontSize: '11px', color: '#555', padding: '0 5px' }}>
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            backgroundColor: 'var(--accent-gold)', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '12px', 
                            fontWeight: '800', 
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '10px',
                            gap: '10px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={20} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#888' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '700' }}>Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
