import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase-setup';
import { doc, onSnapshot } from 'firebase/firestore';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
    const [branding, setBranding] = useState({
        websiteName: 'TradeSet',
        websiteTitle: 'Professional Trading Platform',
        logoUrl: '',
        faviconUrl: '',
        referralCommission: 10
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for branding configuration
        const platformRef = doc(db, 'admin_set', 'platform');
        
        const unsubscribe = onSnapshot(platformRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("FETCHED BRANDING FROM FIRESTORE:", data); // Debug log
                
                const newBranding = {
                    websiteName: data.websiteName || 'TradeSet',
                    websiteTitle: data.websiteTitle || 'Trade Set Platform',
                    logoUrl: data.logoUrl || '',
                    faviconUrl: data.faviconUrl || '',
                    referralCommission: data.referralCommission || 10
                };
                
                setBranding(newBranding);
                
                // Set Website Title
                if (newBranding.websiteTitle) {
                    document.title = newBranding.websiteTitle;
                }
                
                // Set Favicon
                if (newBranding.faviconUrl) {
                    const links = document.querySelectorAll("link[rel*='icon']");
                    if (links.length > 0) {
                        links.forEach(link => {
                            link.href = newBranding.faviconUrl;
                        });
                    } else {
                        const link = document.createElement('link');
                        link.rel = 'icon';
                        link.href = newBranding.faviconUrl;
                        document.head.appendChild(link);
                    }
                }
            } else {
                console.log("NO BRANDING DOC FOUND IN FIRESTORE");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <BrandingContext.Provider value={{ ...branding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => useContext(BrandingContext);
