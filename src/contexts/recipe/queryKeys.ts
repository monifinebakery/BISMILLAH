export const recipeQueryKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueryKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...recipeQueryKeys.lists(), filters] as const,
  details: () => [...recipeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeQueryKeys.details(), id] as const,
  categories: () => [...recipeQueryKeys.all, 'categories'] as const,
  stats: () => [...recipeQueryKeys.all, 'stats'] as const,
} as const;
