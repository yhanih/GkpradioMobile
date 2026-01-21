import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import './SponsorCarousel.css';

interface Sponsor {
    id: string;
    name: string;
    website?: string;
    url?: string;
    isActive: boolean;
}

const SponsorCarousel = () => {
    const [currentSet, setCurrentSet] = useState(0);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .eq('isActive', true)
                .order('name');

            if (error) throw error;
            setSponsors(data || []);
        } catch (err) {
            console.error('Error fetching sponsors:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group sponsors into sets of 5
    const sponsorSets: Sponsor[][] = [];
    const activeSponsors = sponsors.length > 0 ? sponsors : [];

    // Create sets
    if (activeSponsors.length > 0) {
        for (let i = 0; i < activeSponsors.length; i += 5) {
            const set = activeSponsors.slice(i, i + 5);
            // Fill with placeholders if less than 5
            while (set.length < 5) {
                set.push({
                    id: `placeholder-${set.length}`,
                    name: "ADVERTISE HERE",
                    website: "/sponsor/advertise",
                    isActive: true
                });
            }
            sponsorSets.push(set);
        }
    }

    // Fallback if no sponsors
    if (sponsorSets.length === 0) {
        sponsorSets.push(
            Array(5).fill(null).map((_, i) => ({
                id: `placeholder-1-${i}`,
                name: "ADVERTISE HERE",
                website: "/sponsor/advertise",
                isActive: true
            })),
            Array(5).fill(null).map((_, i) => ({
                id: `placeholder-2-${i}`,
                name: "ADVERTISE HERE",
                website: "/sponsor/advertise",
                isActive: true
            }))
        );
    } else if (sponsorSets.length === 1) {
        sponsorSets.push([...sponsorSets[0]]);
    }

    useEffect(() => {
        if (sponsorSets.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSet((prev) => (prev + 1) % sponsorSets.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [sponsorSets.length]);

    return (
        <div className="sponsor-marquee">
            <div className="container">
                <div className="marquee-content">
                    <div className="label-wrap">
                        <span className="marquee-label">SPONSORED BY</span>
                    </div>

                    <div className="sets-container">
                        {sponsorSets.map((set, setIndex) => (
                            <div
                                key={setIndex}
                                className={`sponsor-set ${setIndex === currentSet ? 'active' : ''}`}
                            >
                                {set.map((sponsor, index) => (
                                    <Link
                                        key={`${setIndex}-${index}`}
                                        to={sponsor.website || sponsor.url || "/sponsor/advertise"}
                                        className="sponsor-link"
                                    >
                                        {sponsor.name}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="indicator-dots">
                        {sponsorSets.map((_, index) => (
                            <div
                                key={index}
                                className={`indicator-dot ${index === currentSet ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorCarousel;
