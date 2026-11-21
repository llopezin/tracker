import type { RoadTag, SeaTag, StatusUpdate } from '../types'

export type Tag = RoadTag | SeaTag
export type Update = StatusUpdate<Tag>

/** Oldest first by the ISO date `at` returns. */
export const byTime = <T>(at: (x: T) => string) => (a: T, b: T) => Date.parse(at(a)) - Date.parse(at(b))
