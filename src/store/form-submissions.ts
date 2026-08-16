import { create } from 'zustand';
import { getNames } from 'country-list';
import type { FormSubmission, Country } from '@/types';

const COUNTRIES_URL =
  import.meta.env.VITE_COUNTRIES_URL ??
  'https://restcountries.com/v3.1/all?fields=name';
const BUNDLED_COUNTRIES: Country[] = getNames().map((name) => ({
  name: { common: name, official: name },
}));

interface FormStoreState {
  submissions: FormSubmission[];
  countries: Country[];
  addSubmission: (newSubmission: FormSubmission) => void;
  fetchCountries: () => Promise<void>;
}

export const useFormStore = create<FormStoreState>((set) => ({
  submissions: [],
  countries: [],

  addSubmission: (newSubmission) =>
    set((state) => ({
      submissions: [newSubmission, ...state.submissions],
    })),

  fetchCountries: async () => {
    if (!COUNTRIES_URL) {
      set({ countries: [...BUNDLED_COUNTRIES] });
      return;
    }

    try {
      const response = await fetch(COUNTRIES_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data: Country[] = await response.json();

      const sortedCountries = data.sort((a, b) =>
        a.name.common.localeCompare(b.name.common),
      );

      set({ countries: sortedCountries });
    } catch (error) {
      console.error('Error fetching countries:', error);
      set({ countries: [...BUNDLED_COUNTRIES] });
    }
  },
}));
