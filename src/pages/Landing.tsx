import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Truck, Calculator, Camera, MessageSquare, LayoutDashboard } from "lucide-react";
import cargoVan from "@/assets/cargo-van.jpg";
import flatbedTruck from "@/assets/flatbed-truck.jpg";
import straightTruck from "@/assets/straight-truck.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LoadMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogin}>
              Sign In
            </Button>
            <Button onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Truck Images */}
        <div className="relative h-[70vh] flex items-end justify-center">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10"></div>
          
          {/* Trucks Container
          <div className="relative z-0 flex items-end justify-center w-full max-w-6xl mx-auto px-4">
            {/* Cargo Van 
            <div className="flex-1 max-w-sm">
              <img 
                src={cargoVan} 
                alt="Cargo Van"
                className="w-full h-auto object-contain"
              />
            </div>
            
            {/* Flatbed Truck (Hero) 
            <div className="flex-1 max-w-lg -mx-8 z-10">
              <img 
                src={flatbedTruck} 
                alt="Flatbed Truck"
                className="w-full h-auto object-contain scale-110"
              />
            </div>
            
            {/* Straight Truck 
            <div className="flex-1 max-w-sm">
              <img 
                src={straightTruck} 
                alt="Straight Truck"
                className="w-full h-auto object-contain"
              />
            </div>
          </div> */}

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center max-w-4xl mx-auto px-4">
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Smart Freight
                <br />
                <span className="text-primary">Negotiation</span>
                <br />
                Made Simple
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload your load offer — screenshot or manual entry — and let AI do the heavy lifting.
              Get instant rate targets, edit details on the fly, and use proven negotiation scripts
              designed for owner-operators chasing better margins.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" onClick={handleLogin} className="text-lg px-8 py-6">
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Maximize Your Hauls
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop leaving money on the table. Our AI-powered tools help you negotiate better rates and find more profitable loads.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">OCR Load Scanning</h3>
              <p className="text-muted-foreground">
                Snap a photo of any load board offer, text, or email and instantly extract all the key details with the power of AI.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Rate Calculator</h3>
              <p className="text-muted-foreground">
                Get instant RPM calculations with market-based pricing that factors in your equipment and operating costs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Negotiation Coach</h3>
              <p className="text-muted-foreground">
                Get personalized negotiation scripts and strategies to secure better rates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Equipment Profiles</h3>
              <p className="text-muted-foreground">
                Customized calculations for cargo vans, flatbeds, straight trucks, and specialized equipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Negotiate Better Rates?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of owner-operators who've increased their margins with LoadMaster GPT.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-12 py-6">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LoadMaster</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2025 LoadMaster. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;