import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from '../common/Button';

import logo from '../../assets/stayease_logo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="glass sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full group-hover:bg-primary-500/40 transition-colors"></div>
                            <img src={logo} alt="StayEase" className="h-10 relative z-10" />
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-10">
                        <Link to="/" className="text-slate-600 hover:text-primary-600 transition-colors font-semibold relative group">
                            Home
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link to="/features" className="text-slate-600 hover:text-primary-600 transition-colors font-semibold relative group">
                            Features
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link to="/pricing" className="text-slate-600 hover:text-primary-600 transition-colors font-semibold relative group">
                            Pricing
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/login" className="text-slate-600 hover:text-primary-600 font-semibold transition-colors">Login</Link>
                        <Button onClick={() => navigate('/register')} className="shadow-lg hover:shadow-primary-500/40 transform hover:-translate-y-0.5 transition-all">Get Started</Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-slate-100/50">
                            {isOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden glass absolute top-full left-0 right-0 border-t border-white/20 p-6 space-y-5 shadow-2xl animate-fade-in origin-top">
                    <Link to="/" className="block text-slate-700 hover:text-primary-600 font-bold text-lg transition-colors border-b border-slate-100 pb-3" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/features" className="block text-slate-700 hover:text-primary-600 font-bold text-lg transition-colors border-b border-slate-100 pb-3" onClick={() => setIsOpen(false)}>Features</Link>
                    <Link to="/pricing" className="block text-slate-700 hover:text-primary-600 font-bold text-lg transition-colors border-b border-slate-100 pb-3" onClick={() => setIsOpen(false)}>Pricing</Link>
                    <div className="pt-4 flex flex-col space-y-4">
                        <Link to="/login" className="text-center text-slate-700 hover:text-primary-600 font-bold text-lg transition-colors" onClick={() => setIsOpen(false)}>Login</Link>
                        <Button className="w-full text-lg py-3" onClick={() => { setIsOpen(false); navigate('/register'); }}>Get Started</Button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
