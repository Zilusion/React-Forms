import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFormStore } from '@/store/form-submissions';
import type { FormSubmission, Country } from '@/types';

function makeSubmission(id: string): FormSubmission {
  return {
    id,
    name: 'John',
    age: 25,
    email: `john${id}@example.com`,
    password: 'Aa1!aaaa',
    confirmPassword: 'Aa1!aaaa',
    gender: 'male',
    acceptTerms: true,
    country: 'Netherlands',
    picture: 'data:image/png;base64,AAA',
  };
}

beforeEach(() => {
  useFormStore.setState({ submissions: [], countries: [] });
  vi.restoreAllMocks();
});

describe('Form-submissions store', () => {
  it('initial state is empty', () => {
    const { submissions, countries } = useFormStore.getState();
    expect(submissions).toHaveLength(0);
    expect(countries).toHaveLength(0);
  });

  it('addSubmission prepends new item', () => {
    const { addSubmission } = useFormStore.getState();
    addSubmission(makeSubmission('1'));
    addSubmission(makeSubmission('2'));

    const { submissions } = useFormStore.getState();
    expect(submissions).toHaveLength(2);
    expect(submissions[0].id).toBe('2');
    expect(submissions[1].id).toBe('1');
  });

  it('fetchCountries saves sorted countries by common name', async () => {
    const payload: Country[] = [
      { name: { common: 'Brazil', official: 'Federative Republic of Brazil' } },
      { name: { common: 'Argentina', official: 'Argentine Republic' } },
    ];

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as unknown as Response);

    await useFormStore.getState().fetchCountries();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const { countries } = useFormStore.getState();
    expect(countries.map((c) => c.name.common)).toEqual([
      'Argentina',
      'Brazil',
    ]);
  });

  it('fetchCountries uses bundled countries on a non-ok response', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => null);
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as unknown as Response);

    useFormStore.setState({
      countries: [{ name: { common: 'Zed', official: 'Zed' } }],
    });

    await useFormStore.getState().fetchCountries();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalled();
    expect(useFormStore.getState().countries.length).toBeGreaterThan(200);
    expect(
      useFormStore.getState().countries.some((country) =>
        country.name.common.includes('Netherlands'),
      ),
    ).toBe(true);
  });

  it('fetchCountries uses bundled countries when fetch throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => null);
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network'));

    await useFormStore.getState().fetchCountries();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalled();
    expect(useFormStore.getState().countries.length).toBeGreaterThan(200);
  });
});
