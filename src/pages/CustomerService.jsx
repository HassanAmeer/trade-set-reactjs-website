import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerService = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                minHeight: '100vh',
                background: '#f5f5f5',
                padding: '0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Header with back button for app navigation */}
            <div style={{ background: '#007bff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronLeft size={24} color="#fff" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0' }}>Leave us a message</h1>
            </div>

            <div style={{ padding: '20px 16px', background: '#fff' }}>
                {/* Message 1 */}
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
                    Hello, we are sorry that we are unable to provide you with service at the moment. If you need help, please leave a message. We will contact you as soon as possible and solve your problem.
                </p>

                {/* Phone Input Label */}
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>
                    Phone <span style={{ color: '#ff4d4f' }}>*</span>
                </div>
                <input
                    type="text"
                    placeholder=""
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        marginBottom: '24px',
                        outline: 'none',
                        fontSize: '14px'
                    }}
                />

                {/* Message 2 */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: '0' }}>
                        Hello, we are sorry that we are unable to provide you with service at the moment. If you need help, please leave a message. We will contact you as soon as possible and solve your problem. <span style={{ color: '#ff4d4f' }}>*</span>
                    </p>
                </div>

                {/* Textarea placeholder area */}
                <textarea
                    style={{
                        width: '100%',
                        height: '100px',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        marginBottom: '24px',
                        outline: 'none',
                        fontSize: '14px',
                        resize: 'none'
                    }}
                />

                {/* Upload Button */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid #e0e0e0'
                    }}>
                        <Plus size={24} color="#999" />
                        <span style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Upload</span>
                    </div>
                </div>

                {/* Upload Limit Note */}
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '32px' }}>
                    * You can upload up to 5 pictures in jpg, png, gif and svg format with image size no more than 5M.
                </p>

                {/* Submit Button */}
                <button style={{
                    width: '100%',
                    background: '#007bff',
                    color: '#fff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,123,255,0.2)'
                }}>
                    Submit
                </button>
            </div>
        </motion.div>
    );
};

export default CustomerService;
