import { useStore } from '../state/store';

const formatDateTime = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

export const HistoryPanel = () => {
  const decisions = useStore((state) => state.decisions);

  if (decisions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow">
      <h3 className="text-base font-semibold text-slate-900">Recent decisions</h3>
      <ul className="mt-3 space-y-3 text-sm text-slate-700">
        {decisions
          .slice()
          .reverse()
          .map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} className="rounded border border-slate-100 p-3">
              <div className="font-medium text-slate-900">
                {entry.load.origin} → {entry.load.destination}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span>{entry.decision}</span>
                <span>•</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <span>Miles: {entry.load.miles}</span>
                <span>Rate: ${entry.load.rateAllIn}</span>
                {entry.load.fuelSurcharge !== undefined && <span>FSC: ${entry.load.fuelSurcharge}</span>}
                {entry.load.accessorials !== undefined && <span>Acc: ${entry.load.accessorials}</span>}
                {entry.targetRate !== undefined && <span>Target: ${entry.targetRate}</span>}
              </div>
              {entry.notes && <p className="mt-2 text-xs italic">📝 {entry.notes}</p>}
            </li>
          ))}
      </ul>
    </div>
  );
};
