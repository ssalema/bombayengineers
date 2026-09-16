import { createElement, useCallback, useState } from 'react';
import { Button } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { challanApi } from '../api/services';
import { queryKeys } from '../api/queryKeys';
import { useSiteSettings } from './useSiteSettings';
import { getErrorMessage } from '../utils/errors';
import { languageName } from '../i18n/languages';

/** Invalidates all challan-derived queries (lists, client stats, dashboard). */
export function invalidateChallanData(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.challans.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
  ]);
}

/**
 * Shared PDF / Print / Delete actions. Accepts a full challan or a list row (details fetched on demand).
 *
 * `print` and `downloadPdf` first ask which language the document should be produced in; render the
 * returned `languagePrompt` with <ChallanLanguageDialog> once per hook instance.
 */
export function useChallanActions() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { siteName, faviconUrl } = useSiteSettings();
  const [busy, setBusy] = useState(null); // `${id}:pdf` | `${id}:print`
  const [prompt, setPrompt] = useState(null); // { challan, kind } while the language dialog is open

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
    async (challan, kind, languages) => {
      const key = `${challan._id ?? challan.challanNo}:${kind}`;
      setBusy(key);
      try {
        const full = await resolveChallan(challan);
        const doc = await import('../components/challan/challanDocument');
        if (kind === 'pdf') {
          // One copy, so only the client language applies.
          await doc.downloadChallanPdf({
            challan: full,
            siteName,
            watermarkUrl: faviconUrl,
            language: languages.client,
          });
          enqueueSnackbar(`Downloaded ${doc.challanFileBase(full)}.pdf in ${languageName(languages.client)}`, {
            variant: 'success',
          });
        } else {
          const openPrint = await doc.printChallan({
            challan: full,
            watermarkUrl: faviconUrl,
            clientLanguage: languages.client,
            officeLanguage: languages.office,
          });
          if (openPrint) {
            // The print file took longer than the browser allows after a tap: ask for one more tap.
            enqueueSnackbar(`${doc.challanFileBase(full)} is ready to print`, {
              variant: 'info',
              autoHideDuration: 20_000,
              action: (snackbarKey) =>
                createElement(
                  Button,
                  {
                    color: 'inherit',
                    size: 'small',
                    onClick: () => {
                      closeSnackbar(snackbarKey);
                      openPrint().catch((error) =>
                        enqueueSnackbar(getErrorMessage(error, 'Could not print challan'), { variant: 'error' }),
                      );
                    },
                  },
                  'Print',
                ),
            });
          }
        }
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error, kind === 'pdf' ? 'Could not generate PDF' : 'Could not print challan'), {
          variant: 'error',
        });
      } finally {
        setBusy(null);
      }
    },
    [resolveChallan, siteName, faviconUrl, enqueueSnackbar, closeSnackbar],
  );

  const closePrompt = useCallback(() => setPrompt(null), []);

  const selectLanguage = useCallback(
    (languages) => {
      const pending = prompt;
      setPrompt(null);
      if (pending) run(pending.challan, pending.kind, languages);
    },
    [prompt, run],
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
    downloadPdf: (challan) => setPrompt({ challan, kind: 'pdf' }),
    print: (challan) => setPrompt({ challan, kind: 'print' }),
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isBusy: (challan, kind) => busy === `${challan._id ?? challan.challanNo}:${kind}`,
    languagePrompt: {
      open: Boolean(prompt),
      kind: prompt?.kind,
      challanNo: prompt?.challan?.challanNo,
      onSelect: selectLanguage,
      onClose: closePrompt,
    },
  };
}
