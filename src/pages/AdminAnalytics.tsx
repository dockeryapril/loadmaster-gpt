import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Activity, MousePointerClick } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyAnalytics {
  date: string;
  unique_sessions: number;
  authenticated_users: number;
  sessions: number;
  calculations: number;
  decisions_logged: number;
  ocr_uploads: number;
  negotiations: number;
  cost_edits: number;
}

interface ConversionFunnel {
  session_date: string;
  total_sessions: number;
  reached_calculation: number;
  reached_decision: number;
  used_ocr: number;
  calculation_rate: number;
  decision_rate: number;
  ocr_usage_rate: number;
}

interface UserActivity {
  user_id: string;
  email: string;
  role: string;
  total_loads: number;
  total_sessions: number;
  first_load_date: string | null;
  last_load_date: string | null;
  first_event_date: string | null;
  last_event_date: string | null;
  avg_rpm: number;
  avg_profit: number;
}

export default function AdminAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    checkAdminAndLoadData();
  }, [user, authLoading, navigate]);

  const checkAdminAndLoadData = async () => {
    try {
      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view analytics",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);

      // Load all analytics data using RPC calls
      const [dailyRes, funnelRes, activityRes] = await Promise.all([
        supabase.rpc('get_daily_analytics'),
        supabase.rpc('get_conversion_funnel'),
        supabase.rpc('get_user_activity'),
      ]);

      if (dailyRes.error) throw dailyRes.error;
      if (funnelRes.error) throw funnelRes.error;
      if (activityRes.error) throw activityRes.error;

      setDailyAnalytics(dailyRes.data || []);
      setConversionFunnel(funnelRes.data || []);
      setUserActivity(activityRes.data || []);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const todayData = dailyAnalytics[0];
  const yesterdayData = dailyAnalytics[1];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Analytics</h1>
              <p className="text-sm text-muted-foreground">LoadMaster usage insights</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Today's Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Today's Activity</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayData?.unique_sessions || 0}</div>
                {yesterdayData && (
                  <p className="text-xs text-muted-foreground">
                    Yesterday: {yesterdayData.unique_sessions}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calculations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayData?.calculations || 0}</div>
                {yesterdayData && (
                  <p className="text-xs text-muted-foreground">
                    Yesterday: {yesterdayData.calculations}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Decisions Logged</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayData?.decisions_logged || 0}</div>
                {yesterdayData && (
                  <p className="text-xs text-muted-foreground">
                    Yesterday: {yesterdayData.decisions_logged}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OCR Uploads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayData?.ocr_uploads || 0}</div>
                {yesterdayData && (
                  <p className="text-xs text-muted-foreground">
                    Yesterday: {yesterdayData.ocr_uploads}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Conversion Funnel */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel (Last 7 Days)</CardTitle>
              <CardDescription>How users progress through the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.slice(0, 7).map((day) => (
                  <div key={day.session_date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{new Date(day.session_date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">{day.total_sessions} sessions</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border bg-muted/50 p-2">
                        <div className="font-medium">{day.calculation_rate}%</div>
                        <div className="text-muted-foreground">Did Calculation</div>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-2">
                        <div className="font-medium">{day.decision_rate}%</div>
                        <div className="text-muted-foreground">Logged Decision</div>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-2">
                        <div className="font-medium">{day.ocr_usage_rate}%</div>
                        <div className="text-muted-foreground">Used OCR</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* User Activity */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>All registered users and their engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userActivity.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.email}</span>
                        {user.role === 'admin' && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>{user.total_loads} loads</span>
                        <span>{user.total_sessions} sessions</span>
                        {user.avg_rpm > 0 && <span>Avg RPM: ${user.avg_rpm.toFixed(2)}</span>}
                      </div>
                    </div>
                    {user.last_load_date && (
                      <div className="text-xs text-muted-foreground">
                        Last active: {new Date(user.last_load_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Daily Breakdown */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Event-by-event analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyAnalytics.slice(0, 14).map((day) => (
                  <div key={day.date} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{day.sessions} sessions</span>
                      <span>{day.calculations} calc</span>
                      <span>{day.decisions_logged} decisions</span>
                      <span>{day.ocr_uploads} OCR</span>
                      <span>{day.negotiations} neg</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
