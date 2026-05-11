type ReportCollectionItem = {
  id: string;
  created_at: string;
  title?: string | null;
  description?: string | null;
};

const SILENT_INTENT_TEST_DESCRIPTION = 'Auto generated report for testing silent intent stats';

export function isSystemGeneratedSilentIntentReport<T extends ReportCollectionItem>(item: T): boolean {
  const title = (item.title || '').trim();
  const description = (item.description || '').trim();

  return title.startsWith('Test Report ') || description.startsWith(SILENT_INTENT_TEST_DESCRIPTION);
}

export function normalizeReportCollection<T extends ReportCollectionItem>(items: T[] | null | undefined): T[] {
  if (!items?.length) {
    return [];
  }

  const uniqueItems = new Map<string, T>();

  for (const item of items) {
    if (isSystemGeneratedSilentIntentReport(item)) {
      continue;
    }

    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item);
    }
  }

  return Array.from(uniqueItems.values()).sort((a, b) => {
    const createdAtDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return b.id.localeCompare(a.id);
  });
}
