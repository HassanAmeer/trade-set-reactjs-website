import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Mail, Send, Users, Search, CheckCircle2, Loader2, X, AlertTriangle, Layout, Type, AlignLeft, MousePointer2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

const AdminEmail = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Email Config State
    const [config, setConfig] = useState({
        serviceId: '',
        templateString: '', // Raw comma separated string
        publicKey: ''
    });

    const [availableTemplates, setAvailableTemplates] = useState([]);

    // Form State
    const [selectedTemplate, setSelectedTemplate] = useState(''); 
    const [subject, setSubject] = useState('');
    
    // Universal Template Fields (Raw Payload Mode)
    const [payloadText, setPayloadText] = useState(`headline: Special Promotion
description: We have a new offer for you! Check it out.
data_title: Offer Code
data_value: PROMO2024
button_text: Claim Now
button_url: ${window.location.origin}/trade`);

    const [sending, setSending] = useState(false);
    const [statusData, setStatusData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const platformRef = doc(db, 'admin_set', 'platform');
            const platformSnap = await getDoc(platformRef);
            if (platformSnap.exists()) {
                const data = platformSnap.data();
                setConfig({
                    serviceId: data.emailjsServiceId || '',
                    templateString: data.emailjsTemplates || '',
                    publicKey: data.emailjsPublicKey || ''
                });

                // Parse templates
                const templates = (data.emailjsTemplates || '').split(',').map(id => id.trim()).filter(id => id);
                setAvailableTemplates(templates);
                if (templates.length > 0) {
                    const firstId = templates[0];
                    setSelectedTemplate(firstId);
                }
            }

            const querySnapshot = await getDocs(collection(db, 'users'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(u => u.email);
            setUsers(list);
            setFilteredUsers(list);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-switch variables based on template selection
    useEffect(() => {
        if (!selectedTemplate || availableTemplates.length === 0) return;

        const index = availableTemplates.indexOf(selectedTemplate);
        if (index === 0) {
            // Likely OTP Template
            setPayloadText(`otp_code: 562910\nsubject: Verification Code`);
        } else if (index === 1) {
            // Likely Universal Template
            setPayloadText(`headline: Important Update\ndescription: Hi {{user_name}}, we have an update for your account.\ndata_title: Reference ID\ndata_value: #9924\nbutton_text: View Details\nbutton_url: ${window.location.origin}/profile`);
        } else {
            // Custom Template
            setPayloadText(`variable1: value1\nvariable2: value2`);
        }
    }, [selectedTemplate, availableTemplates]);

    const handleSend = async (e) => {
        e.preventDefault();
        
        const templateId = selectedTemplate;

        if (!config.serviceId || !templateId || !config.publicKey) {
            setStatusData({ type: 'error', msg: 'Email setup is incomplete in Settings!' });
            return;
        }

        if (selectedEmails.length === 0) {
            setStatusData({ type: 'error', msg: 'Select at least one recipient.' });
            return;
        }

        setSending(true);
        setStatusData(null);

        try {
            let successCount = 0;
            
            // Parse payload text into object
            const customParams = {};
            payloadText.split('\n').forEach(line => {
                const [key, ...valParts] = line.split(':');
                if (key && valParts.length > 0) {
                    customParams[key.trim()] = valParts.join(':').trim();
                }
            });

            for (const email of selectedEmails) {
                const user = users.find(u => u.email === email);
                
                // Dynamic replacement of {{variables}}
                const processedParams = {};
                Object.keys(customParams).forEach(key => {
                    let val = customParams[key];
                    if (user) {
                        val = val.replace(/\{\{user_name\}\}/g, user.name || "Member");
                        val = val.replace(/\{\{user_email\}\}/g, user.email);
                    }
                    processedParams[key] = val;
                });

                const templateParams = {
                    to_email: email,
                    user_name: user?.name || "Member",
                    subject: subject || processedParams.headline || processedParams.subject || "Alert",
                    ...processedParams
                };

                await emailjs.send(config.serviceId, templateId, templateParams, config.publicKey);
                successCount++;
            }
            setStatusData({ type: 'success', msg: `Sent to ${successCount} users!` });
            
            // Clear subject
            setSubject('');
            // Add auto-dismiss for status
            setTimeout(() => setStatusData(null), 5000);
        } catch (error) {
            console.error("Send error:", error);
            setStatusData({ type: 'error', msg: 'Failed: ' + (error.text || error.message) });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div style={{ color: '#fff', padding: '40px' }}>Loading settings...</div>;

    const isConfigMissing = !config.serviceId || availableTemplates.length === 0 || !config.publicKey;

    return (
        <div style={{ padding: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Mail size={28} color="var(--accent-gold)" /> Marketing Center
                </h2>
            </div>

            {/* Status Toast */}
            {statusData && (
                <div style={{
                    position: 'fixed',
                    top: '30px',
                    right: '30px',
                    zIndex: 9999,
                    background: statusData.type === 'error' ? '#ff4d4f' : '#00c087',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    minWidth: '300px'
                }}>
                    {statusData.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    {statusData.msg}
                    <X size={18} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setStatusData(null)} />
                </div>
            )}

            {isConfigMissing && (
                <div style={{ backgroundColor: 'rgba(255,77,79,0.1)', border: '1px solid #ff4d4f', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <AlertTriangle color="#ff4d4f" size={24} />
                    <div style={{ color: '#ff4d4f', fontSize: '13px', fontWeight: '700' }}>Setup incomplete. Go to System Settings.</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
                {/* Left: Audience */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '550px' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #222', background: '#0d0d0d', borderRadius: '16px 16px 0 0' }}>
                            <div style={{ position: 'relative', marginBottom: '12px' }}>
                                <Search size={16} color="#444" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" placeholder="Search users..." value={search} onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    setSearch(term);
                                    setFilteredUsers(users.filter(u => u.email.toLowerCase().includes(term) || (u.name && u.name.toLowerCase().includes(term))));
                                }} style={{ width: '100%', padding: '10px 10px 10px 36px', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                                <span onClick={() => setSelectedEmails(filteredUsers.map(u => u.email))} style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: '700' }}>Select All</span>
                                <span>{selectedEmails.length} selected</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {filteredUsers.map(u => (
                                <div key={u.id} onClick={() => setSelectedEmails(prev => prev.includes(u.email) ? prev.filter(e => e !== u.email) : [...prev, u.email])}
                                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #111', background: selectedEmails.includes(u.email) ? 'rgba(0,192,135,0.03)' : 'transparent' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${selectedEmails.includes(u.email) ? '#00c087' : '#333'}`, background: selectedEmails.includes(u.email) ? '#00c087' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedEmails.includes(u.email) && <CheckCircle2 size={12} color="#000" />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                                        <div style={{ fontSize: '10px', color: '#555' }}>{u.name || 'User'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Composer */}
                <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Template Selection */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}><Layout size={12}/> Pick Template ID</label>
                        <select 
                            value={selectedTemplate} 
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            {availableTemplates.map((tid, idx) => (
                                <option key={tid} value={tid}>
                                    {idx === 0 ? `OTP Template (${tid})` : idx === 1 ? `Universal Template (${tid})` : `Custom Template ${idx+1} (${tid})`}
                                </option>
                            ))}
                            {availableTemplates.length === 0 && <option>No Templates Found in Settings</option>}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}><Mail size={12}/> Subject Line</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter email subject..." style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}><Layout size={12}/> Template Variables (Key: Value)</label>
                            <textarea 
                                value={payloadText} 
                                onChange={e => setPayloadText(e.target.value)} 
                                placeholder="headline: My Message
description: My long description..." 
                                style={{ ...inputStyle, height: '280px', resize: 'none', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }} 
                            />
                            <div style={{ marginTop: '10px', fontSize: '10px', color: '#444', lineHeight: '1.4' }}>
                                Tip: Use <b>key: value</b> format. Use <b>{"{{user_name}}"}</b> for dynamic names.
                                <br />For OTP, use <b>otp_code: 123456</b>.
                            </div>
                        </div>
                        
                        <div style={{ flex: 1 }} />
                        
                        <button 
                            onClick={handleSend}
                            disabled={sending || selectedEmails.length === 0 || isConfigMissing}
                            style={{ width: '100%', padding: '16px', background: sending || selectedEmails.length === 0 || isConfigMissing ? '#222' : 'var(--accent-gold)', color: sending || selectedEmails.length === 0 || isConfigMissing ? '#444' : '#000', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>
                            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {isConfigMissing ? 'Settings Missing' : sending ? 'Sending...' : `Send to ${selectedEmails.length} Recipients`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '12px', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', outline: 'none', fontSize: '13px'
};

export default AdminEmail;
