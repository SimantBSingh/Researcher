import { useEffect, useRef } from "react";
import { apiUrl } from "../helpers/getApiUrl";

/**
 * Opens a Server-Sent Events connection for the current user.
 * Calls the matching handler whenever the server emits a user-level event.
 *
 * @param {Object} handlers - map of event type → callback, e.g.
 *   { projects_changed: refetchSharedProjects }
 */
export function useUserEvents(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const url = `${apiUrl}/api/sse/user/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const { type, ...payload } = JSON.parse(event.data);
        if (type && type !== "connected" && type !== "heartbeat") {
          handlersRef.current[type]?.(payload);
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically — no action needed
    };

    return () => {
      es.close();
    };
  }, []);
}
