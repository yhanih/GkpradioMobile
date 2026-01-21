import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import './ProgramsSection.css';

const programs = [
  {
    id: 1,
    title: "Morning Devotion",
    time: "6:00 AM - 7:00 AM",
    host: "Pastor David",
    description:
      "Start your day with powerful prayers, scripture readings, and inspirational messages to set a godly tone for the day ahead.",
    category: "Devotional",
  },
  {
    id: 2,
    title: "Kingdom Principles",
    time: "9:00 AM - 10:00 AM",
    host: "Rev. Sarah Johnson",
    description:
      "In-depth Bible teaching exploring the foundational principles of God's Kingdom and how to apply them in daily life.",
    category: "Teaching",
  },
  {
    id: 3,
    title: "Worship Hour",
    time: "12:00 PM - 1:00 PM",
    host: "Ministry Team",
    description:
      "A powerful hour of contemporary and traditional worship music to lift your spirit and draw you closer to God's presence.",
    category: "Worship",
  },
  {
    id: 4,
    title: "Family Matters",
    time: "3:00 PM - 4:00 PM",
    host: "The Wilsons",
    description:
      "Practical biblical guidance for building strong Christian families, addressing parenting, marriage, and relationships.",
    category: "Family",
  },
  {
    id: 5,
    title: "Youth On Fire",
    time: "5:00 PM - 6:00 PM",
    host: "Pastor Mike",
    description:
      "Dynamic programming for young believers featuring relevant discussions, music, and testimonies from youth around the world.",
    category: "Youth",
  },
  {
    id: 6,
    title: "Evening Praise",
    time: "8:00 PM - 10:00 PM",
    host: "Various Artists",
    description:
      "End your day in worship with two hours of uplifting praise music and peaceful hymns for reflection and rest.",
    category: "Worship",
  },
];

const categories = [
  "All",
  "Devotional",
  "Teaching",
  "Worship",
  "Family",
  "Youth",
];

export function ProgramsSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPrograms =
    activeCategory === "All"
      ? programs
      : programs.filter((p) => p.category === activeCategory);

  return (
    <section id="programs" className="programs-section">
      <div className="container">
        {/* Section Header */}
        <div className="programs-header">
          <div>
            <span className="section-badge">Our Programs</span>
            <h2 className="section-title">Daily Programming Schedule</h2>
          </div>

          {/* Category Filter */}
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="programs-grid">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="program-card">
              {/* Time Header */}
              <div className="program-header">
                <div className="program-time">
                  <Clock className="w-4 h-4" />
                  <span>{program.time}</span>
                </div>
                <span className="program-category">{program.category}</span>
              </div>

              {/* Content */}
              <div className="program-content">
                <h3 className="program-title">{program.title}</h3>
                <p className="program-host">Hosted by {program.host}</p>
                <p className="program-description">{program.description}</p>
                <button type="button" className="program-link">
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="programs-cta">
          <button className="cta-button">View Full Schedule</button>
        </div>
      </div>
    </section>
  );
}
