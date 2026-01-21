import { Heart, BookOpen, Users, Globe } from "lucide-react";
import './AboutSection.css';

const features = [
  {
    icon: Heart,
    title: "Faith-Centered",
    description:
      "Every broadcast is rooted in biblical principles and designed to strengthen your relationship with God.",
  },
  {
    icon: BookOpen,
    title: "Biblical Teaching",
    description:
      "In-depth studies and expository teachings that help you understand and apply God's Word.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Join a global family of believers united in faith, prayer, and the pursuit of God's kingdom.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Broadcasting to listeners worldwide, bringing the message of hope to every corner of the earth.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-badge">Our Mission</span>
          <h2 className="section-title">
            Spreading the Gospel Through the Airwaves
          </h2>
          <p className="section-description">
            God Kingdom Principles Radio is dedicated to proclaiming the
            transformative message of Jesus Christ to listeners around the
            world. Through powerful teaching, uplifting music, and
            Spirit-filled programming, we aim to equip believers and reach the
            lost.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { value: "24/7", label: "Broadcasting" },
            { value: "150+", label: "Countries Reached" },
            { value: "1M+", label: "Monthly Listeners" },
            { value: "10+", label: "Years of Ministry" },
          ].map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
