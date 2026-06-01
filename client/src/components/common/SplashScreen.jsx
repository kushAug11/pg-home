import React from 'react';
import logo from '../../assets/logo.svg';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-500">
            <div className="flex flex-col items-center animate-pulse">
                <img src={logo} alt="StayManager" className="w-32 h-auto mb-4" />
                <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2 animate-[shimmer_1s_infinite]"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
