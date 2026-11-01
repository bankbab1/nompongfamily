import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { IdeaStatusUpdate, Suggestion, SuggestionInput } from './model'
import { suggestions } from './store'

export const suggestionsKey = ['suggestions'] as const

export function useSuggestions() {
  return useQuery({ queryKey: suggestionsKey, queryFn: () => suggestions.list() })
}

export function useCreateSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SuggestionInput) => suggestions.create(input),
    onSuccess: (created) => qc.setQueryData<Suggestion[]>(suggestionsKey, (old) => [created, ...(old ?? [])]),
  })
}

export function useToggleVote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suggestions.toggleVote(id),
    onSuccess: (s) => qc.setQueryData<Suggestion[]>(suggestionsKey, (old) => old?.map((x) => (x.id === s.id ? s : x))),
  })
}

/** Admin: change an idea's status (and note to the fan). */
export function useSetIdeaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: IdeaStatusUpdate }) => suggestions.setStatus(id, update),
    onSuccess: (s) => qc.setQueryData<Suggestion[]>(suggestionsKey, (old) => old?.map((x) => (x.id === s.id ? s : x))),
  })
}
