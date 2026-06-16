import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Search, ShieldCheck, ShieldAlert, Eye, EyeOff, Loader2, RefreshCw, Smartphone, Mail, User, Percent, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminP2P = () => {
    const [exchangers, setExchangers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [trustRatio, setTrustRatio] = useState('99');
    const [isTrusted, setIsTrusted] = useState(true);
    const [methodsInput, setMethodsInput] = useState('');
    const [visible, setVisible] = useState(true);

    // Announcement states
    const [announceText, setAnnounceText] = useState('');
    const [announceActive, setAnnounceActive] = useState(false);
    const [savingAnnounce, setSavingAnnounce] = useState(false);

    // Toast state
    const [toast, setToast] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchAnnounce = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'admin_set', 'p2p_config'));
                if (docSnap.exists()) {
                    setAnnounceText(docSnap.data().announcementText || '');
                    setAnnounceActive(docSnap.data().announcementActive || false);
                }
            } catch (e) {
                console.error("Error fetching announcement:", e);
            }
        };
        fetchAnnounce();
    }, []);

    const handleSaveAnnounce = async () => {
        setSavingAnnounce(true);
        try {
            await setDoc(doc(db, 'admin_set', 'p2p_config'), {
                announcementText: announceText.trim(),
                announcementActive: announceActive,
                updatedAt: new Date().toISOString()
            });
            showToast('success', 'P2P Announcement updated successfully!');
        } catch (e) {
            showToast('error', 'Error updating announcement: ' + e.message);
        } finally {
            setSavingAnnounce(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'p2p_exchangers'), (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ref: docSnap.ref,
                ...docSnap.data()
            }));
            // Sort by trusted status and trust ratio desc
            list.sort((a, b) => {
                if (a.isTrusted && !b.isTrusted) return -1;
                if (!a.isTrusted && b.isTrusted) return 1;
                return Number(b.trustRatio || 0) - Number(a.trustRatio || 0);
            });
            setExchangers(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching exchangers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setTrustRatio('99');
        setIsTrusted(true);
        setMethodsInput('');
        setVisible(true);
        setEditId(null);
        setIsFormOpen(false);
    };

    const handleOpenEdit = (item) => {
        setName(item.name || '');
        setEmail(item.email || '');
        setPhone(item.phone || '');
        setTrustRatio(item.trustRatio || '99');
        setIsTrusted(item.isTrusted !== false);
        setMethodsInput((item.methods || []).join(', '));
        setVisible(item.visible !== false);
        setEditId(item.id);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return showToast('error', "Name is required");

        setSubmitting(true);
        // Clean and convert methods from comma separated values to array
        const methods = methodsInput
            .split(',')
            .map(m => m.trim())
            .filter(m => m.length > 0);

        const data = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            trustRatio: Number(trustRatio) || 0,
            isTrusted,
            methods,
            visible,
            updatedAt: new Date().toISOString()
        };

        try {
            if (editId) {
                await updateDoc(doc(db, 'p2p_exchangers', editId), data);
                showToast('success', 'Exchanger updated successfully!');
            } else {
                data.createdAt = new Date().toISOString();
                await addDoc(collection(db, 'p2p_exchangers'), data);
                showToast('success', 'Exchanger added successfully!');
            }
            resetForm();
        } catch (error) {
            showToast('error', "Error saving exchanger: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exchanger?")) return;
        try {
            await deleteDoc(doc(db, 'p2p_exchangers', id));
            showToast('success', 'Exchanger deleted successfully!');
        } catch (error) {
            showToast('error', "Error deleting exchanger: " + error.message);
        }
    };

    const toggleVisibility = async (item) => {
        const nextVisibleStatus = !item.visible;
        try {
            await updateDoc(doc(db, 'p2p_exchangers', item.id), {
                visible: nextVisibleStatus
            });
            showToast('success', nextVisibleStatus ? 'Exchanger is now visible!' : 'Exchanger hidden!');
        } catch (error) {
            showToast('error', "Error updating visibility: " + error.message);
        }
    };

    const filteredExchangers = exchangers.filter(item => 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.methods || []).some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '220px', height: '30px', marginBottom: '25px' }}></div>
            <div className="admin-table-container">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '60px', borderRadius: '12px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'relative', width: '100%', padding: '0 20px 50px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', margin: 0 }}>
                        P2P Exchangers
                    </h2>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Manage direct peer-to-peer traders, trust statuses, contact credentials, and methods.
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsFormOpen(true);
                    }}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#f0b90b',
                        color: '#000',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(240,185,11,0.2)'
                    }}
                >
                    <Plus size={16} /> Add Exchanger
                </button>
            </div>

            {/* Announcement Banner Management Card */}
            <div style={{
                background: '#111',
                border: '1px solid #222',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '25px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#f0b90b' }}>📢</span> P2P Announcement Banner
                        </h3>
                        <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0 0' }}>
                            Set a notification text banner displayed at the top of the client-side P2P Merchants directory.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: announceActive ? '#00c087' : '#888', fontSize: '13px', fontWeight: '700' }}>
                            {announceActive ? 'Active' : 'Disabled'}
                        </span>
                        <Toggle active={announceActive} onClick={() => setAnnounceActive(!announceActive)} />
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <input
                            type="text"
                            placeholder="Enter announcement text (e.g., Contact verified merchants only for safe P2P transfers)"
                            value={announceText}
                            onChange={(e) => setAnnounceText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #222',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSaveAnnounce}
                        disabled={savingAnnounce}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#f0b90b',
                            color: '#000',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: savingAnnounce ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: '46px',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {savingAnnounce ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Announcement
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                    <Search size={16} color="#444" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search exchanger name, email, or payment methods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px 14px 44px',
                            backgroundColor: '#111',
                            border: '1px solid #222',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.25s'
                        }}
                    />
                    {searchQuery && (
                        <X 
                            size={16} 
                            color="#888" 
                            onClick={() => setSearchQuery('')} 
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                        />
                    )}
                </div>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: '700' }}>
                    Showing {filteredExchangers.length} of {exchangers.length} entries
                </div>
            </div>

            {/* Exchangers List Grid/Table */}
            <div className="admin-table-container">
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Exchanger</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Contact Info</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Trust Ratio</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Supported Methods</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Visibility</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExchangers.length > 0 ? (
                            filteredExchangers.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: item.isTrusted ? 'rgba(0,192,135,0.1)' : 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: item.isTrusted ? '#00c087' : '#fff',
                                                fontWeight: '800',
                                                fontSize: '16px',
                                                border: `1px solid ${item.isTrusted ? 'rgba(0,192,135,0.2)' : 'rgba(255,255,255,0.1)'}`
                                            }}>
                                                {(item.name || 'P')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '15px' }}>
                                                    {item.name}
                                                    {item.isTrusted && (
                                                        <span title="Trusted Merchant" style={{ display: 'flex', color: '#00c087' }}>
                                                            <ShieldCheck size={16} fill="rgba(0,192,135,0.2)" />
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '9px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    backgroundColor: item.isTrusted ? 'rgba(0,192,135,0.15)' : 'rgba(255,77,79,0.1)',
                                                    color: item.isTrusted ? '#00c087' : '#ff4d4f',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    marginTop: '4px',
                                                    display: 'inline-block'
                                                }}>
                                                    {item.isTrusted ? 'Trusted' : 'Standard'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {item.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#aaa' }}>
                                                    <Mail size={13} color="#555" />
                                                    <span>{item.email}</span>
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#aaa' }}>
                                                    <Smartphone size={13} color="#555" />
                                                    <span>{item.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffb800' }}>
                                                {item.trustRatio}%
                                            </span>
                                            {/* Trust Ratio Meter */}
                                            <div style={{ width: '60px', height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${item.trustRatio}%`,
                                                    height: '100%',
                                                    backgroundColor: Number(item.trustRatio) >= 90 ? '#00c087' : Number(item.trustRatio) >= 70 ? '#ffb800' : '#ff4d4f',
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '300px' }}>
                                            {item.methods && item.methods.length > 0 ? (
                                                item.methods.map((method, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            fontSize: '11px',
                                                            backgroundColor: 'rgba(240,185,11,0.06)',
                                                            color: '#ffb800',
                                                            border: '1px solid rgba(240,185,11,0.15)',
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            fontWeight: '700'
                                                        }}
                                                    >
                                                        {method}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#444' }}>None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button
                                            onClick={() => toggleVisibility(item)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: item.visible !== false ? '#00c087' : '#ff4d4f',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {item.visible !== false ? (
                                                <><Eye size={15} /> Active</>
                                            ) : (
                                                <><EyeOff size={15} /> Hidden</>
                                            )}
                                        </button>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#f0b90b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '6px'
                                                }}
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#ff4d4f',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '6px'
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                                    No P2P exchangers found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Slide-over or Popup Form Overlay */}
            <AnimatePresence>
                {isFormOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            style={{
                                background: '#111',
                                border: '1px solid #222',
                                borderRadius: '20px',
                                width: '100%',
                                maxWidth: '540px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 25px',
                                borderBottom: '1px solid #222',
                                background: 'rgba(255,255,255,0.01)'
                            }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                                    {editId ? 'Edit Exchanger' : 'Add New Exchanger'}
                                </h3>
                                <X size={20} color="#888" onClick={resetForm} style={{ cursor: 'pointer' }} />
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {/* Exchanger Name */}
                                <div>
                                    <label style={labelStyle}>Exchanger Name</label>
                                    <div style={{ position: 'relative', marginTop: '6px' }}>
                                        <User size={15} color="#555" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. PayEx Exchangers"
                                            style={inputWithIconStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {/* Email */}
                                    <div>
                                        <label style={labelStyle}>Contact Email</label>
                                        <div style={{ position: 'relative', marginTop: '6px' }}>
                                            <Mail size={15} color="#555" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="e.g. info@payex.com"
                                                style={inputWithIconStyle}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone / Contact */}
                                    <div>
                                        <label style={labelStyle}>Phone / Telegr. Link</label>
                                        <div style={{ position: 'relative', marginTop: '6px' }}>
                                            <Smartphone size={15} color="#555" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="e.g. +923000000000 or @username"
                                                style={inputWithIconStyle}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {/* Trust Ratio */}
                                    <div>
                                        <label style={labelStyle}>Trust Ratio (%)</label>
                                        <div style={{ position: 'relative', marginTop: '6px' }}>
                                            <Percent size={15} color="#555" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={trustRatio}
                                                onChange={(e) => setTrustRatio(e.target.value)}
                                                placeholder="e.g. 99"
                                                style={inputWithIconStyle}
                                            />
                                        </div>
                                    </div>

                                    {/* Trust Badge Status */}
                                    <div>
                                        <label style={labelStyle}>Verification Badge</label>
                                        <select
                                            value={isTrusted ? "true" : "false"}
                                            onChange={(e) => setIsTrusted(e.target.value === "true")}
                                            style={{
                                                width: '100%',
                                                padding: '13px 16px',
                                                backgroundColor: '#0a0a0a',
                                                border: '1px solid #222',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                outline: 'none',
                                                marginTop: '6px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="true">👑 Trusted Merchant</option>
                                            <option value="false">Standard Exchanger</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Supported Methods */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={labelStyle}>Supported Payment Methods</label>
                                        <span style={{ fontSize: '10px', color: '#555' }}>Separate with commas</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={methodsInput}
                                        onChange={(e) => setMethodsInput(e.target.value)}
                                        placeholder="e.g. JazzCash, Payeer, Bank Transfer, USDT"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid #222',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            marginTop: '6px'
                                        }}
                                    />
                                </div>

                                {/* Show / Hide Active Toggle */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    borderRadius: '12px',
                                    border: '1px solid #222',
                                    marginTop: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>Exchanger Visibility</div>
                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Enable this to list merchant on the client settings screen immediately.</div>
                                    </div>
                                    <Toggle active={visible} onClick={() => setVisible(!visible)} />
                                </div>

                                {/* Submit Actions */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            backgroundColor: 'transparent',
                                            color: '#888',
                                            border: '1px solid #222',
                                            borderRadius: '12px',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            flex: 2,
                                            padding: '14px',
                                            backgroundColor: '#f0b90b',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: '900',
                                            fontSize: '14px',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {submitting ? (
                                            <><Loader2 size={16} className="animate-spin" /> Saving</>
                                        ) : (
                                            <><Save size={16} /> Save Exchanger</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ y: 60, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 60, opacity: 0, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            bottom: '40px',
                            left: '50%',
                            background: toast.type === 'success'
                                ? 'linear-gradient(135deg, rgba(0, 192, 135, 0.95) 0%, rgba(0, 160, 110, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 77, 79, 0.95) 0%, rgba(230, 50, 50, 0.95) 100%)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(0, 192, 135, 0.2)' : 'rgba(255, 77, 79, 0.2)'}`,
                            color: '#fff',
                            padding: '14px 24px',
                            borderRadius: '30px',
                            fontWeight: '800',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9999,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                        }}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components
const Toggle = ({ active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            width: '48px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: active ? '#00c087' : '#222',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s'
        }}
    >
        <div style={{
            position: 'absolute',
            top: '2px',
            left: active ? '26px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: active ? '#000' : '#888',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }} />
    </div>
);

const labelStyle = {
    fontSize: '10px',
    color: '#444',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const inputWithIconStyle = {
    width: '100%',
    padding: '14px 16px 14px 40px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.25s'
};

export default AdminP2P;
