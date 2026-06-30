import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/errorUtils";

/**
 * Lazy-loads tab data the first time the tab is activated.
 * Subsequent activations of the same tab reuse already-loaded data
 * unless reload() is called explicitly.
 */
export function useTabLoad(tabKey, activeTab, fetchFn) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const loadedRef = useRef(false);

    const reload = useCallback(() => {
        loadedRef.current = false;
        setReloadKey((k) => k + 1);
    }, []);

    useEffect(() => {
        if (activeTab !== tabKey) return;
        if (loadedRef.current) return;

        let active = true;
        setLoading(true);
        setError(null);

        fetchFn()
            .then((res) => {
                if (!active) return;
                setItems(res.data.data || []);
                loadedRef.current = true;
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
    }, [activeTab, tabKey, reloadKey]);

    return { items, setItems, loading, error, reload };
}
