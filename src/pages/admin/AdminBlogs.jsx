import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { uploadFileChunks } from '../../services/dbs';
import { Plus, Trash2, Loader2, FileText, Image as ImageIcon, Edit, XCircle } from 'lucide-react';

const AdminBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'news_blogs'), orderBy('timestamp', 'asc')); // asc so oldest first or keep desc for newest first? Usually desc.
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Manual sort if needed, but Firestore handles it. Let's stick with newest first.
            const sortedList = [...list].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            setBlogs(sortedList);
            resetForm();
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
    };

    const handleEdit = (blog) => {
        setEditingId(blog.id);
        setTitle(blog.title);
        setDescription(blog.description);
        setCategory(blog.category);
        setImagePreview(blog.image);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description) {
            alert('Title and description are required');
            return;
        }

        setIsPosting(true);
        try {
            let imageUrl = imagePreview; 

            if (imageFile) {
                const uploadRes = await uploadFileChunks(imageFile);
                if (uploadRes.success) {
                    imageUrl = uploadRes.url;
                }
            }

            const blogData = {
                title,
                description,
                category: category || 'General',
                image: imageUrl,
                timestamp: new Date().toISOString(),
            };

            if (editingId) {
                await updateDoc(doc(db, 'news_blogs', editingId), blogData);
                alert('Blog updated successfully!');
            } else {
                blogData.views = 0;
                await addDoc(collection(db, 'news_blogs'), blogData);
                alert('Blog posted successfully!');
            }
            
            fetchBlogs();
        } catch (error) {
            alert('Error saving blog: ' + error.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteDoc(doc(db, 'news_blogs', id));
            fetchBlogs();
        } catch (error) {
            alert("Error deleting blog");
        }
    };

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '300px', height: '35px', marginBottom: '30px' }}></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                <div className="skeleton-loader" style={{ flex: '1 1 400px', height: '500px', borderRadius: '16px' }}></div>
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} className="skeleton-loader" style={{ width: '100%', height: '110px', borderRadius: '16px' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>News & Blogs Management</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
                {/* Create/Update Blog Form */}
                <div style={{ flex: '1 1 400px', backgroundColor: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            {editingId ? <Edit size={20} color="#00c087" /> : <Plus size={20} color="#00c087" />}
                            {editingId ? "Update Post" : "Create New Post"}
                        </h3>
                        {editingId && (
                            <button 
                                onClick={resetForm}
                                style={{ background: 'transparent', border: 'none', color: '#ff4d4f', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <XCircle size={14} /> Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#888', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Event Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#888', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Category/Tag</label>
                                <input 
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g. Crypto, Market, Web3"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#888', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Cover Image (Optional)</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{ height: '120px', border: '2px dashed #333', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#1a1a1a' }}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <ImageIcon size={30} color="#666" style={{ marginBottom: '8px' }} />
                                        <span style={{ fontSize: '12px', color: '#888' }}>Click to upload image</span>
                                    </>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ color: '#888', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Blog Content</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', height: '150px', resize: 'vertical' }}
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isPosting}
                            style={{ width: '100%', padding: '14px', backgroundColor: '#00c087', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '15px', cursor: isPosting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {isPosting ? <Loader2 className="animate-spin" /> : (editingId ? 'Update Now' : 'Publish Now')}
                        </button>
                    </form>
                </div>

                {/* List of Published Blogs */}
                <div style={{ flex: '1 1 500px' }}>
                    <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="#888" /> Published Posts ({blogs.length})
                    </h3>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        {blogs.map(blog => (
                            <div key={blog.id} style={{ display: 'flex', gap: '15px', backgroundColor: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222' }}>
                                {blog.image && (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={blog.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '15px' }}>{blog.title}</h4>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleEdit(blog)} style={{ background: 'transparent', border: 'none', color: '#00c087', cursor: 'pointer' }}>
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(blog.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '12px', margin: '0 0 8px 0', maxHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {blog.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#555' }}>
                                        <span>{new Date(blog.timestamp).toLocaleDateString()}</span>
                                        <span style={{ color: '#00c087' }}>{blog.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {blogs.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#666', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                                No blogs posted yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBlogs;
