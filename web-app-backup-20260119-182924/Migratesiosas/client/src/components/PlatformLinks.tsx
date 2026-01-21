import { ExternalLink } from "lucide-react";

const PlatformLinks = () => {
  const platforms = [
    {
      name: "Spotify",
      icon: "🎵",
      url: "#",
      color: "hover:text-green-500"
    },
    {
      name: "Apple Podcasts",
      icon: "🎧",
      url: "#",
      color: "hover:text-purple-500"
    },
    {
      name: "SoundCloud",
      icon: "☁️",
      url: "#",
      color: "hover:text-orange-500"
    },
    {
      name: "YouTube",
      icon: "📺",
      url: "#",
      color: "hover:text-red-500"
    }
  ];

  return (
    <section className="py-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="font-serif font-bold text-xl md:text-2xl mb-2">
            Faith on Demand: Listen Everywhere
          </h2>
          <p className="text-muted-foreground text-sm">
            Stream sermons, prayers, and community conversations on any platform
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              className={`group flex items-center space-x-3 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 ${platform.color} card-hover`}
            >
              <span className="text-2xl">{platform.icon}</span>
              <div className="text-left">
                <div className="font-medium text-sm group-hover:text-current transition-colors">
                  {platform.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  Listen now <ExternalLink className="w-3 h-3 ml-1" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformLinks;