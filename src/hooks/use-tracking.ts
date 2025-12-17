import { useQuery } from "@tanstack/react-query";
import { getTrackedEmails, getEmailDetail, EmailsResponse, EmailDetailResponse } from "@/lib/tracking-api";

export function useTrackedEmails() {
  return useQuery<EmailsResponse>({
    queryKey: ['tracked-emails'],
    queryFn: getTrackedEmails,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useEmailDetail(trackingId: string | null) {
  return useQuery<EmailDetailResponse>({
    queryKey: ['email-detail', trackingId],
    queryFn: () => getEmailDetail(trackingId!),
    enabled: !!trackingId,
  });
}
