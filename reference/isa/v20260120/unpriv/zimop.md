# 10.1. "Zimop" Extension for May-Be-Operations, Version 1.0

## [](#zimop)10.1\. "Zimop" Extension for May-Be-Operations, Version 1.0

This chapter defines the "Zimop" extension, which introduces the concept of instructions that _may be operations_ (MOPs). MOPs are initially defined to simply write zero to `x[rd]`, but are designed to be redefined by later extensions to perform some other action. The Zimop extension defines an encoding space for 40 MOPs.

| |  It is sometimes desirable to define instruction-set extensions whose instructions, rather than raising illegal-instruction exceptions when the extension is not implemented, take no useful action (beyond writing x\[rd\]). For example, programs with control-flow integrity checks can execute correctly on implementations without the corresponding extension, provided the checks are simply ignored. Implementing these checks as MOPs allows the same programs to run on implementations with or without the corresponding extension. Although similar in some respects to HINTs, MOPs cannot be encoded as HINTs, because unlike HINTs, MOPs are allowed to alter architectural state. Because MOPs may be redefined by later extensions, standard software should not execute a MOP unless it is deliberately targeting an extension that has redefined that MOP. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

The Zimop extension defines 32 MOP instructions named MOP.R._n_, where_n_ is an integer between 0 and 31, inclusive. Unless redefined by another extension, these instructions simply write 0 to`x[rd]`. Their encoding allows future extensions to define them to read `x[rs1]`, as well as write `x[rd]`.

![svg](_images/svg-7f1803709ce827f61f63daf6a127000e08423c3a.svg) 

The Zimop extension additionally defines 8 MOP instructions named MOP.RR._n_, where _n_ is an integer between 0 and 7, inclusive. Unless redefined by another extension, these instructions simply write 0 to `x[rd]`. Their encoding allows future extensions to define them to read `x[rs1]` and `x[rs2]`, as well as write `x[rd]`.

![svg](_images/svg-6e98e6a222e99907046cd3cf8aa19c7a7f1fced9.svg) 

| |  The recommended assembly syntax for MOP.R._n_ is MOP.R._n_ rd, rs1, with any x\-register specifier being valid for either argument. Similarly for MOP.RR._n_, the recommended syntax is MOP.RR._n_ rd, rs1, rs2\. The extension that redefines a MOP may define an alternate assembly mnemonic. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  These MOPs are encoded in the SYSTEM major opcode in part because it is expected their behavior will be modulated by privileged CSR state. |
| --------------------------------------------------------------------------------------------------------------------------------------------- |

| |  These MOPs are defined to write zero to x\[rd\], rather than performing no operation, to simplify instruction decoding and to allow testing the presence of features by branching on the zeroness of the result. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The MOPs defined in the Zimop extension do not carry a syntactic dependency from `x[rs1]` or `x[rs2]` to `x[rd]`, though an extension that redefines the MOP may impose such a requirement.

| |  Not carrying a syntactic dependency relieves straightforward implementations of reading x\[rs1\] and x\[rs2\]. |
| ----------------------------------------------------------------------------------------------------------------- |

### [](#10-1-1-zcmop-compressed-may-be-operations-extension-version-1-0)10.1.1\. "Zcmop" Compressed May-Be-Operations Extension, Version 1.0

This section defines the "Zcmop" extension, which defines eight 16-bit MOP instructions named C.MOP._n_, where _n_ is an odd integer between 1 and 15, inclusive. C.MOP._n_ is encoded in the reserved encoding space corresponding to C.LUI x_n_, 0, as shown in [Table 1](#norm:c-mop%5Fenc). Unlike the MOPs defined in the Zimop extension, the C.MOP._n_ instructions are defined to _not_ write any register.Their encoding allows future extensions to define them to read register`x[_n_]`.

The Zcmop extension depends upon the Zca extension.

![svg](_images/svg-5b86065f01ee794eb2fc368880d5d94298921b48.svg) 

| |  Very few suitable 16-bit encoding spaces exist. This space was chosen because it already has unusual behavior with respect to the rd/rs1field—​it encodes c.addi16sp when the field contains x2\--and is therefore of lower value for most purposes. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 1\. C.MOP._n_ instruction encoding.__
| Mnemonic | Encoding         | Redefinable to read register |
| -------- | ---------------- | ---------------------------- |
| C.MOP.1  | 0110000010000001 | x1                           |
| C.MOP.3  | 0110000110000001 | x3                           |
| C.MOP.5  | 0110001010000001 | x5                           |
| C.MOP.7  | 0110001110000001 | x7                           |
| C.MOP.9  | 0110010010000001 | x9                           |
| C.MOP.11 | 0110010110000001 | x11                          |
| C.MOP.13 | 0110011010000001 | x13                          |
| C.MOP.15 | 0110011110000001 | x15                          |

| |  The recommended assembly syntax for C.MOP._n_ is simply the nullary C.MOP._n_. The possibly accessed register is implicitly x_n_. |
| ------------------------------------------------------------------------------------------------------------------------------------ |

| |  The expectation is that each Zcmop instruction is equivalent to some Zimop instruction, but the choice of expansion (if any) is left to the extension that redefines the MOP. Note, a Zcmop instruction that does not write a value can expand into a write to x0. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
