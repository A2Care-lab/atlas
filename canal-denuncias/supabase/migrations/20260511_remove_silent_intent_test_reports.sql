DELETE FROM public.reports
WHERE title LIKE 'Test Report %'
  AND description LIKE 'Auto generated report for testing silent intent stats%';
