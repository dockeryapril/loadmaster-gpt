import { DecisionLogger } from './components/DecisionLogger';
import { HistoryPanel } from './components/HistoryPanel';
import { LoadInputForm } from './components/LoadInputForm';
import { OCRDropzone } from './components/OCRDropzone';
import { ProfitabilityCalculator } from './components/ProfitabilityCalculator';

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">🚛 Load Worth Calculator</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter load details or drop a rate confirmation to see instant profitability and log your decision.
          </p>
        </header>
        <OCRDropzone />
        <LoadInputForm />
        <ProfitabilityCalculator />
        <DecisionLogger />
        <HistoryPanel />
      </div>
    </div>
  );
}

export default App;
