import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, Terminal, Beaker } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
}

interface TestGroup {
  name: string;
  tests: TestResult[];
}

export function QAValidation() {
  const [testResults, setTestResults] = useState<TestGroup[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testSummary, setTestSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
  } | null>(null);

  // Business calculation functions for browser-based testing
  const calculateNetRpm = (grossRpm: number, revenueSplitPercentage: number, weeklyFixedCosts: number, estimatedWeeklyMiles = 2500) => {
    const afterSplitRpm = grossRpm * (revenueSplitPercentage / 100);
    const fixedCostPerMile = weeklyFixedCosts / estimatedWeeklyMiles;
    return afterSplitRpm - fixedCostPerMile;
  };

  const runBrowserTests = () => {
    setIsRunning(true);
    setTestResults([]);
    setTestSummary(null);

    const results: TestGroup[] = [
      {
        name: 'Revenue Split Calculations',
        tests: [
          { name: '75% revenue split correctly', status: 'pending' },
          { name: '85% revenue split correctly', status: 'pending' },
          { name: '95% revenue split correctly', status: 'pending' },
          { name: '100% revenue split (no split)', status: 'pending' },
        ]
      },
      {
        name: 'Weekly Fixed Costs',
        tests: [
          { name: 'Standard mileage calculation', status: 'pending' },
          { name: 'Low mileage calculation', status: 'pending' },
          { name: 'High mileage calculation', status: 'pending' },
        ]
      },
      {
        name: 'Real-World Scenarios',
        tests: [
          { name: 'Lease operator (75% + $400/week)', status: 'pending' },
          { name: 'Independent contractor (95% + $100/week)', status: 'pending' },
          { name: 'Company driver (35% + $0/week)', status: 'pending' },
        ]
      },
      {
        name: 'Edge Cases',
        tests: [
          { name: 'Zero revenue split', status: 'pending' },
          { name: 'Negative weekly costs', status: 'pending' },
          { name: 'Very low mileage', status: 'pending' },
        ]
      }
    ];

    // Simulate test execution with real calculations
    setTimeout(() => {
      try {
        // Test revenue splits
        const test1 = Math.abs(calculateNetRpm(2.50, 75, 0) - 1.875) < 0.001;
        results[0].tests[0].status = test1 ? 'pass' : 'fail';
        
        const test2 = Math.abs(calculateNetRpm(2.00, 85, 0) - 1.700) < 0.001;
        results[0].tests[1].status = test2 ? 'pass' : 'fail';
        
        const test3 = Math.abs(calculateNetRpm(3.00, 95, 0) - 2.850) < 0.001;
        results[0].tests[2].status = test3 ? 'pass' : 'fail';
        
        const test4 = Math.abs(calculateNetRpm(2.25, 100, 0) - 2.25) < 0.001;
        results[0].tests[3].status = test4 ? 'pass' : 'fail';

        // Test fixed costs
        const test5 = Math.abs(calculateNetRpm(2.50, 100, 400, 2500) - 2.34) < 0.001;
        results[1].tests[0].status = test5 ? 'pass' : 'fail';
        
        const test6 = Math.abs(calculateNetRpm(2.00, 100, 300, 1500) - 1.80) < 0.001;
        results[1].tests[1].status = test6 ? 'pass' : 'fail';
        
        const test7 = Math.abs(calculateNetRpm(2.75, 100, 500, 3500) - 2.607) < 0.01;
        results[1].tests[2].status = test7 ? 'pass' : 'fail';

        // Test scenarios
        const test8 = Math.abs(calculateNetRpm(2.50, 75, 400, 2500) - 1.715) < 0.001;
        results[2].tests[0].status = test8 ? 'pass' : 'fail';
        
        const test9 = Math.abs(calculateNetRpm(3.00, 95, 100, 2500) - 2.81) < 0.001;
        results[2].tests[1].status = test9 ? 'pass' : 'fail';
        
        const test10 = Math.abs(calculateNetRpm(2.25, 35, 0) - 0.7875) < 0.001;
        results[2].tests[2].status = test10 ? 'pass' : 'fail';

        // Test edge cases
        results[3].tests[0].status = calculateNetRpm(2.50, 0, 0) === 0 ? 'pass' : 'fail';
        results[3].tests[1].status = Math.abs(calculateNetRpm(2.50, 100, -100) - 2.54) < 0.01 ? 'pass' : 'fail';
        results[3].tests[2].status = Math.abs(calculateNetRpm(2.50, 100, 400, 100) - (-1.50)) < 0.01 ? 'pass' : 'fail';

        setTestResults(results);
        
        // Calculate summary
        const allTests = results.flatMap(group => group.tests);
        const passed = allTests.filter(test => test.status === 'pass').length;
        const failed = allTests.filter(test => test.status === 'fail').length;
        
        setTestSummary({
          total: allTests.length,
          passed,
          failed
        });
        
        setIsRunning(false);
      } catch (error) {
        console.error('Test execution failed:', error);
        setIsRunning(false);
      }
    }, 2000);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail': return <Badge variant="destructive">Fail</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            LoadMaster QA Validation Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing of core business logic and calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runBrowserTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Browser Tests
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <span>For full test suite, run: <code className="bg-muted px-2 py-1 rounded">npm test</code></span>
            </div>
          </div>

          {testSummary && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Test Summary</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✅ {testSummary.passed} Passed</span>
                    <span className="text-red-600">❌ {testSummary.failed} Failed</span>
                    <span className="text-muted-foreground">Total: {testSummary.total}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(testSummary.passed / testSummary.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Success rate: {Math.round((testSummary.passed / testSummary.total) * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {testResults.map((group, groupIndex) => (
        <Card key={groupIndex}>
          <CardHeader>
            <CardTitle className="text-lg">{group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.tests.map((test, testIndex) => (
                <div key={testIndex} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="text-sm">{test.name}</span>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Run full test suite with <code className="bg-muted px-1 rounded">npm test</code></p>
          <p>• Test BusinessSetupWizard component in UI</p>
          <p>• Validate OCR accuracy with sample load board images</p>
          <p>• Check Supabase data persistence</p>
          <p>• Test camera interface and correction flows</p>
        </CardContent>
      </Card>
    </div>
  );
}