import { useEffect, useState } from 'react';
import api from '../services/api';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol?: string | null;
}

export const FALLBACK_CURRENCIES: CurrencyOption[] = [
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

interface UseCurrenciesResult {
  currencies: CurrencyOption[];
  loading: boolean;
  error: string | null;
}

export function useCurrencies(): UseCurrenciesResult {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/data/currencies');
        if (cancelled) {
          return;
        }

        const data = Array.isArray(response.data) ? response.data : [];
        const normalized = data.map((item: any) => ({
          code: item.code,
          name: item.name ?? item.code,
          symbol: item.symbol ?? null,
        }));

        setCurrencies(normalized);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error('[useCurrencies] Failed to load currencies', err);
          setError('ไม่สามารถโหลดรายการสกุลเงินได้');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCurrencies();

    return () => {
      cancelled = true;
    };
  }, []);

  return { currencies, loading, error };
}
