import React from 'react';
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4 text-white">
                            <Building2 size={32} className="text-primary-400" />
                            <span className="text-2xl font-bold">StayManager</span>
                        </div>
                        <p className="text-slate-400 mb-6">Simplifying hostel and PG management with modern technology.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Product</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Testimonials</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Company</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-primary-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3">
                                <Mail size={18} className="text-primary-400" />
                                <span>support@staymanager.com</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone size={18} className="text-primary-400" />
                                <span>+91 7675857684</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <MapPin size={18} className="text-primary-400" />
                                <span>Hyderabad,Telangana</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center bg-slate-900">
                    <p className="text-slate-500 text-sm">
                        © 2026 <a href="https://staymanager.cloud" className="text-primary-400 hover:text-white transition-colors">staymanager.cloud</a>. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
