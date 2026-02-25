import { supabase } from './supabase';

type FunnelEvent = 'link_generated' | 'link_clicked' | 'report_submitted';

export async function trackFunnelEvent(
  event_type: FunnelEvent,
  link_token: string,
  opts?: { company_id?: string | null; generated_by_user_id?: string | null; actor_ip?: string | null; user_agent?: string | null }
) {
  try {
    const payload: any = {
      event_type,
      link_token,
      company_id: opts?.company_id ?? null,
      generated_by_user_id: opts?.generated_by_user_id ?? null,
      actor_ip: opts?.actor_ip ?? null,
      user_agent: opts?.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : null),
    };
    await supabase.from('report_funnel_events').insert(payload);
  } catch {
    // ignore
  }
}

