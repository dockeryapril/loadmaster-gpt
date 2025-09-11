import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Calculator, Camera, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MVPLanding = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('email_signups')
        .insert([
          {
            email: email.toLowerCase().trim(),
            source: 'mvp_landing',
            metadata: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              referrer: document.referrer || 'direct'
            }
          }
        ]);

      if (error) {
        // Handle duplicate email gracefully
        if (error.code === '23505') {
          toast({
            title: "Already signed up!",
            description: "You're already on our waitlist. We'll keep you updated!",
          });
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Thanks for your interest!",
          description: "We'll keep you updated on LoadMaster's progress.",
        });
      }
    } catch (error) {
      console.error('Email signup error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LoadMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/product")}>
              Learn More
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Try Beta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Now in Private Beta
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Stop Losing Money on
              <br />
              <span className="text-primary">Bad Loads</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              LoadMaster instantly calculates your true profit per mile from any load screenshot. 
              Built by truckers, for truckers who want to maximize their earnings.
            </p>
          </div>

          {/* Email Signup Card */}
          <Card className="max-w-md mx-auto mb-12 border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {isSubmitted ? "You're on the list!" : "Get Early Access"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    We'll notify you when LoadMaster is ready for more users.
                  </p>
                  <Button 
                    onClick={() => navigate("/auth")} 
                    className="w-full"
                  >
                    Try Beta Version
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Joining..." : "Join Waitlist"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    No spam. Just updates on LoadMaster's progress.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mb-8">
            Ready to test LoadMaster now?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
              Try the beta version
            </Button>
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-16 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Problem Every Trucker Knows
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              You're on the phone with a broker, load details flying by, and you need to decide: 
              Is this load worth it? Mental math fails when money's on the line.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Excel is Too Slow</h3>
                  <p className="text-muted-foreground text-sm">
                    By the time you fire up Excel and enter all the data, the broker has moved on to the next driver.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Mental Math Fails Under Pressure</h3>
                  <p className="text-muted-foreground text-sm">
                    One missed calculation can cost you hundreds. When you're tired or rushed, mistakes happen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Bad Loads Add Up</h3>
                  <p className="text-muted-foreground text-sm">
                    Accept even one unprofitable load per week, and you've lost thousands by year-end.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Instant Analysis</h3>
                  <p className="text-muted-foreground text-sm">
                    Take a screenshot of any load offer. Get instant profit analysis in under 5 seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Equipment-Specific Calculations</h3>
                  <p className="text-muted-foreground text-sm">
                    Knows the difference between cargo van, hotshot, and straight truck economics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Negotiate With Confidence</h3>
                  <p className="text-muted-foreground text-sm">
                    Know exactly what a load should pay based on current market rates and your costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How LoadMaster Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to smarter load decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Screenshot</h3>
              <p className="text-muted-foreground text-sm">
                Take a photo of any load offer from your load board or broker message
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Instant Analysis</h3>
              <p className="text-muted-foreground text-sm">
                AI extracts details and calculates true profit per mile in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Smart Decision</h3>
              <p className="text-muted-foreground text-sm">
                Get color-coded recommendations and negotiation insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Stop Losing Money?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the truckers who are already using LoadMaster to make smarter load decisions.
          </p>
          
          {!isSubmitted && (
            <Card className="max-w-sm mx-auto border-primary/20">
              <CardContent className="pt-6">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Joining..." : "Get Early Access"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-6">
            <Button variant="link" onClick={() => navigate("/auth")}>
              Or try the beta version now →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">LoadMaster</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by truckers, for truckers. © 2025 LoadMaster. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MVPLanding;