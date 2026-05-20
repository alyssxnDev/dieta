// Placeholder — types reais serão gerados a partir do schema do Supabase no Passo 2:
//   pnpm dlx supabase gen types typescript --project-id <id> > types/database.ts
//
// Por ora exporta um tipo `Database` vazio pra os clients Supabase compilarem.
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
