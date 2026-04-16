import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { uploadFileChunks } from '../../services/dbs';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, Megaphone, Bell, Layout } from 'lucide-react';

const AdminAnnouncements = () => {
    const [announcementConfig, setAnnouncementConfig] = useState({
        bottomActive: false,
        popupActive: false,
        barTitle: '',
        barSubtitle: '',
        popupTitle: '',
        popupImage: '',
        popupDescription: ''
    });
    const [loading, setLoading] = useState(true);
    const [savingBar, setSavingBar] = useState(false);
    const [savingPopup, setSavingPopup] = useState(false);
    const [uploading, setUploading] = useState(false);
    const announcementImageInputRef = useRef(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const announceRef = doc(db, 'admin_set', 'announcement');
            const announceSnapshot = await getDoc(announceRef);
            if (announceSnapshot.exists()) {
                setAnnouncementConfig(prev => ({ ...prev, ...announceSnapshot.data() }));
            }
        } catch (error) {
            console.error("Error fetching configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnnouncementChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAnnouncementConfig({ 
            ...announcementConfig, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const updateBarSettings = async () => {
        setSavingBar(true);
        try {
            const announceRef = doc(db, 'admin_set', 'announcement');
            await setDoc(announceRef, announcementConfig);
            alert('Bottom Bar settings updated!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingBar(false);
        }
    };

    const updatePopupSettings = async () => {
        setSavingPopup(true);
        try {
            const announceRef = doc(db, 'admin_set', 'announcement');
            await setDoc(announceRef, announcementConfig);
            alert('Popup settings updated!');
        } catch (error) {
            alert('Failed: ' + error.message);
        } finally {
            setSavingPopup(false);
        }
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadFileChunks(file);
            if (result.success && result.url) {
                setAnnouncementConfig(prev => ({ ...prev, popupImage: result.url }));
            }
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '20px' }}>
            <div className="skeleton-loader" style={{ width: '300px', height: '40px', marginBottom: '40px' }}></div>
            <div className="skeleton-loader" style={{ width: '100%', height: '200px', borderRadius: '15px' }}></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ width: '100%', padding: '0 20px 50px' }}
        >
            {/* Header Area */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                    <Megaphone size={32} color="#f0b90b" />
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>Announcement Hub</h1>
                </div>
                <p style={{ color: '#666', fontSize: '14px' }}>Manage independent notification channels for your trading platform.</p>
            </div>

            <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* SECTION 1: BOTTOM BAR */}
                <div style={containerStyle}>
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ ...iconBoxStyle, backgroundColor: 'rgba(0,192,135,0.1)' }}>
                                <Layout size={20} color="#00c087" />
                            </div>
                            <div>
                                <h2 style={sectionTitleStyle}>Bottom Sticky Bar</h2>
                                <p style={subTextStyle}>Visible above the user's navigation bar</p>
                            </div>
                        </div>
                        <Toggle 
                            active={announcementConfig.bottomActive} 
                            onClick={() => setAnnouncementConfig(prev => ({ ...prev, bottomActive: !prev.bottomActive }))} 
                            color="#00c087"
                        />
                    </div>

                    <div style={{ ...contentAreaStyle, opacity: announcementConfig.bottomActive ? 1 : 0.4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Headline</label>
                                <input type="text" name="barTitle" value={announcementConfig.barTitle} onChange={handleAnnouncementChange} placeholder="e.g. USDT Bonus Active!" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Short Description</label>
                                <input type="text" name="barSubtitle" value={announcementConfig.barSubtitle} onChange={handleAnnouncementChange} placeholder="Brief summary for the bar" style={inputStyle} />
                            </div>
                        </div>
                        <button 
                            onClick={updateBarSettings} 
                            disabled={savingBar} 
                            style={{ ...saveBtnStyle, backgroundColor: '#00c087' }}
                        >
                            {savingBar ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Bar Announcement</>}
                        </button>
                    </div>
                </div>

                {/* SECTION 2: CENTRAL POPUP */}
                <div style={containerStyle}>
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ ...iconBoxStyle, backgroundColor: 'rgba(240,185,11,0.1)' }}>
                                <Bell size={20} color="#f0b90b" />
                            </div>
                            <div>
                                <h2 style={{ ...sectionTitleStyle, color: '#f0b90b' }}>Central Promo Popup</h2>
                                <p style={subTextStyle}>Modal popup that appears on page reload</p>
                            </div>
                        </div>
                        <Toggle 
                            active={announcementConfig.popupActive} 
                            onClick={() => setAnnouncementConfig(prev => ({ ...prev, popupActive: !prev.popupActive }))} 
                            color="#f0b90b"
                        />
                    </div>

                    <div style={{ ...contentAreaStyle, opacity: announcementConfig.popupActive ? 1 : 0.4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Popup Title</label>
                                    <input type="text" name="popupTitle" value={announcementConfig.popupTitle} onChange={handleAnnouncementChange} placeholder="Main bold title" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Full Description</label>
                                    <textarea 
                                        name="popupDescription" 
                                        value={announcementConfig.popupDescription} 
                                        onChange={handleAnnouncementChange} 
                                        placeholder="Detailed content for the modal..." 
                                        style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} 
                                    />
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <label style={labelStyle}>Image / Banner</label>
                                <div onClick={() => announcementConfig.popupActive && announcementImageInputRef.current.click()} style={uploadBoxStyle}>
                                    {announcementConfig.popupImage ? <img src={announcementConfig.popupImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Camera size={28} color="#333" />}
                                    {uploading && <div style={uploadOverlayStyle}><Loader2 className="animate-spin" /></div>}
                                </div>
                                <button type="button" onClick={() => announcementImageInputRef.current.click()} style={changeBtnStyle}>Change Image</button>
                                <input type="file" ref={announcementImageInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />
                            </div>
                        </div>
                        <button 
                            onClick={updatePopupSettings} 
                            disabled={savingPopup} 
                            style={{ ...saveBtnStyle, backgroundColor: '#f0b90b', color: '#000' }}
                        >
                            {savingPopup ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Popup Config</>}
                        </button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

// Toggle Component
const Toggle = ({ active, onClick, color = '#f0b90b' }) => (
    <div 
        onClick={onClick}
        style={{
            width: '54px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: active ? color : '#222',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s'
        }}
    >
        <div style={{
            position: 'absolute',
            top: '3px',
            left: active ? '29px' : '3px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: active ? '#000' : '#888',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }} />
    </div>
);

// Modular Styles
const containerStyle = {
    background: '#111',
    borderRadius: '20px',
    border: '1px solid #222',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const headerStyle = {
    padding: '25px 30px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.01)'
};

const contentAreaStyle = {
    padding: '30px',
    display: 'grid',
    gap: '25px',
    transition: 'all 0.3s ease'
};

const sectionTitleStyle = {
    color: '#00c087',
    fontSize: '18px',
    fontWeight: '900',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const subTextStyle = {
    color: '#555',
    fontSize: '12px',
    margin: '2px 0 0 0'
};

const iconBoxStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #1e1e1e',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    marginTop: '8px',
    transition: 'border-color 0.2s'
};

const labelStyle = {
    display: 'block',
    fontSize: '11px',
    color: '#444',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const uploadBoxStyle = {
    marginTop: '8px',
    height: '180px',
    background: '#0a0a0a',
    borderRadius: '15px',
    border: '2px dashed #1e1e1e',
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
    color: '#f0b90b'
};

const changeBtnStyle = {
    fontSize: '12px',
    background: 'none',
    border: 'none',
    color: '#f0b90b',
    cursor: 'pointer',
    fontWeight: '700',
    marginTop: '10px'
};

const saveBtnStyle = {
    padding: '15px 35px',
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
    marginTop: '10px',
    width: 'fit-content',
    transition: 'all 0.2s'
};

export default AdminAnnouncements;
