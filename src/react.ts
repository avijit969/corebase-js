import { useState, useEffect } from 'react';
import { CoreBaseClient } from './client';

export interface UseQueryOptions {
    enabled?: boolean;
    onData?: (data: any) => void;
    onError?: (error: any) => void;
}

export interface UseQueryResult<T> {
    data: T | null;
    loading: boolean;
    error: any;
}

/**
 * Hook to subscribe to realtime data queries.
 * Compatible with React and React Native.
 * 
 * @param client - The CoreBaseClient instance
 * @param query - The query object definition
 * @param options - Options for the hook
 * @returns The current data, loading state, and error
 */
export function useQuery<T = any>(
    client: CoreBaseClient,
    query: any,
    options: UseQueryOptions = {}
): UseQueryResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    const { enabled = true, onData, onError } = options;

    // Use stringified query to detect changes deeply
    const queryJson = JSON.stringify(query);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let subId: string | undefined;

        const subscribe = () => {
            setLoading(true);
            setError(null);

            try {
                if (!client.realtime) {
                    throw new Error("RealtimeClient is not initialized on the CoreBaseClient instance.");
                }

                subId = client.realtime.subscribe(query, (newData: any) => {
                    setData(newData);
                    setLoading(false);
                    if (onData) onData(newData);
                });
            } catch (err: any) {
                console.error("CoreBase useQuery error:", err);
                setError(err);
                setLoading(false);
                if (onError) onError(err);
            }
        };

        subscribe();

        return () => {
            if (subId && client.realtime) {
                client.realtime.unsubscribe(subId);
            }
        };
    }, [client, queryJson, enabled]); // Re-run if client, query or enabled status changes

    return { data, loading, error };
}
