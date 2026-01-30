export type MenstrualEventType = 'pad' | 'tampon' | 'symptom'

export type MenstrualColor = 'pink' | 'red' | 'rust' | 'dark' | 'brown'

export type DailyRecordEvent = {
  id: string
  eventTime: string // ISO
  eventType: MenstrualEventType
  // pad/tampon
  productType?: string
  model?: string
  color?: MenstrualColor
  volumeMl?: number
  // symptom
  symptomName?: string
}

export type DailyRecord = {
  date: string // YYYY-MM-DD
  hasBleeding: boolean
  events: DailyRecordEvent[]
}

export type DailyRecordStored = {
  record: DailyRecord
  submittedAt: number | null
}

