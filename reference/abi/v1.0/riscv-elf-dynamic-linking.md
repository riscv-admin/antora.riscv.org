# 6.1. Dynamic Linking

## [](#6-1-dynamic-linking)6.1\. Dynamic Linking

Any functions that use registers in a way that is incompatible with the calling convention of the ABI in use must be annotated with`STO_RISCV_VARIANT_CC`, as defined in [\[Symbol Table\]](#Symbol Table).

| |  Vector registers have a variable size depending on the hardware implementation and can be quite large. Saving/restoring all these vector arguments in a run-time linker’s lazy resolver would use a large amount of stack space and hurt performance. STO\_RISCV\_VARIANT\_CC attribute will require the run-time linker to resolve the symbol directly to prevent saving/restoring any vector registers. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
