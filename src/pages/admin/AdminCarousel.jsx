import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { uploadFileChunks } from '../../services/dbs';
import { Image as ImageIcon, Plus, Trash2, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCarousel = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newBanner, setNewBanner] = useState({
        title: '',
        description: '',
        imageFile: null,
        preview: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'carousel'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewBanner({ ...newBanner, imageFile: file, preview: URL.createObjectURL(file) });
        }
    };

    const handleUpload = async () => {
        if (!newBanner.imageFile) return alert('Please select an image');
        setUploading(true);

        try {
            const uploadResult = await uploadFileChunks(newBanner.imageFile);
            if (uploadResult.success) {
                await addDoc(collection(db, 'carousel'), {
                    imageUrl: uploadResult.url,
                    title: newBanner.title || '',
                    description: newBanner.description || '',
                    timestamp: new Date().toISOString()
                });
                setNewBanner({ title: '', description: '', imageFile: null, preview: '' });
                alert('Banner added successfully!');
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this banner?')) return;
        try {
            await deleteDoc(doc(db, 'carousel', id));
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#00c087', margin: 0 }}>Banner Management</h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>Control the home page slider hero images</p>
                </div>
            </div>

            {/* Add New Banner Form */}
            <div style={{ backgroundColor: '#111', padding: '25px', borderRadius: '16px', border: '1px solid #222', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>Add New Hero Slide</h3>
                
                <div className="banner-form-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>Slide Title (Optional)</label>
                            <input 
                                type="text"
                                value={newBanner.title}
                                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                placeholder="e.g. BTC/USDT New High"
                                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>Description (Optional)</label>
                            <textarea 
                                value={newBanner.description}
                                onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                                placeholder="Short description for the slide..."
                                style={{ width: '100%', height: '80px', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#888' }}>Background Image</label>
                        <div 
                            onClick={() => document.getElementById('slide-upload').click()}
                            style={{ 
                                flex: 1, 
                                border: '2px dashed #333', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                overflow: 'hidden',
                                position: 'relative',
                                background: '#1a1a1a'
                            }}
                        >
                            {newBanner.preview ? (
                                <img src={newBanner.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#444' }}>
                                    <Plus size={32} />
                                    <div style={{ fontSize: '12px', marginTop: '5px' }}>Upload Slide Image</div>
                                </div>
                            )}
                        </div>
                        <input type="file" id="slide-upload" style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*" />
                        
                        <button 
                            onClick={handleUpload}
                            disabled={uploading || !newBanner.imageFile}
                            style={{ 
                                padding: '14px', 
                                backgroundColor: '#00c087', 
                                color: '#000', 
                                border: 'none', 
                                borderRadius: '10px', 
                                fontWeight: '900', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: uploading ? 0.6 : 1
                            }}
                        >
                            {uploading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Add Banner Slide</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* List Existing Banners */}
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Active Slides</h3>
            {loading ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#555' }}>Loading banners...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {banners.map(banner => (
                        <div key={banner.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                <img src={banner.imageUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {(banner.title || banner.description) && (
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '15px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '800' }}>{banner.title}</div>
                                        <div style={{ fontSize: '11px', color: '#aaa' }}>{banner.description}</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleDelete(banner.id)} style={{ padding: '8px', background: 'rgba(255,77,79,0.1)', border: 'none', color: '#ff4d4f', borderRadius: '8px', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div style={{ gridColumn: '1/-1', border: '2px dashed #222', padding: '40px', textAlign: 'center', borderRadius: '16px', color: '#444' }}>
                            No banners active. Using default fallback.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminCarousel;
