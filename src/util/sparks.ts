import { getCollection, type CollectionEntry } from 'astro:content'

export const sortSparks = (
  p1: CollectionEntry<'sparks'>,
  p2: CollectionEntry<'sparks'>
) => p2.data.publishedDate.getTime() - p1.data.publishedDate.getTime()

export const getSparks = async () => {
  const sparks = await getCollection('sparks')

  sparks.sort(sortSparks)

  return sparks
}
