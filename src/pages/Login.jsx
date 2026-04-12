import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/profile');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
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
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>Welcome Back</h2>
                    <p style={{ color: '#888', fontSize: '14px' }}>Log in to your account to continue trading</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '16px 16px 16px 50px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '16px 16px 16px 50px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none' }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ff4d4f', fontSize: '13px', textAlign: 'center', backgroundColor: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '8px' }}>
                            {error}
                        </div>
                    )}

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
                            gap: '10px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Login <ArrowRight size={20} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#888' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '700' }}>Sign Up</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
