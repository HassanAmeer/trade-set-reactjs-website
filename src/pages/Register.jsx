import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ChevronLeft } from 'lucide-react';

const Register = () => {
    const [method, setMethod] = useState('Email');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}
        >
            <div className="flex-between" style={{ padding: '20px 0' }}>
                <ChevronLeft size={24} />
                <Globe size={24} />
            </div>

            <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Register</h1>

            <div className="glass" style={{ display: 'flex', borderRadius: '12px', padding: '4px', marginBottom: '32px' }}>
                {['Email', 'Phone number'].map(m => (
                    <div
                        key={m}
                        onClick={() => setMethod(m)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            background: method === m ? 'var(--accent-gold)' : 'transparent',
                            color: method === m ? '#000' : 'var(--text-secondary)',
                            fontWeight: method === m ? '700' : '400',
                            transition: 'all 0.3s'
                        }}
                    >
                        {m}
                    </div>
                ))}
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {['Email', 'Password', 'Confirm password', 'Invite Code'].map(field => (
                    <div key={field}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{field}</div>
                        <input
                            type={field.includes('password') ? 'password' : 'text'}
                            placeholder={`Enter your ${field.toLowerCase()}`}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '14px',
                                color: '#fff'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input type="checkbox" />
                <span style={{ color: 'var(--text-secondary)' }}>I have read and agreed to the (User Agreement)</span>
            </div>

            <button style={{
                width: '100%',
                background: 'var(--accent-gold)',
                color: '#000',
                fontWeight: '700',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                marginTop: '32px',
                fontSize: '16px'
            }}>
                Register
            </button>
        </motion.div>
    );
};

export default Register;
