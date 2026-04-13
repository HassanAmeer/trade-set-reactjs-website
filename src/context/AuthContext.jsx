import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase-setup';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { sendEmail } from '../services/emailService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            startListener(storedUserId);
        } else {
            setLoading(false);
        }
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

    const startListener = (userId) => {
        if (unsubscribeRef.current) unsubscribeRef.current();
        setLoading(true);
        const userRef = doc(db, 'users', userId);
        unsubscribeRef.current = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser({ id: docSnap.id, ...docSnap.data() });
            } else {
                setUser(null);
                localStorage.removeItem('userId');
            }
            setLoading(false);
        }, (error) => {
            console.error("Auth listener error:", error);
            setLoading(false);
        });
    };

    const login = async (email, password) => {
        const q = query(collection(db, 'users'), where('email', '==', email), where('password', '==', password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0];
            localStorage.setItem('userId', userData.id);
            startListener(userData.id);

            // Send Login Alert Email
            const userObj = userData.data();
            sendEmail('multi', {
                to_email: userObj.email,
                headline: 'New Login Alert 🔔',
                user_name: userObj.name || 'Trader',
                description: `Your account was just logged in. If this wasn't you, please reset your password immediately for security.`,
                data_title: 'Login Time',
                data_value: new Date().toLocaleString(),
                button_text: 'Secure Account',
                button_url: window.location.origin + '/profile'
            });

            return { success: true };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
    };

    const signup = async (email, phone, password, referralCode = null) => {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }

        const newUserContent = {
            name: email.split('@')[0],
            email,
            phone,
            password,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            cnicFront: "",
            cnicBack: "",
            profile: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            refUsers: [],
            balance: 0,
            referralEarnings: 0,
            tradeEarnings: 0,
            totalReferrals: 0,
            isActive: true,
            isVerified: false,
            referredBy: referralCode // Store who referred this user
        };

        const docRef = await addDoc(collection(db, 'users'), newUserContent);

        // If referred by someone, increment their totalReferrals count
        localStorage.setItem('userId', docRef.id);
        startListener(docRef.id);

        // 1. Send Welcome Email
        sendEmail('multi', {
            to_email: email,
            headline: 'Welcome to TRADE-SET 🚀',
            user_name: newUserContent.name,
            description: 'We are excited to have you on board! Your account is now active. Explore our premium trading tools and start your journey today.',
            data_title: 'Account Status',
            data_value: 'Active (Verified)',
            button_text: 'Dashboard',
            button_url: window.location.origin + '/profile'
        });

        // 2. If referred, notify the referrer
        if (referralCode) {
            try {
                const referrerRef = doc(db, 'users', referralCode);
                const referrerSnap = await getDoc(referrerRef);
                if (referrerSnap.exists()) {
                    const rData = referrerSnap.data();
                    sendEmail('multi', {
                        to_email: rData.email,
                        headline: 'New Referral! 👥',
                        user_name: rData.name || 'Trader',
                        description: `Congratulations! A new user just joined under your link. Your total referrals have increased.`,
                        data_title: 'New Member',
                        data_value: email,
                        button_text: 'Referral Center',
                        button_url: window.location.origin + '/profile'
                    });
                }

                // const { arrayUnion, increment } = await import('firebase/firestore'); // Already imported at top now
                await updateDoc(referrerRef, {
                    totalReferrals: increment(1),
                    refUsers: arrayUnion(docRef.id)
                });
            } catch (e) {
                console.error("Referrer process failed:", e);
            }
        }

        return { success: true };
    };

    const logout = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        setUser(null);
        localStorage.removeItem('userId');
    };

    const updateUser = async (data) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.id), data);
            return { success: true };
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
