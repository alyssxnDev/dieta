// TanStack Query keys centralizados — invalidação fica fácil de raciocinar.
export const profileKeys = {
  all: ["profiles"] as const,
  list: () => [...profileKeys.all, "list"] as const,
}

export const foodKeys = {
  all: ["foods"] as const,
  list: () => [...foodKeys.all, "list"] as const,
}

export const mealKeys = {
  all: ["meals"] as const,
  templates: (profileId: string) =>
    [...mealKeys.all, "templates", profileId] as const,
  templatesByDay: (profileId: string, dayOfWeek: number) =>
    [...mealKeys.templates(profileId), dayOfWeek] as const,
  completions: (profileId: string, date: string) =>
    [...mealKeys.all, "completions", profileId, date] as const,
  /** Faixa de datas, usada no painel pra streak/gráfico. */
  completionsRange: (profileId: string, from: string, to: string) =>
    [...mealKeys.all, "completionsRange", profileId, from, to] as const,
  /** Substituições do dia (Hoje). */
  overrides: (profileId: string, date: string) =>
    [...mealKeys.all, "overrides", profileId, date] as const,
}

export const waterKeys = {
  all: ["water"] as const,
  forDate: (profileId: string, date: string) =>
    [...waterKeys.all, "forDate", profileId, date] as const,
  range: (profileId: string, from: string, to: string) =>
    [...waterKeys.all, "range", profileId, from, to] as const,
}
