import { getStorageJson, setStorageJson } from '../storage/storage'
import type { DailyRecord, DailyRecordStored } from '../types/dailyRecord'
import { getMenstrualDailyByDate, putMenstrualDailyByDate } from './menstrual'

function recordKey(date: string) {
  return `daily.record.${date}`
}

export async function loadDailyRecord(date: string): Promise<DailyRecordStored> {
  const stored = getStorageJson<DailyRecordStored>(recordKey(date))
  // Prefer local draft if it exists (protects unsaved changes).
  if (stored?.record?.date === date) return stored

  // Otherwise try server; fall back to empty record on error.
  try {
    const remote = await getMenstrualDailyByDate(date)
    return {
      record: {
        date: remote.date,
        hasBleeding: remote.hasBleeding,
        events: (remote.events || []).map((e) => ({
          id: String(e.id),
          eventTime: e.eventTime,
          eventType: e.eventType as any,
          productType: e.productType,
          model: e.model,
          color: e.color as any,
          volumeMl: e.volumeMl,
          symptomName: e.symptomName,
        })),
      },
      // Server does not provide submittedAt yet; keep null for now.
      submittedAt: null,
    }
  } catch {
    return {
      record: { date, hasBleeding: false, events: [] },
      submittedAt: null,
    }
  }
}

export async function saveDailyRecordDraft(stored: DailyRecordStored) {
  setStorageJson(recordKey(stored.record.date), stored)
}

export async function submitDailyRecord(record: DailyRecord): Promise<DailyRecordStored> {
  // Submit to server (strip local-only `id` fields).
  await putMenstrualDailyByDate(record.date, {
    hasBleeding: record.hasBleeding,
    events: record.events.map((e) => ({
      eventTime: e.eventTime,
      eventType: e.eventType as any,
      productType: e.productType,
      model: e.model,
      color: e.color as any,
      volumeMl: e.volumeMl,
      symptomName: e.symptomName,
    })),
  })

  // Keep local snapshot as "draft cache" + submitted marker.
  const next: DailyRecordStored = { record, submittedAt: Date.now() }
  setStorageJson(recordKey(record.date), next)
  return next
}
