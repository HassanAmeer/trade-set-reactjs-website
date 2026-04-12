import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadFileChunks } from '../../services/dbs';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, User } from 'lucide-react';

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
        minWithdrawal: 20
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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
            } else {
                const defaultConfig = {
                    email: 'admin@gmail.com',
                    password: '12345678',
                    name: 'Super Admin',
                    profileUrl: ''
                };
                await setDoc(adminDocRef, defaultConfig);
                setAdminData(defaultConfig);
            }

            // Platform Config
            const platformRef = doc(db, 'admin_set', 'platform');
            const platformSnapshot = await getDoc(platformRef);
            if (platformSnapshot.exists()) {
                setPlatformConfig(platformSnapshot.data());
            } else {
                const defaultPlatform = {
                    usdtAddress: 'TMR7XE9h7aA9eApXK4jLqR7p3z',
                    minDeposit: 10,
                    minWithdrawal: 20
                };
                await setDoc(platformRef, defaultPlatform);
                setPlatformConfig(defaultPlatform);
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update Admin
            const adminDocRef = doc(db, 'admin_set', ADMIN_DOC_ID);
            await updateDoc(adminDocRef, adminData);

            // Update Platform
            const platformRef = doc(db, 'admin_set', 'platform');
            await setDoc(platformRef, platformConfig); // Use setDoc to ensure it exists or updates

            alert('All settings updated successfully!');
        } catch (error) {
            alert('Failed to save settings: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadFileChunks(file);
            if (result.success && result.url) {
                setAdminData(prev => ({ ...prev, profileUrl: result.url }));
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            alert("Error uploading file: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading settings...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}
        >
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>Admin & Platform Settings</h2>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.2fr)', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* Profile Section */}
                <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #222' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>Admin Profile</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                        <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', border: '2px solid #00c087', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#1a1a1a', marginBottom: '10px' }}>
                            {adminData.profileUrl ? (
                                <img src={adminData.profileUrl} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={40} color="#666" />
                            )}
                            {uploading && (
                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Loader2 className="animate-spin" color="#00c087" />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00c087', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                        >
                            <Camera size={14} /> Change Avatar
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={adminData.name}
                                onChange={handleAdminChange}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Login Email</label>
                            <input
                                type="email"
                                name="email"
                                value={adminData.email}
                                onChange={handleAdminChange}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Password</label>
                            <input
                                type="text"
                                name="password"
                                value={adminData.password}
                                onChange={handleAdminChange}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Platform Config Section */}
                <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #222' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px' }}>Platform Configuration</h3>
                    
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>USDT (TRC20) Deposit Address</label>
                            <input
                                type="text"
                                name="usdtAddress"
                                value={platformConfig.usdtAddress}
                                onChange={handlePlatformChange}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Min Deposit (USDT)</label>
                                <input
                                    type="number"
                                    name="minDeposit"
                                    value={platformConfig.minDeposit}
                                    onChange={handlePlatformChange}
                                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Min Withdrawal (USDT)</label>
                                <input
                                    type="number"
                                    name="minWithdrawal"
                                    value={platformConfig.minWithdrawal}
                                    onChange={handlePlatformChange}
                                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#00c087',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '30px'
                        }}
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save All Changes</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default AdminSettings;
