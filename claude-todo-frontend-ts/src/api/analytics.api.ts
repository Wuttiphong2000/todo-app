import client from "./client";

export const analyticsApi = {
  recordGuestVisit: () => client.post("/analytics/guest-visit"),
};
