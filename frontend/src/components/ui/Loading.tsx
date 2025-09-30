export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 gradient-mesh-luxury"></div>

      {/* Loading Content */}
      <div className="text-center relative z-10 animate-luxury-fade">
        {/* Premium Spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto">
            <div className="spinner-luxury"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-gold-400 rounded-full animate-float"></div>
          <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-rose-400 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 -left-4 w-2 h-2 bg-purple-400 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gradient-luxury">Fashion Agent</h2>
          <p className="text-luxury-600 font-medium">Preparing your premium experience...</p>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
