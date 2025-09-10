import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Mail, Calendar, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailSignup {
  id: string;
  email: string;
  source: string;
  created_at: string;
  metadata: {
    timestamp?: string;
    userAgent?: string;
    referrer?: string;
  };
}

const EmailAdmin = () => {
  const [emails, setEmails] = useState<EmailSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchEmails();
  }, [user, navigate]);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error loading emails",
        description: "Could not load email signups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (emails.length === 0) return;

    const headers = ['Email', 'Source', 'Signup Date', 'Referrer'];
    const csvData = emails.map(signup => [
      signup.email,
      signup.source,
      new Date(signup.created_at).toLocaleDateString(),
      signup.metadata.referrer || 'direct'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loadmaster-emails-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading email signups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Admin</h1>
              <p className="text-sm text-muted-foreground">
                Manage your email signups and waitlist
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} disabled={emails.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Signups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emails.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emails.filter(email => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(email.created_at) > weekAgo;
                  }).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emails.filter(email => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(email.created_at) >= today;
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Signups ({emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No email signups yet</h3>
                  <p className="text-muted-foreground">
                    Email signups from your landing page will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((signup) => (
                    <div
                      key={signup.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {signup.email}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(signup.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {signup.metadata.referrer || 'Direct'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {signup.source.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmailAdmin;