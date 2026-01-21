import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import logo from '../../assets/logo.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-top">
                <div className="container footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <img src={logo} alt="GKP Logo" className="footer-logo" />
                        <p className="vision-text">
                            "Where two or three gather in my name, there am I with them." <br />
                            <span className="reference">— Matthew 18:20</span>
                        </p>
                        <p className="brand-description">
                            A faith-centered community where believers worship, learn, and grow together through the power of God's Word.
                        </p>
                        <div className="contact-info">
                            <div className="contact-item">
                                <Mail size={16} />
                                <span>contactus@gkpradio.com</span>
                            </div>
                            <div className="contact-item">
                                <Phone size={16} />
                                <span>+1 (555) 123-PRAY</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">About Us</Link></li>
                            <li><Link to="/podcasts">Podcasts</Link></li>
                            <li><Link to="/community">Community</Link></li>
                            <li><Link to="/videos">Videos</Link></li>
                            <li><Link to="/contact">Connect</Link></li>
                        </ul>
                    </div>

                    {/* Community Links */}
                    <div className="footer-links">
                        <h3>Community</h3>
                        <ul>
                            <li><Link to="/community?tab=prayer">Prayer Requests</Link></li>
                            <li><Link to="/community?tab=testimonies">Testimonies</Link></li>
                            <li><Link to="/community?tab=youth">Youth Voices</Link></li>
                            <li><Link to="/community?tab=faith">Faith Stories</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter / Stay Connected */}
                    <div className="footer-subscribe">
                        <h3>Stay Connected</h3>
                        <p>Get daily devotions and community updates delivered to your inbox.</p>
                        <form className="subscribe-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="input-group">
                                <input type="email" placeholder="Your email for daily encour..." />
                                <button type="submit" className="subscribe-btn">
                                    Subscribe
                                </button>
                            </div>
                        </form>
                        <div className="social-links">
                            <a href="#" className="social-icon"><Facebook size={20} /></a>
                            <a href="#" className="social-icon"><Twitter size={20} /></a>
                            <a href="#" className="social-icon"><Instagram size={20} /></a>
                            <a href="#" className="social-icon"><Youtube size={20} /></a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container bottom-content">
                    <p className="copyright">© 2024 GKP Radio. All rights reserved.</p>
                    <div className="legal-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Use</Link>
                    </div>
                    <p className="made-with">
                        Made with <span className="heart">❤️</span> for the Kingdom
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
