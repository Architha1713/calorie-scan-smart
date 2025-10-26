import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, TrendingUp, Droplets, Shield } from "lucide-react";
import nutrilensLogo from "@/assets/nutrilens-logo.png";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroBackground})` }}
      >
        <div className="container mx-auto px-6 text-center text-white">
          <img src={nutrilensLogo} alt="NutriLens" className="w-24 h-24 mx-auto mb-6 drop-shadow-2xl" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            NutriLens
          </h1>
          <p className="text-2xl md:text-3xl mb-4 font-medium">
            Smart AI that detects food calories and helps you stay fit every day
          </p>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-3xl mx-auto">
            Upload a photo or type your meal — our AI instantly detects calories, nutrients, and provides personalized diet insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="hero"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-background via-secondary to-muted">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose NutriLens?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Food Detection</h3>
              <p className="text-muted-foreground">
                Simply snap a photo and let our AI identify your food and calculate nutrition instantly
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Your Goals</h3>
              <p className="text-muted-foreground">
                Set weight goals and monitor your progress with detailed nutrition reports
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Stay Hydrated</h3>
              <p className="text-muted-foreground">
                Track your daily water intake and receive reminders to stay properly hydrated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Start Your Health Journey Today</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust NutriLens for smarter nutrition tracking
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
