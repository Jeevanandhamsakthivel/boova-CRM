import { useCallback, useEffect, useState } from "react";
import { workspaceApi } from "../api/workspaceApi";
import { getErrorMessage } from "../utils/errorUtils";

export function useWorkspace(customerId) {
    const [customer, setCustomer] = useState(null);
    const [summary, setSummary] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        if (!customerId) return;
        setLoading(true);
        setError(null);
        workspaceApi
            .get(customerId)
            .then((res) => {
                const { customer, recent_activities, summary } = res.data.data;
                setCustomer(customer);
                setSummary(summary);
                setRecentActivities(recent_activities || []);
            })
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [customerId]);

    useEffect(() => {
        load();
    }, [load]);

    return { customer, summary, recentActivities, loading, error, retry: load, setCustomer, setSummary, setRecentActivities };
}
