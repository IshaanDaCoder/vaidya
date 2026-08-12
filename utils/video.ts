/**
 * Jitsi Meet's public server (meet.jit.si) needs no account, API key, or
 * payment method — a room is just a name. Room names are namespaced and
 * derived from the consultation's UUID, which is unguessable, giving
 * reasonable privacy without needing JWT-based room auth. Revisit if a
 * stronger guarantee is ever needed (Jitsi supports JWT auth on
 * self-hosted or paid instances) — tracked as a Day 14 security item.
 *
 * Note: meet.jit.si blocks being embedded via a plain <iframe src="...">
 * (confirmed — it works as a direct link but not embedded); it must be
 * embedded through Jitsi's own external_api.js / JitsiMeetExternalAPI,
 * which is the officially supported third-party embedding path. See
 * components/JitsiRoom.tsx.
 */
export function getConsultationRoomName(consultationId: string) {
  return `vaidya-consult-${consultationId}`;
}
