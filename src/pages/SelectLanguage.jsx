import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SelectLanguage = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState('English');

    const languages = [
        'English',
        'Indonesia',
        'Italia',
        'Français',
        'Tiếng Việtcais',
        'Español',
        '中文'
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #222',
                background: 'var(--bg-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Select language</h1>
            </div>

            {/* Language List */}
            <div style={{ marginTop: '8px' }}>
                {languages.map((lang) => (
                    <div
                        key={lang}
                        onClick={() => setSelected(lang)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 16px',
                            borderBottom: '1px solid #222',
                            cursor: 'pointer',
                            background: 'transparent'
                        }}
                    >
                        <span style={{
                            fontSize: '16px',
                            color: '#fff',
                            fontWeight: selected === lang ? '700' : '400'
                        }}>
                            {lang}
                        </span>
                        {selected === lang ? (
                            <CheckCircle2 size={24} fill="var(--accent-gold)" color="#000" />
                        ) : (
                            <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                background: 'transparent'
                            }} />
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default SelectLanguage;
