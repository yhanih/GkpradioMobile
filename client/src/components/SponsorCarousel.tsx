import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSponsors } from "@/hooks/useSupabase";
import { Skeleton } from "@/components/ui/skeleton";

const SponsorCarousel = () => {
  const [currentSet, setCurrentSet] = useState(0);
  const { data: sponsors, isLoading } = useSponsors();

  // Group sponsors into sets of 5
  const sponsorSets = [];
  if (sponsors && sponsors.length > 0) {
    const activeSponsors = sponsors.filter((s: any) => s.isActive);
    for (let i = 0; i < activeSponsors.length; i += 5) {
      const set = activeSponsors.slice(i, i + 5);
      // Fill with placeholders if less than 5
      while (set.length < 5) {
        set.push({ 
          id: `placeholder-${set.length}`, 
          name: "ADVERTISE HERE", 
          website: "/sponsor/advertise",
          isActive: true,
          displayOrder: 999
        });
      }
      sponsorSets.push(set);
    }
  }
  
  // If no sponsors or less than needed, create placeholder sets
  if (sponsorSets.length === 0) {
    sponsorSets.push(
      Array(5).fill(null).map((_, i) => ({
        id: `placeholder-1-${i}`,
        name: "ADVERTISE HERE",
        website: "/sponsor/advertise",
        isActive: true,
        displayOrder: i
      })),
      Array(5).fill(null).map((_, i) => ({
        id: `placeholder-2-${i}`,
        name: "ADVERTISE HERE",
        website: "/sponsor/advertise",
        isActive: true,
        displayOrder: i
      }))
    );
  } else if (sponsorSets.length === 1) {
    // Duplicate the set if we only have one
    sponsorSets.push([...sponsorSets[0]]);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % sponsorSets.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [sponsorSets.length]);

  if (isLoading) {
    return (
      <div className="bg-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-3 md:py-4">
            <Skeleton className="h-4 w-24 bg-gray-800" />
            <div className="flex gap-4 flex-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-32 bg-gray-800" />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-1.5 w-4 bg-gray-800" />
              <Skeleton className="h-1.5 w-1.5 bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black relative overflow-hidden" data-testid="sponsor-carousel">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-3 md:py-4">
          {/* Sponsored By Label */}
          <div className="flex-shrink-0">
            <span className="text-white font-bold text-xs md:text-sm whitespace-nowrap" data-testid="text-sponsor-label">
              SPONSORED BY
            </span>
          </div>
          
          {/* Sponsor Sets Container with Fade Transition */}
          <div className="relative flex-1 min-w-0">
            {sponsorSets.map((set, setIndex) => (
              <div 
                key={setIndex}
                className={`absolute inset-0 flex items-center justify-start gap-4 md:gap-8 px-4 transition-opacity duration-500 ease-in-out ${
                  setIndex === currentSet ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {set.map((sponsor: any, index: number) => (
                  <Link 
                    key={`${setIndex}-${index}`} 
                    href={sponsor.website || sponsor.url || "/sponsor/advertise"}
                    data-testid={`link-sponsor-${sponsor.id}`}
                  >
                    <div 
                      className="text-gray-500 text-xs md:text-sm font-medium whitespace-nowrap hover:text-gray-300 transition-colors cursor-pointer px-3 py-1.5 rounded hover:bg-gray-800/50 border border-transparent hover:border-gray-700"
                      data-testid={`text-sponsor-name-${sponsor.id}`}
                    >
                      {sponsor.name}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Set Indicator Dots */}
          <div className="flex gap-1.5 items-center flex-shrink-0">
            {sponsorSets.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSet 
                    ? 'bg-faith-gold w-4' 
                    : 'bg-gray-600 w-1.5'
                }`}
                data-testid={`indicator-sponsor-set-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorCarousel;