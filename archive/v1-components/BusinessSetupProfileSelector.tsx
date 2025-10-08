import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown, Info, Star, TrendingUp, Shield, Briefcase, Crown } from 'lucide-react';
import { 
  BusinessSetupProfile, 
  industryBusinessProfiles, 
  getMostPopularProfiles,
  getProfilesByCategory 
} from '@/types/businessSetupProfiles';

interface BusinessSetupProfileSelectorProps {
  onProfileSelect: (profile: BusinessSetupProfile) => void;
  onCustomSetup: () => void;
  selectedProfileId?: string;
}

const categoryIcons = {
  percentage_lease: TrendingUp,
  lease_purchase: Crown,
  independent_contractor: Briefcase,
  owner_operator: Shield,
} as const;

const popularityLabels = {
  1: 'Most Popular',
  2: 'Very Popular', 
  3: 'Popular',
  4: 'Specialized',
  5: 'Advanced'
} as const;

export function BusinessSetupProfileSelector({ 
  onProfileSelect, 
  onCustomSetup,
  selectedProfileId 
}: BusinessSetupProfileSelectorProps) {
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>(selectedProfileId || '');

  const popularProfiles = getMostPopularProfiles(3);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    const profile = industryBusinessProfiles.find(p => p.id === profileId);
    if (profile) {
      onProfileSelect(profile);
    }
  };

  const ProfileCard = ({ profile }: { profile: BusinessSetupProfile }) => {
    const Icon = categoryIcons[profile.category];
    const isExpanded = expandedProfile === profile.id;
    const isSelected = selectedProfile === profile.id;

    return (
      <Card className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <RadioGroupItem 
                value={profile.id} 
                id={profile.id}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  {profile.popularityRank <= 2 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {popularityLabels[profile.popularityRank as keyof typeof popularityLabels]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
            </div>
          </div>

          {/* Key Highlights */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {profile.setup.revenue_split_percentage}% Split
            </Badge>
            {profile.setup.detention_pay_rate && (
              <Badge variant="outline" className="text-xs">
                ${profile.setup.detention_pay_rate}/hr Detention
              </Badge>
            )}
            {profile.setup.fuel_responsibility === 'carrier_pays' && (
              <Badge variant="outline" className="text-xs text-green-600">
                Fuel Covered
              </Badge>
            )}
            {profile.setup.maintenance_coverage === 'carrier_full' && (
              <Badge variant="outline" className="text-xs text-green-600">
                Full Maintenance
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={(open) => 
          setExpandedProfile(open ? profile.id : null)
        }>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                View Details
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Pros</h4>
                    <ul className="space-y-1">
                      {profile.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2">Considerations</h4>
                    <ul className="space-y-1">
                      {profile.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Info className="h-3 w-3 text-orange-600 mt-1 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Typical Scenarios */}
                <div>
                  <h4 className="font-semibold mb-2">Best For</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.typicalScenarios.map((scenario, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {scenario}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Business Setup</h2>
        <p className="text-muted-foreground">
          Select an industry-standard profile that matches your situation, or create a custom setup
        </p>
      </div>

      <RadioGroup value={selectedProfile} onValueChange={handleProfileSelect}>
        {/* Popular Profiles Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <h3 className="text-lg font-semibold">Most Popular Setups</h3>
          </div>
          
          <div className="grid gap-4">
            {popularProfiles.map((profile) => (
              <Label key={profile.id} htmlFor={profile.id} className="cursor-pointer">
                <ProfileCard profile={profile} />
              </Label>
            ))}
          </div>
        </div>

        {/* All Profiles Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Industry Profiles</h3>
          
          <div className="grid gap-4">
            {industryBusinessProfiles
              .filter(profile => !popularProfiles.some(p => p.id === profile.id))
              .map((profile) => (
                <Label key={profile.id} htmlFor={profile.id} className="cursor-pointer">
                  <ProfileCard profile={profile} />
                </Label>
              ))}
          </div>
        </div>
      </RadioGroup>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={onCustomSetup} 
          variant="outline" 
          className="flex-1"
        >
          Create Custom Setup
        </Button>
        
        <Button 
          onClick={() => {
            if (selectedProfile) {
              const profile = industryBusinessProfiles.find(p => p.id === selectedProfile);
              if (profile) onProfileSelect(profile);
            }
          }}
          disabled={!selectedProfile}
          className="flex-1"
        >
          Continue with Selected Profile
        </Button>
      </div>

      {/* Industry Note */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>
          These profiles are based on 2024 industry research and common carrier arrangements. 
          You can always customize any profile after selection.
        </p>
      </div>
    </div>
  );
}