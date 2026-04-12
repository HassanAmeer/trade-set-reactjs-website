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
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!phone || !message) {
            alert('Please fill out all fields');
            return;
        }

        setLoading(true);
        let imageUrl = '';

        try {
            // 1. Upload Image if exists
            if (imageFile) {
                setUploading(true);
                const result = await uploadFileChunks(imageFile);
                if (result.success) {
                    imageUrl = result.url;
                } else {
                    throw new Error("Image upload failed");
                }
            }

            // 2. Save Document
            await addDoc(collection(db, 'support_messages'), {
                userId: user?.id || 'guest',
                userEmail: user?.email || 'guest',
                phone: phone,
                content: message,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString(),
                status: 'unread'
            });

            alert('Message submitted successfully. Admin will reply to your Inbox.');
            setMessage('');
            setPhone('');
            removeImage();
            navigate('/inbox'); // Optionally navigate to messages to see responses
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
                        Leave a message and our team will get back to you shortly. Feel free to attach a screenshot if you're facing technical issues.
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
                                fontSize: '15px',
                                transition: 'border-color 0.2s'
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#444', marginBottom: '10px' }}>Attachment (Optional)</label>
                        <div 
                            onClick={() => fileInputRef.current.click()}
                            style={{ 
                                width: '100%', 
                                border: '2px dashed #ddd', 
                                borderRadius: '12px', 
                                padding: '20px', 
                                textAlign: 'center', 
                                cursor: 'pointer',
                                backgroundColor: '#fafafa',
                                transition: 'all 0.2s'
                            }}
                        >
                            {imagePreview ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                        style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <Camera size={32} />
                                    <span style={{ fontSize: '13px' }}>Click to upload screenshot</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: 'none' }} />
                        </div>
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
                            <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                        ) : 'Submit Report'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CustomerService;

export default CustomerService;
