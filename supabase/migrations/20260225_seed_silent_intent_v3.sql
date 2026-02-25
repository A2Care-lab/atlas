
DO $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;
  v_token uuid;
  v_date timestamptz;
  i integer;
  j integer;
  v_protocol text;
  v_report_exists integer;
BEGIN
  -- Loop through available companies (limit 3)
  FOR v_company_id IN SELECT id FROM companies LIMIT 3 LOOP
    -- Loop through users in that company (limit 5)
    FOR v_user_id IN SELECT id FROM user_profiles WHERE company_id = v_company_id LIMIT 5 LOOP
      
      -- Generate data for last 5 months (Oct 2025 - Feb 2026)
      FOR j IN 0..4 LOOP 
        v_date := date_trunc('month', now()) - (j || ' month')::interval;
        
        -- 1. Generate SILENT INTENTS (Clicked but NOT submitted)
        -- Generate 5 to 15 per user per month
        FOR i IN 1..(5 + floor(random() * 10)::int) LOOP
          v_token := gen_random_uuid();
          
          -- Link Generated
          INSERT INTO report_funnel_events (link_token, event_type, company_id, generated_by_user_id, created_at)
          VALUES (v_token, 'link_generated', v_company_id, v_user_id, v_date + (random() * interval '20 days'));
          
          -- Link Clicked (1-24 hours later)
          INSERT INTO report_funnel_events (link_token, event_type, company_id, generated_by_user_id, created_at)
          VALUES (v_token, 'link_clicked', v_company_id, v_user_id, v_date + (random() * interval '20 days') + (random() * interval '24 hours'));
          
          -- NO report submitted
        END LOOP;
        
        -- 2. Generate SUBMITTED REPORTS (Clicked AND submitted)
        -- Generate 2 to 5 per user per month
        FOR i IN 1..(2 + floor(random() * 3)::int) LOOP
          v_token := gen_random_uuid();
          -- Simple protocol generation to avoid collision
          v_protocol := to_char(v_date, 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);
          
          -- Link Generated
          INSERT INTO report_funnel_events (link_token, event_type, company_id, generated_by_user_id, created_at)
          VALUES (v_token, 'link_generated', v_company_id, v_user_id, v_date + (random() * interval '20 days'));
          
          -- Link Clicked
          INSERT INTO report_funnel_events (link_token, event_type, company_id, generated_by_user_id, created_at)
          VALUES (v_token, 'link_clicked', v_company_id, v_user_id, v_date + (random() * interval '20 days') + (random() * interval '1 hour'));
          
          -- Report Submitted
          -- Check if protocol exists to be safe
          SELECT count(*) INTO v_report_exists FROM reports WHERE protocol = v_protocol;
          
          IF v_report_exists = 0 THEN
              INSERT INTO reports (
                protocol,
                token, 
                company_id, 
                title, 
                description, 
                main_reason, 
                situation_type, 
                affected_scope, 
                recurrence, 
                risk_level, 
                status,
                is_anonymous,
                has_immediate_risk,
                involves_leadership,
                has_retaliation,
                risk_score,
                created_at
              ) VALUES (
                v_protocol,
                v_token::text,
                v_company_id,
                'Test Report ' || i,
                'Auto generated report for testing silent intent stats',
                'Outros',
                'other',
                'individual',
                'first_time',
                'low',
                'received',
                true,
                false,
                false,
                false,
                0,
                v_date + (random() * interval '20 days') + (random() * interval '2 hours')
              );
          END IF;
          
        END LOOP;

      END LOOP;
    END LOOP;
  END LOOP;
END $$;
