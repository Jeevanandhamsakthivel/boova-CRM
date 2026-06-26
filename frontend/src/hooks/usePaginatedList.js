import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/errorUtils";

/**
 * Generic hook for paginated, filterable, sortable list endpoints that
 * follow the backend's standard { data, meta } envelope.
 *
 * fetchFn(params) -> axios promise
 */
export function usePaginatedList(fetchFn, initialParams = {}) {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ page: 1, per_page: 20, total_count: 0, total_pages: 0 });
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        fetchFn(params)
            .then((res) => {
                if (!active) return;
                setItems(res.data.data || []);
                setMeta(res.data.meta || { page: 1, per_page: 20, total_count: 0, total_pages: 0 });
            })
            .catch((err) => {
                if (!active) return;
                setError(getErrorMessage(err));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params), reloadKey]);

    function updateParams(patch) {
        setParams((prev) => ({ ...prev, ...patch }));
    }

    function goToPage(page) {
        updateParams({ page });
    }

    return { items, meta, params, setParams: updateParams, goToPage, loading, error, reload };
}