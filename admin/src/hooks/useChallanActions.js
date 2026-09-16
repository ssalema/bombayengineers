import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { challanApi } from '../api/services';
import { queryKeys } from '../api/queryKeys';
import { useSiteSettings } from './useSiteSettings';
import { getErrorMessage } from '../utils/errors';

/** Invalidates all challan-derived queries (lists, client stats, dashboard). */
export function invalidateChallanData(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.challans.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
  ]);
}

/** Shared PDF / Print / Delete actions. Accepts a full challan or a list row (details fetched on demand). */
export function useChallanActions() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { siteName, faviconUrl } = useSiteSettings();
  const [busy, setBusy] = useState(null); // `${id}:pdf` | `${id}:print`

  const resolveChallan = useCallback(
    async (challan) => {
      if (Array.isArray(challan.items)) return challan;
      return queryClient.fetchQuery({
        queryKey: queryKeys.challans.detail(challan._id),
        queryFn: () => challanApi.get(challan._id).then((r) => r.data),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  const run = useCallback(
    async (challan, kind) => {
      const key = `${challan._id ?? challan.challanNo}:${kind}`;
      setBusy(key);
      try {
        const full = await resolveChallan(challan);
        const doc = await import('../components/challan/challanDocument');
        if (kind === 'pdf') {
          await doc.downloadChallanPdf({ challan: full, siteName, watermarkUrl: faviconUrl });
          enqueueSnackbar(`Downloaded ${doc.challanFileBase(full)}.pdf`, { variant: 'success' });
        } else {
          await doc.printChallan({ challan: full, watermarkUrl: faviconUrl });
        }
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error, kind === 'pdf' ? 'Could not generate PDF' : 'Could not print challan'), {
          variant: 'error',
        });
      } finally {
        setBusy(null);
      }
    },
    [resolveChallan, siteName, faviconUrl, enqueueSnackbar],
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => challanApi.remove(id),
    onSuccess: async (res, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.challans.detail(id) });
      await invalidateChallanData(queryClient);
      enqueueSnackbar(res.message || 'Challan deleted', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return {
    downloadPdf: (challan) => run(challan, 'pdf'),
    print: (challan) => run(challan, 'print'),
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isBusy: (challan, kind) => busy === `${challan._id ?? challan.challanNo}:${kind}`,
  };
}
