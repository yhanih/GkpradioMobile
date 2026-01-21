export const HeroSkeleton = () => {
  return (
    <section className="relative overflow-hidden w-full max-w-full animate-pulse">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"></div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-4 md:py-6 lg:py-8 w-full max-w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-10 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>

            <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start mb-6">
              <div className="h-12 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-12 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Slideshow */}
          <div className="w-full">
            <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};