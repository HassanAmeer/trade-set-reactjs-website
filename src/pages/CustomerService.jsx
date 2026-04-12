import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, Loader2, Image as ImageIcon, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, addDoc } from 'firebase/firestore';
import { uploadFileChunks } from '../services/dbs';

const CustomerService = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newFiles = [...imageFiles, ...files];
            setImageFiles(newFiles);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        const filteredFiles = imageFiles.filter((_, i) => i !== index);
        const filteredPreviews = previews.filter((_, i) => i !== index);
        setImageFiles(filteredFiles);
        setPreviews(filteredPreviews);
    };

    const handleSubmit = async () => {
        if (!phone || !message) {
            alert('Please fill out all fields');
            return;
        }

        setLoading(true);
        let uploadedUrls = [];

        try {
            // 1. Upload Multiple Images
            if (imageFiles.length > 0) {
                setUploading(true);
                for (const file of imageFiles) {
                    const result = await uploadFileChunks(file);
                    if (result.success) {
                        uploadedUrls.push(result.url);
                    }
                }
            }

            // 2. Save Document
            await addDoc(collection(db, 'support_messages'), {
                userId: user?.id || 'guest',
                userEmail: user?.email || 'guest',
                phone: phone,
                content: message,
                imageUrls: uploadedUrls, // Array of strings
                timestamp: new Date().toISOString(),
                status: 'unread'
            });

            alert('Message submitted successfully. Admin will reply to your Inbox.');
            setMessage('');
            setPhone('');
            setImageFiles([]);
            setPreviews([]);
            navigate('/inbox'); 
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="app-container"
            style={{
                minHeight: '100vh',
                background: '#f8f9fa',
                padding: '0',
                color: '#333',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            <div style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <ChevronLeft size={24} color="#fff" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0' }}>Support Center</h1>
            </div>

            <div style={{ padding: '24px 20px' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                        Leave a message and our team will get back to you shortly. Feel free to attach multiple screenshots if needed.
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#444', marginBottom: '8px' }}>Phone / WhatsApp <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +1 234 567 890"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                outline: 'none',
                                fontSize: '15px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#444', marginBottom: '8px' }}>Describe your issue <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="How can we help you?"
                            style={{
                                width: '100%',
                                height: '120px',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                outline: 'none',
                                fontSize: '15px',
                                resize: 'none'
                            }}
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#444', marginBottom: '10px' }}>Attachments (Max 5)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                            {previews.map((src, i) => (
                                <div key={i} style={{ position: 'relative', width: '70px', height: '70px' }}>
                                    <img src={src} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }} />
                                    <button 
                                        onClick={() => removeImage(i)}
                                        style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ width: '70px', height: '70px', border: '2px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fafafa', color: '#888' }}
                                >
                                    <Plus size={24} />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(to right, #007bff, #0056b3)',
                            color: '#fff',
                            padding: '16px',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                            opacity: (loading || uploading) ? 0.7 : 1
                        }}
                    >
                        {(loading || uploading) ? (
                            <><Loader2 className="animate-spin" size={20} /> {(uploading && !loading) ? `Uploading ${imageFiles.length} images...` : 'Submitting...'}</>
                        ) : 'Submit Report'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CustomerService;
