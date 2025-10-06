import type { ChangeEvent } from 'react';
import { parseRateCon } from '../ocr/parseRateCon';
import { useStore } from '../state/store';

export const OCRDropzone = () => {
  const { setCurrentLoad } = useStore();

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = await parseRateCon(file);
    setCurrentLoad(parsed);
  };

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm shadow">
      <label className="font-semibold text-slate-700">📄 Drop rate con (optional):</label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFile}
        className="mt-2 w-full text-sm"
      />
      <p className="mt-2 text-xs text-slate-500">We will pre-fill the form so you can tweak values before logging.</p>
    </div>
  );
};
