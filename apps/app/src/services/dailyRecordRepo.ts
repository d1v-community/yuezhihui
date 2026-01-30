import { getStorageJson, setStorageJson } from '../storage/storage'
import type { DailyRecord, DailyRecordStored } from '../types/dailyRecord'

function recordKey(date: string) {
  return `daily.record.${date}`
}

export async function loadDailyRecord(date: string): Promise<DailyRecordStored> {
  const stored = getStorageJson<DailyRecordStored>(recordKey(date))
  if (stored?.record?.date === date) return stored
  return {
    record: { date, hasBleeding: false, events: [] },
    submittedAt: null,
  }
}

export async function saveDailyRecordDraft(stored: DailyRecordStored) {
  setStorageJson(recordKey(stored.record.date), stored)
}

export async function submitDailyRecord(record: DailyRecord): Promise<DailyRecordStored> {
  const next: DailyRecordStored = { record, submittedAt: Date.now() }
  setStorageJson(recordKey(record.date), next)
  return next
}

