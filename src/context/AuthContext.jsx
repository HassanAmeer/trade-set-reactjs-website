import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase-setup';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            fetchUserData(storedUserId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setUser({ id: userDoc.id, ...userDoc.data() });
            } else {
                localStorage.removeItem('userId');
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const q = query(collection(db, 'users'), where('email', '==', email), where('password', '==', password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0];
            const userObj = { id: userData.id, ...userData.data() };
            setUser(userObj);
            localStorage.setItem('userId', userData.id);
            return { success: true };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
    };

    const signup = async (email, phone, password) => {
        // Check if user already exists
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }

        const docRef = await addDoc(collection(db, 'users'), {
            name: email.split('@')[0],
            email,
            phone,
            password, // In a real app, never store passwords in plain text!
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            cnicFront: "",
            cnicBack: "",
            profile: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            refUsers: [], //refferal users
            balance: 0,
            isActive: true,
            isVerified: false
        });

        const userObj = { id: docRef.id, email, phone, balance: 0 };
        setUser(userObj);
        localStorage.setItem('userId', docRef.id);
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userId');
    };

    const updateUser = async (data) => {
        if (!user) return;
        try {
            const { updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'users', user.id), data);
            setUser(prev => ({ ...prev, ...data }));
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
