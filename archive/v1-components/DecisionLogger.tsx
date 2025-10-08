import { useState } from 'react';
import { useStore } from '../state/store';
import type { LoadDecision } from '../types';

export const DecisionLogger = () => {
  const { currentLoad, logDecision } = useStore();
  const [decision, setDecision] = useState<LoadDecision['decision']>('accepted');
  const [targetRate, setTargetRate] = useState('');
  const [notes, setNotes] = useState('');

  if (!currentLoad) {
    return null;
  }

  const handleLogDecision = () => {
    const entry: LoadDecision = {
      load: currentLoad,
      decision,
      targetRate: targetRate ? parseFloat(targetRate) || undefined : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      timestamp: new Date().toISOString(),
    };
    logDecision(entry);
    setDecision('accepted');
    setTargetRate('');
    setNotes('');
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow">
      <h3 className="text-base font-semibold text-slate-900">Log your decision</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {['accepted', 'declined', 'countered'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDecision(option as LoadDecision['decision'])}
            className={`rounded px-3 py-1 text-sm font-medium transition ${
              decision === option
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          value={targetRate}
          onChange={(event) => setTargetRate(event.target.value)}
          placeholder="Counter rate (optional)"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          min={0}
        />
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={handleLogDecision}
        className="mt-4 w-full rounded bg-emerald-600 p-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Save decision
      </button>
    </div>
  );
};
