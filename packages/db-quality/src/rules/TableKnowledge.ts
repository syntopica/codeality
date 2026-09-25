/** What the migrations say about a table's access paths: every indexed leading column, and the unique ones among them. */
export type TableKnowledge = { indexed: Set<string>; unique: Set<string> }
