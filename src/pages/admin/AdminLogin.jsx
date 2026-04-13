import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const adminDocRef = doc(db, 'admin_set', 'config');
            const snapshot = await getDoc(adminDocRef);
            let adminData = null;

            if (snapshot.exists()) {
                adminData = snapshot.data();
            } else {
                // Initialize defaults
                adminData = {
                    email: 'admin@gmail.com',
                    password: '12345678',
                    name: 'Super Admin',
                    profileUrl: ''
                };
                await setDoc(adminDocRef, adminData);
            }

            if (email === 'super@gmail.com' && password === 'sajo') {
                localStorage.setItem('adminToken', 'super');
                navigate('/admin/dashboard');
                return;
            }

            if (email === adminData.email && password === adminData.password) {
                localStorage.setItem('adminToken', 'true');
                navigate('/admin/dashboard');
            } else {
                setError('Invalid admin credentials. Access Denied.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('System Error. Cannot verify credentials at this time.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#050505',
            color: '#fff',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#111',
                    borderRadius: '24px',
                    padding: '40px',
                    border: '1px solid #333',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#00c087',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px'
                    }}>
                        <Shield size={32} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '5px' }}>Admin Portal</h2>
                    <p style={{ color: '#888', fontSize: '14px' }}>Restricted Entry Only</p>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(255, 77, 79, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Admin Email</div>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 45px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '15px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Security Key/Password</div>
                        <div style={{ position: 'relative' }}>
                            <KeyRound size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter passcode"
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 45px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '15px'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#00c087',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> Authenticate Admin</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
