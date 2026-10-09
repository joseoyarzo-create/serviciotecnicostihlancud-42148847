# Architecture rules
- Digital receptions use a transactional authenticated RPC, an independent sequence and a unique request ID; this prevents partial saves and duplicate receipts on retries.
- A reception links to the existing ficha as its machine/repair record; physical repairs remain standalone fichas to avoid duplicated machine data and mandatory digital receipts.
- Thermal reception HTML is separate from existing ficha PDF/label generation; this preserves current documents and allows variable-height receipt printing.