import { useQuery } from '@tanstack/react-query'
import { getChartId, getAsc, getPlanets, getRashi, getChalit, type ChartInputs } from './api'

export function useChartId(inp?: ChartInputs) {
  return useQuery({
    queryKey: ['chart_id', inp],
    queryFn: () => {
      if (!inp) throw new Error('no inputs');
      return getChartId(inp);
    },
    enabled: !!inp,
    staleTime: 10 * 60 * 1000,
  });
}

export function useChartSlices(key?: string | null) {
  const enabled = !!key;
  const qAsc = useQuery({ queryKey: ['asc', key], queryFn: () => getAsc({ chart_id: key! }), enabled, staleTime: 5 * 60 * 1000 });
  const qPlanets = useQuery({ queryKey: ['planets', key], queryFn: () => getPlanets({ chart_id: key! }), enabled, staleTime: 5 * 60 * 1000 });
  const qRashi = useQuery({ queryKey: ['rashi', key], queryFn: () => getRashi({ chart_id: key! }), enabled, staleTime: 5 * 60 * 1000 });
  const qChalit = useQuery({ queryKey: ['chalit', key], queryFn: () => getChalit({ chart_id: key! }), enabled, staleTime: 5 * 60 * 1000 });
  return { qAsc, qPlanets, qRashi, qChalit };
}
