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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const ADMIN_DOC_ID = 'config'; // specific document ID

    useEffect(() => {
        fetchAdminConfig();
    }, []);

    const fetchAdminConfig = async () => {
        setLoading(true);
        try {
            const adminDocRef = doc(db, 'admin_set', ADMIN_DOC_ID);
            const adminSnapshot = await getDoc(adminDocRef);

            if (adminSnapshot.exists()) {
                setAdminData(adminSnapshot.data());
            } else {
                // Initialize default config if it doesn't exist
                const defaultConfig = {
                    email: 'admin@gmail.com',
                    password: '12345678',
                    name: 'Super Admin',
                    profileUrl: ''
                };
                await setDoc(adminDocRef, defaultConfig);
                setAdminData(defaultConfig);
            }
        } catch (error) {
            console.error("Error fetching admin config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setAdminData({ ...adminData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const adminDocRef = doc(db, 'admin_set', ADMIN_DOC_ID);
            await updateDoc(adminDocRef, {
                email: adminData.email,
                password: adminData.password,
                name: adminData.name,
                profileUrl: adminData.profileUrl
            });
            alert('Settings updated successfully!');
            // Update localstorage to preserve session via new email if needed (but currently localStorage is just true/false)
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
            style={{ maxWidth: '600px', backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #222' }}
        >
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>Admin Profile Settings</h2>

            <form onSubmit={handleSave}>
                {/* Profile Image Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', border: '2px solid #00c087', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#1a1a1a', marginBottom: '10px' }}>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#00c087', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                        <Camera size={14} /> Change Image
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} accept="image/*" />
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Admin Name</label>
                        <input
                            type="text"
                            name="name"
                            value={adminData.name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Login Email</label>
                        <input
                            type="email"
                            name="email"
                            value={adminData.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Login Password</label>
                        <input
                            type="text"
                            name="password"
                            value={adminData.password}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        />
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
                        fontSize: '16px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '30px'
                    }}
                >
                    {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Update Content</>}
                </button>
            </form>
        </motion.div>
    );
};

export default AdminSettings;
