export default defineEventHandler(event => ({ matches: filterSets(parseSetQuery(event)).length }))
