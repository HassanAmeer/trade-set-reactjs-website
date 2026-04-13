import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase-setup';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

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
            return { success: true };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
    };

    const signup = async (email, phone, password) => {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }

        const docRef = await addDoc(collection(db, 'users'), {
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
            isActive: true,
            isVerified: false
        });

        localStorage.setItem('userId', docRef.id);
        startListener(docRef.id);
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
