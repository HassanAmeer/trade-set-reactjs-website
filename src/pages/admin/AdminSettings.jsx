import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadFileChunks } from '../../services/dbs';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, User, Zap, Eye, EyeOff } from 'lucide-react';

const AdminSettings = () => {
    const [adminData, setAdminData] = useState({
        email: '',
        password: '',
        name: '',
        profileUrl: ''
    });
    const [platformConfig, setPlatformConfig] = useState({
        usdtAddress: '',
        minDeposit: 10,
        minWithdrawal: 20,
        websiteName: 'TradeSet',
        websiteTitle: 'Professional Trading Platform',
        logoUrl: '',
        faviconUrl: '',
        referralCommission: 10,
        emailjsServiceId: '',
        emailjsTemplates: '',
        emailjsPublicKey: ''
    });
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState(''); // 'account', 'branding', 'market', 'email'
    const [showPassword, setShowPassword] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingBranding, setUploadingBranding] = useState(''); // 'logo' or 'favicon'
    const fileInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const faviconInputRef = useRef(null);

    const ADMIN_DOC_ID = 'config'; 

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            // Admin Data
            const adminDocRef = doc(db, 'admin_set', ADMIN_DOC_ID);
            const adminSnapshot = await getDoc(adminDocRef);
            if (adminSnapshot.exists()) {
                setAdminData(adminSnapshot.data());
            }

            // Platform Config
            const platformRef = doc(db, 'admin_set', 'platform');
            const platformSnapshot = await getDoc(platformRef);
            if (platformSnapshot.exists()) {
                setPlatformConfig(prev => ({ ...prev, ...platformSnapshot.data() }));
            } else {
                const defaultPlatform = {
                    usdtAddress: 'TMR7XE9h7aA9eApXK4jLqR7p3z',
                    minDeposit: 10,
                    minWithdrawal: 20,
                    websiteName: 'TradeSet',
                    websiteTitle: 'Professional Trading Platform',
                    logoUrl: '',
                    faviconUrl: '',
                    referralCommission: 10,
                    emailjsServiceId: '',
                    emailjsTemplates: '',
                    emailjsPublicKey: ''
                };
                setPlatformConfig(defaultPlatform);
            }

            }
        } catch (error) {
            console.error("Error fetching configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminChange = (e) => {
        setAdminData({ ...adminData, [e.target.name]: e.target.value });
    };

    const handlePlatformChange = (e) => {
        setPlatformConfig({ ...platformConfig, [e.target.name]: e.target.value });
    };

    const saveAccount = async (e) => {
        e.preventDefault();
        setSavingSection('account');
        try {
            const adminDocRef = doc(db, 'admin_set', ADMIN_DOC_ID);
            await updateDoc(adminDocRef, adminData);
            alert('Admin account settings updated!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingSection('');
        }
    };

    const saveBranding = async (e) => {
        e.preventDefault();
        setSavingSection('branding');
        try {
            const platformRef = doc(db, 'admin_set', 'platform');
            await setDoc(platformRef, platformConfig);
            alert('Website branding updated successfully!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingSection('');
        }
    };

    const saveMarket = async (e) => {
        e.preventDefault();
        setSavingSection('market');
        try {
            const platformRef = doc(db, 'admin_set', 'platform');
            await setDoc(platformRef, platformConfig);
            alert('Market configuration saved!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingSection('');
        }
    };

    const saveEmailConfig = async (e) => {
        e.preventDefault();
        setSavingSection('email');
        try {
            const platformRef = doc(db, 'admin_set', 'platform');
            await setDoc(platformRef, platformConfig);
            alert('Email settings updated successfully!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingSection('');
        }
    };

    const handleImageSelect = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'profile') setUploading(true);
        else setUploadingBranding(type);

        try {
            const result = await uploadFileChunks(file);
            if (result.success && result.url) {
                if (type === 'profile') setAdminData(prev => ({ ...prev, profileUrl: result.url }));
                if (type === 'logo') setPlatformConfig(prev => ({ ...prev, logoUrl: result.url }));
                if (type === 'favicon') setPlatformConfig(prev => ({ ...prev, faviconUrl: result.url }));
            }
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(false);
            setUploadingBranding('');
        }
    };

    if (loading) return (
        <div style={{ padding: '0 20px' }}>
            <div className="skeleton-loader" style={{ width: '250px', height: '35px', marginBottom: '40px' }}></div>
            <div className="settings-grid">
                {[1,2,3,4].map(i => (
                    <div key={i} className="settings-card" style={{ gap: '20px' }}>
                        <div className="skeleton-loader" style={{ width: '150px', height: '25px', marginBottom: '10px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '45px', borderRadius: '10px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '45px', borderRadius: '10px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '45px', borderRadius: '10px' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', padding: '0 20px', paddingBottom: '50px' }}
        >
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>System Settings</h2>

            <div className="settings-grid">
                
                {/* 1. Admin Account Form */}
                <form onSubmit={saveAccount} className="settings-card">
                    <h3 style={sectionHeaderStyle}>Admin Account</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                        <div style={avatarContainerStyle}>
                            {adminData.profileUrl ? <img src={adminData.profileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#333" />}
                            {uploading && <div style={uploadOverlayStyle}><Loader2 className="animate-spin" color="#00c087" /></div>}
                        </div>
                        <button type="button" onClick={() => fileInputRef.current.click()} style={changeBtnStyle}>Change Avatar</button>
                        <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'profile')} style={{ display: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <label style={labelStyle}>Full Name</label>
                        <input type="text" name="name" value={adminData.name} onChange={handleAdminChange} placeholder="Admin Name" style={inputStyle} />
                        <label style={labelStyle}>Email Address</label>
                        <input type="email" name="email" value={adminData.email} onChange={handleAdminChange} placeholder="Login Email" style={inputStyle} />
                        <label style={labelStyle}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                value={adminData.password} 
                                onChange={handleAdminChange} 
                                placeholder="New Password" 
                                style={inputStyle} 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#555',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={savingSection === 'account'} style={saveBtnStyle}>
                        {savingSection === 'account' ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Update Account</>}
                    </button>
                </form>

                {/* 2. Website Branding Form */}
                <form onSubmit={saveBranding} className="settings-card">
                    <h3 style={sectionHeaderStyle}>Website Branding</h3>
                    
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '25px' }}>
                        <div>
                            <label style={labelStyle}>Website Name</label>
                            <input type="text" name="websiteName" value={platformConfig.websiteName} onChange={handlePlatformChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Browser Tab Title</label>
                            <input type="text" name="websiteTitle" value={platformConfig.websiteTitle} onChange={handlePlatformChange} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <label style={labelStyle}>Logo</label>
                            <div onClick={() => logoInputRef.current.click()} style={uploadBoxStyle}>
                                {platformConfig.logoUrl ? <img src={platformConfig.logoUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <Camera size={24} color="#333" />}
                                {uploadingBranding === 'logo' && <div style={uploadOverlayStyle}><Loader2 className="animate-spin" /></div>}
                            </div>
                            <input type="file" ref={logoInputRef} onChange={(e) => handleImageSelect(e, 'logo')} style={{ display: 'none' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <label style={labelStyle}>Favicon</label>
                            <div onClick={() => faviconInputRef.current.click()} style={uploadBoxStyle}>
                                {platformConfig.faviconUrl ? <img src={platformConfig.faviconUrl} style={{ width: '30px', height: '30px' }} /> : <Camera size={24} color="#333" />}
                                {uploadingBranding === 'favicon' && <div style={uploadOverlayStyle}><Loader2 className="animate-spin" /></div>}
                            </div>
                            <input type="file" ref={faviconInputRef} onChange={(e) => handleImageSelect(e, 'favicon')} style={{ display: 'none' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={savingSection === 'branding'} style={{ ...saveBtnStyle, backgroundColor: '#00c087' }}>
                        {savingSection === 'branding' ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Deploy Branding</>}
                    </button>
                </form>

                {/* 3. Market Configuration Form */}
                <form onSubmit={saveMarket} className="settings-card">
                    <h3 style={sectionHeaderStyle}>Market Config</h3>
                    
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>USDT (TRC20) Wallet</label>
                            <input type="text" name="usdtAddress" value={platformConfig.usdtAddress} onChange={handlePlatformChange} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={labelStyle}>Min Deposit</label>
                                <input type="number" name="minDeposit" value={platformConfig.minDeposit} onChange={handlePlatformChange} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Min Withdrawal</label>
                                <input type="number" name="minWithdrawal" value={platformConfig.minWithdrawal} onChange={handlePlatformChange} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Referral Commission (%)</label>
                            <input type="number" name="referralCommission" value={platformConfig.referralCommission} onChange={handlePlatformChange} style={inputStyle} />
                        </div>
                    </div>

                    <button type="submit" disabled={savingSection === 'market'} style={{ ...saveBtnStyle, backgroundColor: '#f0b90b', color: '#000' }}>
                        {savingSection === 'market' ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Update Limits</>}
                    </button>
                </form>

                {/* 4. Email Configuration Form */}
                <form onSubmit={saveEmailConfig} className="settings-card">
                    <h3 style={{ ...sectionHeaderStyle, color: 'var(--accent-gold)' }}>Email System (EmailJS)</h3>
                    
                    <div style={{ display: 'flex', gap: '12px', backgroundColor: 'rgba(240,185,11,0.05)', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                        <Zap size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: '1.4' }}>
                            React is a frontend framework. For security, bypass SMTP by using <strong>EmailJS.com</strong>. Connect your Gmail there, then paste your IDs below.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label style={labelStyle}>EmailJS Service ID</label>
                            <input type="text" name="emailjsServiceId" value={platformConfig.emailjsServiceId || ''} onChange={handlePlatformChange} placeholder="service_xxxx" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email Template IDs (Comma Separated)</label>
                            <input 
                                type="text" 
                                name="emailjsTemplates" 
                                value={platformConfig.emailjsTemplates || ''} 
                                onChange={handlePlatformChange} 
                                placeholder="template_otp, template_multi, template_other..." 
                                style={inputStyle} 
                            />
                            <p style={{ fontSize: '10px', color: '#555', marginTop: '5px' }}>
                                Format: <b>OTP_ID, MULTI_ID</b> (Separated by comma)
                            </p>
                        </div>
                        <div>
                            <label style={labelStyle}>EmailJS Public Key</label>
                            <input type="text" name="emailjsPublicKey" value={platformConfig.emailjsPublicKey || ''} onChange={handlePlatformChange} placeholder="user_xxxx" style={inputStyle} />
                        </div>
                    </div>

                    <button type="submit" disabled={savingSection === 'email'} style={{ ...saveBtnStyle, backgroundColor: 'var(--accent-gold)', color: '#000' }}>
                        {savingSection === 'email' ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Email Config</>}
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

// Styles
const sectionHeaderStyle = {
    color: '#00c087',
    fontSize: '18px',
    fontWeight: '900',
    marginBottom: '25px',
    textTransform: 'uppercase'
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #222',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px'
};

const labelStyle = {
    display: 'block',
    fontSize: '11px',
    color: '#666',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: '6px',
    marginTop: '10px'
};

const avatarContainerStyle = {
    position: 'relative',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '2px solid #00c087',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: '10px'
};

const uploadBoxStyle = {
    height: '80px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '2px dashed #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
};

const uploadOverlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00c087'
};

const changeBtnStyle = {
    fontSize: '12px',
    background: 'none',
    border: 'none',
    color: '#00c087',
    cursor: 'pointer',
    fontWeight: '700'
};

const saveBtnStyle = {
    width: '100%',
    padding: '16px',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '900',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '30px',
    backgroundColor: '#222',
    transition: 'all 0.2s easse'
};

export default AdminSettings;
