# `lib/db/schema/`

Drizzle schemas — one file per entity for readability.

Pattern:
```ts
// src/lib/db/schema/pelada.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const peladas = pgTable("peladas", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // ...
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Pelada = typeof peladas.$inferSelect;
export type NewPelada = typeof peladas.$inferInsert;
```

Re-export everything from `index.ts` for `drizzle.config.ts` and migrations.

See `ARCHITECTURE.md` §5.2 for the full domain model.
