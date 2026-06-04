import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { doc, onSnapshot } from 'firebase/firestore';

const FloatingChatButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const sessionRef = doc(db, 'chat_sessions', user.id);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists()) {
                setUnreadCount(docSnap.data().unreadUser || 0);
            } else {
                setUnreadCount(0);
            }
        }, (error) => {
            console.error("Error listening to chat session:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const path = location.pathname;

    // Hide chat button on login, signup, chat page itself, and admin routes
    if (
        path === '/login' ||
        path === '/signup' ||
        path === '/forgot-password' ||
        path === '/chat' ||
        path.startsWith('/set') ||
        path.startsWith('/admin')
    ) {
        return null;
    }

    const handleClick = () => {
        if (!user) {
            navigate('/login');
        } else {
            navigate('/chat');
        }
    };

    return (
        <button
            onClick={handleClick}
            className="floating-chat-btn"
        >
            <MessageCircle size={26} fill="transparent" strokeWidth={2.5} />
            {unreadCount > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#ff4d4f',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '900',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #000',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    }}
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}
        </button>
    );
};

export default FloatingChatButton;
