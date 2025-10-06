import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useStore } from '../state/store';
import type { LoadOpportunity } from '../types';

type FormState = {
  origin: string;
  destination: string;
  miles: string;
  rateAllIn: string;
  fuelSurcharge: string;
  accessorials: string;
};

const defaultForm: FormState = {
  origin: '',
  destination: '',
  miles: '0',
  rateAllIn: '0',
  fuelSurcharge: '0',
  accessorials: '0',
};

const toLoadOpportunity = (form: FormState): LoadOpportunity => ({
  origin: form.origin,
  destination: form.destination,
  miles: parseFloat(form.miles) || 0,
  rateAllIn: parseFloat(form.rateAllIn) || 0,
  fuelSurcharge: form.fuelSurcharge ? parseFloat(form.fuelSurcharge) || 0 : undefined,
  accessorials: form.accessorials ? parseFloat(form.accessorials) || 0 : undefined,
});

const formatNumberInput = (value: string) => value.replace(/[^\d.\-]/g, '');

export const LoadInputForm = () => {
  const { currentLoad, setCurrentLoad } = useStore();
  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    if (currentLoad) {
      setForm({
        origin: currentLoad.origin,
        destination: currentLoad.destination,
        miles: currentLoad.miles ? String(currentLoad.miles) : '0',
        rateAllIn: currentLoad.rateAllIn ? String(currentLoad.rateAllIn) : '0',
        fuelSurcharge:
          currentLoad.fuelSurcharge !== undefined ? String(currentLoad.fuelSurcharge) : '0',
        accessorials:
          currentLoad.accessorials !== undefined ? String(currentLoad.accessorials) : '0',
      });
    } else {
      setForm(defaultForm);
    }
  }, [currentLoad]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'origin' || name === 'destination' ? value : formatNumberInput(value),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentLoad(toLoadOpportunity(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="origin"
          type="text"
          value={form.origin}
          onChange={handleChange}
          placeholder="Origin"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        />
        <input
          name="destination"
          type="text"
          value={form.destination}
          onChange={handleChange}
          placeholder="Destination"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          name="miles"
          type="number"
          value={form.miles}
          onChange={handleChange}
          placeholder="Miles"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          min={0}
        />
        <input
          name="rateAllIn"
          type="number"
          value={form.rateAllIn}
          onChange={handleChange}
          placeholder="Rate all-in"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          min={0}
        />
        <input
          name="fuelSurcharge"
          type="number"
          value={form.fuelSurcharge}
          onChange={handleChange}
          placeholder="Fuel surcharge"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          min={0}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          name="accessorials"
          type="number"
          value={form.accessorials}
          onChange={handleChange}
          placeholder="Accessorials"
          className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
          min={0}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 p-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Calculate
      </button>
    </form>
  );
};
