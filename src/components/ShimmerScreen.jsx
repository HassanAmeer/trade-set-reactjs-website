import React from 'react';

const ShimmerScreen = () => {
    return (
        <div style={{
            minHeight: '100dvh',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '480px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Header Skeleton */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px'
            }}>
                <div className="shimmer-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                <div className="shimmer-box" style={{ width: '120px', height: '24px', borderRadius: '6px' }}></div>
                <div className="shimmer-box" style={{ width: '36px', height: '36px', borderRadius: '8px' }}></div>
            </div>

            {/* Banner Skeleton */}
            <div className="shimmer-box" style={{
                width: '100%',
                height: '160px',
                borderRadius: '16px'
            }}></div>

            {/* Quick Actions Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div className="shimmer-box" style={{ width: '44px', height: '44px', borderRadius: '12px' }}></div>
                        <div className="shimmer-box" style={{ width: '36px', height: '10px', borderRadius: '4px' }}></div>
                    </div>
                ))}
            </div>

            {/* Tickers Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
            }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="shimmer-box" style={{ height: '70px', borderRadius: '12px' }}></div>
                ))}
            </div>

            {/* Main Content List Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="shimmer-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="shimmer-box" style={{ width: '70px', height: '14px', borderRadius: '4px' }}></div>
                                <div className="shimmer-box" style={{ width: '40px', height: '10px', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                        <div className="shimmer-box" style={{ width: '60px', height: '28px', borderRadius: '6px' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShimmerScreen;
