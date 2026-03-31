import { useEffect, useRef } from "react";
import { apiUrl } from "../helpers/getApiUrl";

/**
 * Opens a Server-Sent Events connection for a project.
 * Calls the matching handler whenever the server emits an event.
 *
 * @param {string|number} projectId
 * @param {Object} handlers - map of event type → callback, e.g.
 *   { tasks_changed: fetchTasks, files_changed: reloadFiles, ... }
 */
export function useProjectEvents(projectId, handlers) {
  // Keep a ref so the EventSource callback always sees the latest handlers
  // without needing to reconnect when they change (e.g. on re-render).
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const url = `${apiUrl}/api/sse/projects/${projectId}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const { type } = JSON.parse(event.data);
        if (type && type !== "connected" && type !== "heartbeat") {
          handlersRef.current[type]?.();
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
  }, [projectId]);
}
