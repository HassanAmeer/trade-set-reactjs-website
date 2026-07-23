import React from 'react';

const NotFound = () => {
    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#222222',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '72px',
                fontWeight: '700',
                margin: '0 0 10px 0',
                color: '#1a1a1a',
                lineHeight: 1
            }}>404</h1>
            <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 15px 0',
                color: '#444444'
            }}>Page Not Found</h2>
            <p style={{
                fontSize: '14px',
                color: '#666666',
                maxWidth: '400px',
                lineHeight: '1.6',
                margin: 0
            }}>
                The requested URL was not found on this server. That’s all we know.
            </p>
        </div>
    );
};

export default NotFound;
