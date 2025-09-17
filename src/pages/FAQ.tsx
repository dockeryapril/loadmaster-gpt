import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/auth?mode=signup");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-10 px-4 py-6 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LoadMaster</span>
            </div>
          </div>
        </div>
      </header>

      {/* FAQ Content */}
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Intro Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h1>
            <div className="bg-card border border-border rounded-2xl p-8 text-left max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Got questions? We've got answers.
                <br />
                <br />
                LoadMaster GPT was built by truckers, for truckers — so we know the real questions that come up on the road. Whether you're wondering how the app works, why there's a free limit, or if you really need this instead of Excel, this page breaks it all down.
              </p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="what-is-loadmaster" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What is LoadMaster GPT?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  LoadMaster GPT is a mobile-first web app built for expedite and owner-operator truckers. It takes the headache out of calculating rate per mile (RPM), factoring in fuel surcharge (FSC), weight impact, and other deal-breakers — all from a simple screenshot. Instead of juggling mental math, spreadsheets, or paper notes, LoadMaster gives you instant clarity on whether a load is worth it.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-it-works" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  How does it work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-3">
                    <p>1. Snap or upload a screenshot of a load offer.</p>
                    <p>2. OCR (optical character recognition) extracts the details automatically.</p>
                    <p>3. The app calculates RPM (with color-coded thresholds) and highlights weight impact.</p>
                    <p>4. You can edit extracted data if needed.</p>
                    <p>5. Save the load to your history with swipe-to-delete control.</p>
                    <p>6. Use negotiation templates to push back on brokers with confidence.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="free-plan" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What's included in the Free plan?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-2">
                    <p>• 5 scans per month</p>
                    <p>• Core calculator (RPM, FSC, weight impact)</p>
                    <p>• Color-coded RPM thresholds (green/yellow/red)</p>
                    <p>• Load history saved on your device</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pro-plan" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What's included in PRO?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-2">
                    <p><strong>Up to 100 scans per month</strong></p>
                    <p>Everything in Free, plus:</p>
                    <p>• Unlimited access to load storage & editing</p>
                    <p>• Trend tracking and offer history</p>
                    <p>• Negotiation note templates</p>
                    <p>• Priority updates & new feature releases</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="vs-excel" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Why not just use Excel or grade-school math?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-4">
                    <p>That's the #1 question. Here's the reality:</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p><strong>Speed matters.</strong> Brokers don't wait while you fire up Excel, enter miles, adjust for FSC, or hunt down your wear & tear math. LoadMaster does it in seconds — while you're on the phone.</p>
                      </div>
                      
                      <div>
                        <p><strong>Error-proofing.</strong> One missed digit or bad mental math can cost you hundreds on a load. LoadMaster is built to eliminate human error under pressure.</p>
                      </div>
                      
                      <div>
                        <p><strong>Automation.</strong> OCR means you don't even have to type most details — the app pulls them straight from the screenshot.</p>
                      </div>
                      
                      <div>
                        <p><strong>Truck-specific logic.</strong> Unlike Excel, LoadMaster comes preloaded with equipment-specific RPM targets (straight truck, hotshot, cargo van, etc.).</p>
                      </div>
                      
                      <div>
                        <p><strong>Professionalism.</strong> When you push back with numbers backed by LoadMaster, you sound like a seasoned pro — not like someone fumbling with a calculator app.</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                      <p><strong>👉 Bottom line:</strong> You could use Excel. But in real negotiations, speed, clarity, and confidence win — and that's what LoadMaster delivers.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="free-limit" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Why is Free limited to 5 scans per month?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  The free tier is designed to let drivers try LoadMaster without risk. For serious owner-operators who run multiple loads monthly, PRO is the plan that makes sense. Five scans per month = enough to test it, not enough to run your business on.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hit-limit" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What happens when I hit my free upload limit?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-3">
                    <p>You'll see this message:</p>
                    <div className="bg-muted/50 p-3 rounded-lg italic">
                      "You've used your 5 scans for this month. Upgrade to PRO for up to 100 scans per month and full access."
                    </div>
                    <p>You can either wait until next month (scans reset on the 1st) or upgrade to PRO instantly.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="who-for" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Who is this app for?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-2">
                    <p>• Expedite truckers hauling time-sensitive freight</p>
                    <p>• Straight truck, cargo van, and hotshot operators</p>
                    <p>• Small fleet drivers who negotiate their own loads</p>
                    <p>• Anyone tired of wasting time on bad math and worse loads</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trust" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Why should I trust LoadMaster GPT?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Because it's built by truckers, for truckers. This isn't another Silicon Valley app made by people who've never seen a load board. It's tested in the field, against real dispatch splits and real broker negotiations, and refined to work in the real-world pace of expedite freight.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="replace-dispatch" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Will this replace dispatch?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  No — but it makes you harder to play. Brokers and dispatchers rely on drivers being too tired, rushed, or distracted to notice when a load is weak. LoadMaster is your personal load shield: fast, accurate, and always on your side.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pricing" className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  How much does PRO cost?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  <div className="space-y-3">
                    <p>Pricing is simple:</p>
                    <div className="space-y-2">
                      <p><strong>LoadMaster Free:</strong> 5 scans/month</p>
                      <p><strong>LoadMaster PRO:</strong> Up to 100 scans/month + full access for $5/month</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button 
          size="lg" 
          onClick={handleUpgrade}
          className="px-8 py-4 text-lg font-semibold shadow-lg"
        >
          Upgrade to PRO – Unlock 100 Uploads/Week
        </Button>
      </div>

      {/* Bottom spacing to avoid CTA overlap */}
      <div className="h-24"></div>
    </div>
  );
};

export default FAQ;