import { getCollection, type CollectionEntry } from 'astro:content'

export const sortSparks = (
  p1: CollectionEntry<'sparks'>,
  p2: CollectionEntry<'sparks'>
) => {
  const endDateDiff =
    (p2.data.endDate?.getTime() || Number.MAX_SAFE_INTEGER) -
    (p1.data.endDate?.getTime() || Number.MAX_SAFE_INTEGER)
  const startDateDiff =
    p2.data.startDate.getTime() - p1.data.startDate.getTime()

  return (
    endDateDiff || startDateDiff || p1.data.title.localeCompare(p2.data.title)
  )
}

export const getSparks = async (tag?: string) => {
  const sparks = await getCollection('sparks')

  sparks.sort(sortSparks)

  return sparks.filter(
    (p) =>
      !tag || p.data.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}
