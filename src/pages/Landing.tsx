import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Truck, Calculator, Camera, MessageSquare, LayoutDashboard } from "lucide-react";
import cargoVan from "@/assets/cargo-van.jpg";
import flatbedTruck from "@/assets/flatbed-truck.jpg";
import straightTruck from "@/assets/straight-truck.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth?mode=signup");
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
              Sign Up
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
                Smart Load
                <br />
                <span className="text-primary">Analysis</span>
                <br />
                Made Simple
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                One plan. All features. Built for serious owner-operators.
                <br />
                Upload screenshots, get instant RPM calculations, and maximize your profits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
                  Start with LoadMaster Free
                </Button>
                {/*
                <Button size="lg" variant="outline" onClick={handleLogin} className="text-lg px-8 py-6">
                  Watch Demo
                </Button> */}
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
              Everything You Need to Maximize Your Profits
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with LoadMaster Free (4 uploads per week) or upgrade to PRO for unlimited access and advanced features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Image Upload</h3>
              <p className="text-muted-foreground">
                Upload screenshots or photos of load offers and instantly extract key details. 
                Free: 4 uploads per week. PRO: Up to 100 per week.
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Negotiation Tools</h3>
              <p className="text-muted-foreground">
                Get intelligent rate analysis and negotiation insights to secure better deals and maximize your revenue.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Equipment Profiles</h3>
              <p className="text-muted-foreground">
                Customized calculations SPECIFICALLY for cargo vans, hotshots, and straight trucks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready for more power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">LoadMaster Free</h3>
              <div className="text-4xl font-bold text-foreground mb-4">$0</div>
              <p className="text-muted-foreground mb-6">Perfect for getting started</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">4 uploads per week</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">Core calculator + insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">Unlimited manual entry</span>
                </div>
              </div>
              
              <Button onClick={handleGetStarted} variant="outline" className="w-full">
                Start Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2">LoadMaster PRO</h3>
              <div className="text-4xl font-bold text-foreground mb-1">$10</div>
              <div className="text-muted-foreground mb-4">per month</div>
              <p className="text-muted-foreground mb-6">Built for serious owner-operators</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Up to 100 uploads per week</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Full feature access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Priority updates + support</span>
                </div>
              </div>
              
              <Button onClick={handleGetStarted} className="w-full">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Maximize Your Profits?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join owner-operators using LoadMaster to make smarter decisions and increase their margins.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-12 py-6">
            Start with LoadMaster for Free
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