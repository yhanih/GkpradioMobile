import { useState, FormEvent } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import './ContactSection.css';

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-grid">
          {/* Left - Contact Info */}
          <div className="contact-info">
            <span className="section-badge">Get In Touch</span>
            <h2 className="section-title">
              We'd Love to Hear From You
            </h2>
            <p className="section-description">
              Whether you have a prayer request, testimony to share, or just
              want to connect with our ministry team, we're here for you.
            </p>

            {/* Contact Details */}
            <div className="contact-details">
              {[
                {
                  icon: Mail,
                  label: "Email Us",
                  value: "contact@gkpradio.com",
                  href: "mailto:contact@gkpradio.com",
                },
                {
                  icon: Phone,
                  label: "Call Us",
                  value: "+1 (555) 123-4567",
                  href: "tel:+15551234567",
                },
                {
                  icon: MapPin,
                  label: "Visit Us",
                  value: "123 Faith Street, Grace City, GC 12345",
                  href: "#",
                },
              ].map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="contact-item"
                >
                  <div className="contact-icon">
                    <contact.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="contact-label">{contact.label}</p>
                    <p className="contact-value">{contact.value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="newsletter-box">
              <h3 className="newsletter-title">
                Subscribe to Our Newsletter
              </h3>
              <p className="newsletter-description">
                Stay updated with program schedules, events, and inspiring
                content.
              </p>
              <form className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="contact-form-card">
            <h3 className="form-title">Send Us a Message</h3>

            {submitted ? (
              <div className="form-success">
                <div className="success-icon">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="success-title">Message Sent!</h4>
                <p className="success-description">
                  Thank you for reaching out. We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="How can we help?"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Your message..."
                    rows={5}
                    className="form-textarea"
                    required
                  />
                </div>
                <button type="submit" className="form-submit">
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
