# 30.1. Bit Manipulation Extensions

## [](#bits)30.1\. Bit Manipulation Extensions

The bit-manipulation (bitmanip) extension collection is comprised of several component extensions to the base RISC-V architecture that are intended to provide some combination of code-size reduction, performance improvement, and energy reduction. While the instructions are intended for general use, some instructions are more useful in certain domains than in others. Hence, several smaller bitmanip extensions are provided. Each of these smaller extensions is grouped by common function and use case, and each has its own Zb\*-extension name.

Each bitmanip extension includes a group of several bitmanip instructions that have similar purposes and can often share the same logic. Some instructions are available in only one extension, while others are available in several. The instructions have mnemonics and encodings that are independent of the extensions in which they appear. Thus, when implementing extensions with overlapping instructions, there is no redundancy in logic or encoding.

The bitmanip extensions are defined for RV32 and RV64.

The bitmanip extension follows the convention in RV64 that _w_\-suffixed instructions (without a dot before the _w_) ignore the upper 32 bits of their inputs, operate on the least-significant 32 bits as signed values, and produce a 32-bit signed result that is sign-extended to XLEN.

Bitmanip instructions with the suffix _.uw_ have one operand that is an unsigned 32-bit value that is extracted from the least-significant 32 bits of the specified register. Other than that, these perform full-XLEN operations.

Bitmanip instructions with the suffixes _.b_, _.h_, and _.w_ only look at the least-significant 8 bits, 16 bits, and 32 bits of the input (respectively) and produce an XLEN-wide result that is sign-extended or zero-extended, based on the specific instruction.

The bit-manipulation instructions comprise the following extensions:

* Zba: [Address generation instructions](#zba)
* Zbb: [Basic bit-manipulation](#zbb)
* Zbs: [Single-bit instructions](#zbs)
* Zbc: [Carry-less multiplication](#zbc)
* Zbkb: [Bit-manipulation for Cryptography](#zbkb)
* Zbkc: [Carry-less multiplication for Cryptography](#zbkc)
* Zbkx: [Crossbar permutations](#zbkx)

Below is a list of all of the instructions that are included in these extensions, along with their specific mapping:

| RV32 | RV64                       | Mnemonic                                             | Instruction                                        | Zbb | Zbkb | Zbc | Zbkc |
| ---- | -------------------------- | ---------------------------------------------------- | -------------------------------------------------- | --- | ---- | --- | ---- |
| ✓    | ✓                          | andn _rd_, _rs1_, _rs2_                              | [AND with inverted operand](#insns-andn)           | ✓   | ✓    |     |      |
| ✓    | ✓                          | brev8 _rd_, _rs_                                     | [Reverse bits in bytes](#insns-brev8)              | ✓   |      |     |      |
| ✓    | ✓                          | clmul _rd_, _rs1_, _rs2_                             | [Carry-less multiply (low-part)](#insns-clmul)     | ✓   | ✓    |     |      |
| ✓    | ✓                          | clmulh _rd_, _rs1_, _rs2_                            | [Carry-less multiply (high-part)](#insns-clmulh)   | ✓   | ✓    |     |      |
| ✓    | ✓                          | clmulr _rd_, _rs1_, _rs2_                            | [Carry-less multiply (reversed)](#insns-clmulr)    | ✓   |      |     |      |
| ✓    | ✓                          | clz _rd_, _rs_                                       | [Count leading zero bits](#insns-clz)              | ✓   |      |     |      |
| ✓    | clzw _rd_, _rs_            | [Count leading zero bits in word](#insns-clzw)       | ✓                                                  |     |      |     |      |
| ✓    | ✓                          | cpop _rd_, _rs_                                      | [Count set bits](#insns-cpop)                      | ✓   |      |     |      |
| ✓    | cpopw _rd_, _rs_           | [Count set bits in word](#insns-cpopw)               | ✓                                                  |     |      |     |      |
| ✓    | ✓                          | ctz _rd_, _rs_                                       | [Count trailing zero bits](#insns-ctz)             | ✓   |      |     |      |
| ✓    | ctzw _rd_, _rs_            | [Count trailing zero bits in word](#insns-ctzw)      | ✓                                                  |     |      |     |      |
| ✓    | ✓                          | max _rd_, _rs1_, _rs2_                               | [Maximum](#insns-max)                              | ✓   |      |     |      |
| ✓    | ✓                          | maxu _rd_, _rs1_, _rs2_                              | [Unsigned maximum](#insns-maxu)                    | ✓   |      |     |      |
| ✓    | ✓                          | min _rd_, _rs1_, _rs2_                               | [Minimum](#insns-min)                              | ✓   |      |     |      |
| ✓    | ✓                          | minu _rd_, _rs1_, _rs2_                              | [Unsigned minimum](#insns-minu)                    | ✓   |      |     |      |
| ✓    | ✓                          | orc.b _rd_, _rs_                                     | [Bitwise OR-Combine, byte granule](#insns-orc%5Fb) | ✓   |      |     |      |
| ✓    | ✓                          | orn _rd_, _rs1_, _rs2_                               | [OR with inverted operand](#insns-orn)             | ✓   | ✓    |     |      |
| ✓    | ✓                          | pack _rd_, _rs1_, _rs2_                              | [Pack low halves of registers](#insns-pack)        | ✓   |      |     |      |
| ✓    | ✓                          | packh _rd_, _rs1_, _rs2_                             | [Pack low bytes of registers](#insns-packh)        | ✓   |      |     |      |
| ✓    | packw _rd_, _rs1_, _rs2_   | [Pack low 16-bits of registers (RV64)](#insns-packw) | ✓                                                  |     |      |     |      |
| ✓    | ✓                          | rev8 _rd_, _rs_                                      | [Byte-reverse register](#insns-rev8)               | ✓   | ✓    |     |      |
| ✓    | ✓                          | rol _rd_, _rs1_, _rs2_                               | [Rotate left (Register)](#insns-rol)               | ✓   | ✓    |     |      |
| ✓    | rolw _rd_, _rs1_, _rs2_    | [Rotate Left Word (Register)](#insns-rolw)           | ✓                                                  | ✓   |      |     |      |
| ✓    | ✓                          | ror _rd_, _rs1_, _rs2_                               | [Rotate right (Register)](#insns-ror)              | ✓   | ✓    |     |      |
| ✓    | ✓                          | rori _rd_, _rs1_, _shamt_                            | [Rotate right (Immediate)](#insns-rori)            | ✓   | ✓    |     |      |
| ✓    | roriw _rd_, _rs1_, _shamt_ | [Rotate right Word (Immediate)](#insns-roriw)        | ✓                                                  | ✓   |      |     |      |
| ✓    | rorw _rd_, _rs1_, _rs2_    | [Rotate right Word (Register)](#insns-rorw)          | ✓                                                  | ✓   |      |     |      |
| ✓    | ✓                          | sext.b _rd_, _rs_                                    | [Sign-extend byte](#insns-sext%5Fb)                | ✓   |      |     |      |
| ✓    | ✓                          | sext.h _rd_, _rs_                                    | [Sign-extend halfword](#insns-sext%5Fh)            | ✓   |      |     |      |
| ✓    | unzip _rd_, _rs_           | [Bit deinterleave](#insns-unzip)                     | ✓                                                  |     |      |     |      |
| ✓    | ✓                          | xnor _rd_, _rs1_, _rs2_                              | [Exclusive NOR](#insns-xnor)                       | ✓   | ✓    |     |      |
| ✓    | ✓                          | zext.h _rd_, _rs_                                    | [Zero-extend halfword](#insns-zext%5Fh)            | ✓   |      |     |      |
| ✓    | zip _rd_, _rs_             | [Bit interleave](#insns-zip)                         | ✓                                                  |     |      |     |      |

| RV32 | RV64                         | Mnemonic                                                    | Instruction                                    | Zba | Zbs |
| ---- | ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------- | --- | --- |
| ✓    | add.uw _rd_, _rs1_, _rs2_    | [Add unsigned word](#insns-add%5Fuw)                        | ✓                                              |     |     |
| ✓    | ✓                            | bclr _rd_, _rs1_, _rs2_                                     | [Single-Bit Clear (Register)](#insns-bclr)     | ✓   |     |
| ✓    | ✓                            | bclri _rd_, _rs1_, _imm_                                    | [Single-Bit Clear (Immediate)](#insns-bclri)   | ✓   |     |
| ✓    | ✓                            | bext _rd_, _rs1_, _rs2_                                     | [Single-Bit Extract (Register)](#insns-bext)   | ✓   |     |
| ✓    | ✓                            | bexti _rd_, _rs1_, _imm_                                    | [Single-Bit Extract (Immediate)](#insns-bexti) | ✓   |     |
| ✓    | ✓                            | binv _rd_, _rs1_, _rs2_                                     | [Single-Bit Invert (Register)](#insns-binv)    | ✓   |     |
| ✓    | ✓                            | binvi _rd_, _rs1_, _imm_                                    | [Single-Bit Invert (Immediate)](#insns-binvi)  | ✓   |     |
| ✓    | ✓                            | bset _rd_, _rs1_, _rs2_                                     | [Single-Bit Set (Register)](#insns-bset)       | ✓   |     |
| ✓    | ✓                            | bseti _rd_, _rs1_, _imm_                                    | [Single-Bit Set (Immediate)](#insns-bseti)     | ✓   |     |
| ✓    | ✓                            | sh1add _rd_, _rs1_, _rs2_                                   | [Shift left by 1 and add](#insns-sh1add)       | ✓   |     |
| ✓    | sh1add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 1 and add](#insns-sh1add%5Fuw) | ✓                                              |     |     |
| ✓    | ✓                            | sh2add _rd_, _rs1_, _rs2_                                   | [Shift left by 2 and add](#insns-sh2add)       | ✓   |     |
| ✓    | sh2add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 2 and add](#insns-sh2add%5Fuw) | ✓                                              |     |     |
| ✓    | ✓                            | sh3add _rd_, _rs1_, _rs2_                                   | [Shift left by 3 and add](#insns-sh3add)       | ✓   |     |
| ✓    | sh3add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 3 and add](#insns-sh3add%5Fuw) | ✓                                              |     |     |
| ✓    | slli.uw _rd_, _rs1_, _imm_   | [Shift-left unsigned word (Immediate)](#insns-slli%5Fuw)    | ✓                                              |     |     |

### [](#30-1-1-b-extension-for-bit-manipulation-version-1-0-0)30.1.1\. "B" Extension for Bit Manipulation, Version 1.0.0

The B standard extension comprises instructions provided by the Zba, Zbb, and Zbs extensions.

### [](#zba)30.1.2\. Zba: Extension for Address generation, Version 1.0.0

The Zba instructions can be used to accelerate the generation of addresses that index into arrays of basic types (halfword, word, doubleword) using both unsigned word-sized and XLEN-sized indices: a shifted index is added to a base address.

The shift and add instructions do a left shift of 1, 2, or 3 because these are commonly found in real-world code and because they can be implemented with a minimal amount of additional hardware beyond that of the simple adder. This avoids lengthening the critical path in implementations.

While the shift and add instructions are limited to a maximum left shift of 3, the slli instruction (from the base ISA) can be used to perform similar shifts for indexing into arrays of wider elements. The slli.uw — added in this extension — can be used when the index is to be interpreted as an unsigned word.

The following instructions comprise the Zba extension:

| RV32 | RV64                         | Mnemonic                                                    | Instruction                              |
| ---- | ---------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| ✓    | add.uw _rd_, _rs1_, _rs2_    | [Add unsigned word](#insns-add%5Fuw)                        |                                          |
| ✓    | ✓                            | sh1add _rd_, _rs1_, _rs2_                                   | [Shift left by 1 and add](#insns-sh1add) |
| ✓    | sh1add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 1 and add](#insns-sh1add%5Fuw) |                                          |
| ✓    | ✓                            | sh2add _rd_, _rs1_, _rs2_                                   | [Shift left by 2 and add](#insns-sh2add) |
| ✓    | sh2add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 2 and add](#insns-sh2add%5Fuw) |                                          |
| ✓    | ✓                            | sh3add _rd_, _rs1_, _rs2_                                   | [Shift left by 3 and add](#insns-sh3add) |
| ✓    | sh3add.uw _rd_, _rs1_, _rs2_ | [Shift unsigned word left by 3 and add](#insns-sh3add%5Fuw) |                                          |
| ✓    | slli.uw _rd_, _rs1_, _imm_   | [Shift-left unsigned word (Immediate)](#insns-slli%5Fuw)    |                                          |

### [](#zbb)30.1.3\. Zbb: Extension for Basic bit-manipulation, Version 1.0.0

#### [](#30-1-3-1-logical-with-negate)30.1.3.1\. Logical with negate

| RV32 | RV64 | Mnemonic                | Instruction                              |
| ---- | ---- | ----------------------- | ---------------------------------------- |
| ✓    | ✓    | andn _rd_, _rs1_, _rs2_ | [AND with inverted operand](#insns-andn) |
| ✓    | ✓    | orn _rd_, _rs1_, _rs2_  | [OR with inverted operand](#insns-orn)   |
| ✓    | ✓    | xnor _rd_, _rs1_, _rs2_ | [Exclusive NOR](#insns-xnor)             |

| |  Implementation Hint The Logical with Negate instructions can be implemented by inverting the _rs2_ inputs to the base-required AND, OR, and XOR logic instructions. In some implementations, the inverter on rs2 used for subtraction can be reused for this purpose. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

#### [](#30-1-3-2-count-leadingtrailing-zero-bits)30.1.3.2\. Count leading/trailing zero bits

| RV32 | RV64            | Mnemonic                                        | Instruction                            |
| ---- | --------------- | ----------------------------------------------- | -------------------------------------- |
| ✓    | ✓               | clz _rd_, _rs_                                  | [Count leading zero bits](#insns-clz)  |
| ✓    | clzw _rd_, _rs_ | [Count leading zero bits in word](#insns-clzw)  |                                        |
| ✓    | ✓               | ctz _rd_, _rs_                                  | [Count trailing zero bits](#insns-ctz) |
| ✓    | ctzw _rd_, _rs_ | [Count trailing zero bits in word](#insns-ctzw) |                                        |

#### [](#30-1-3-3-count-population)30.1.3.3\. Count population

These instructions count the number of set bits (1-bits). This is also commonly referred to as population count.

| RV32 | RV64             | Mnemonic                               | Instruction                   |
| ---- | ---------------- | -------------------------------------- | ----------------------------- |
| ✓    | ✓                | cpop _rd_, _rs_                        | [Count set bits](#insns-cpop) |
| ✓    | cpopw _rd_, _rs_ | [Count set bits in word](#insns-cpopw) |                               |

#### [](#30-1-3-4-integer-minimummaximum)30.1.3.4\. Integer minimum/maximum

The integer minimum/maximum instructions are arithmetic R-type instructions that return the smaller/larger of two operands.

| RV32 | RV64 | Mnemonic                | Instruction                     |
| ---- | ---- | ----------------------- | ------------------------------- |
| ✓    | ✓    | max _rd_, _rs1_, _rs2_  | [Maximum](#insns-max)           |
| ✓    | ✓    | maxu _rd_, _rs1_, _rs2_ | [Unsigned maximum](#insns-maxu) |
| ✓    | ✓    | min _rd_, _rs1_, _rs2_  | [Minimum](#insns-min)           |
| ✓    | ✓    | minu _rd_, _rs1_, _rs2_ | [Unsigned minimum](#insns-minu) |

#### [](#30-1-3-5-sign-extension-and-zero-extension)30.1.3.5\. Sign extension and zero extension

These instructions perform the sign extension or zero extension of the least-significant 8 bits or 16 bits of the source register.

These instructions replace the generalized idioms `slli rd,rs,(XLEN-<size>) + srai` (for sign extension of 8-bit and 16-bit quantities) and `slli + srli` (for zero extension of 16-bit quantities).

| RV32 | RV64 | Mnemonic          | Instruction                             |
| ---- | ---- | ----------------- | --------------------------------------- |
| ✓    | ✓    | sext.b _rd_, _rs_ | [Sign-extend byte](#insns-sext%5Fb)     |
| ✓    | ✓    | sext.h _rd_, _rs_ | [Sign-extend halfword](#insns-sext%5Fh) |
| ✓    | ✓    | zext.h _rd_, _rs_ | [Zero-extend halfword](#insns-zext%5Fh) |

#### [](#30-1-3-6-bitwise-rotation)30.1.3.6\. Bitwise rotation

Bitwise rotation instructions are similar to the shift-logical operations from the base spec. However, where the shift-logical instructions shift in zeros, the rotate instructions shift in the bits that were shifted out of the other side of the value.Such operations are also referred to as ‘circular shifts’.

| RV32 | RV64                       | Mnemonic                                      | Instruction                             |
| ---- | -------------------------- | --------------------------------------------- | --------------------------------------- |
| ✓    | ✓                          | rol _rd_, _rs1_, _rs2_                        | [Rotate left (Register)](#insns-rol)    |
| ✓    | rolw _rd_, _rs1_, _rs2_    | [Rotate Left Word (Register)](#insns-rolw)    |                                         |
| ✓    | ✓                          | ror _rd_, _rs1_, _rs2_                        | [Rotate right (Register)](#insns-ror)   |
| ✓    | ✓                          | rori _rd_, _rs1_, _shamt_                     | [Rotate right (Immediate)](#insns-rori) |
| ✓    | roriw _rd_, _rs1_, _shamt_ | [Rotate right Word (Immediate)](#insns-roriw) |                                         |
| ✓    | rorw _rd_, _rs1_, _rs2_    | [Rotate right Word (Register)](#insns-rorw)   |                                         |

| |  Architecture Explanation The rotate instructions were included to replace a common four-instruction sequence to achieve the same effect (neg; sll/srl; srl/sll; or) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#30-1-3-7-or-combine)30.1.3.7\. OR Combine

**orc.b** sets the bits of each byte in the result _rd_ to all zeros if no bit within the respective byte of _rs_ is set, or to all ones if any bit within the respective byte of _rs_ is set.

One use-case is string-processing functions, such as **strlen** and **strcpy**, which can use **orc.b** to test for the terminating zero byte by counting the set bits in leading non-zero bytes in a word.

| RV32 | RV64 | Mnemonic         | Instruction                                        |
| ---- | ---- | ---------------- | -------------------------------------------------- |
| ✓    | ✓    | orc.b _rd_, _rs_ | [Bitwise OR-Combine, byte granule](#insns-orc%5Fb) |

#### [](#30-1-3-8-byte-reverse)30.1.3.8\. Byte-reverse

**rev8** reverses the byte-ordering of _rs_.

| RV32 | RV64 | Mnemonic        | Instruction                          |
| ---- | ---- | --------------- | ------------------------------------ |
| ✓    | ✓    | rev8 _rd_, _rs_ | [Byte-reverse register](#insns-rev8) |

### [](#zbc)30.1.4\. Zbc: Extension for Carry-less multiplication, Version 1.0.0

Carry-less multiplication is the multiplication in the polynomial ring over GF(2).

**clmul** produces the lower half of the carry-less product and **clmulh** produces the upper half of the 2×XLEN carry-less product.

**clmulr** produces bits 2×XLEN−2:XLEN-1 of the 2×XLEN carry-less product.

| RV32 | RV64 | Mnemonic                  | Instruction                                      |
| ---- | ---- | ------------------------- | ------------------------------------------------ |
| ✓    | ✓    | clmul _rd_, _rs1_, _rs2_  | [Carry-less multiply (low-part)](#insns-clmul)   |
| ✓    | ✓    | clmulh _rd_, _rs1_, _rs2_ | [Carry-less multiply (high-part)](#insns-clmulh) |
| ✓    | ✓    | clmulr _rd_, _rs1_, _rs2_ | [Carry-less multiply (reversed)](#insns-clmulr)  |

### [](#zbs)30.1.5\. Zbs: Extension for Single-bit instructions, Version 1.0.0

The single-bit instructions provide a mechanism to set, clear, invert, or extract a single bit in a register. The bit is specified by its index.

| RV32 | RV64 | Mnemonic                 | Instruction                                    |
| ---- | ---- | ------------------------ | ---------------------------------------------- |
| ✓    | ✓    | bclr _rd_, _rs1_, _rs2_  | [Single-Bit Clear (Register)](#insns-bclr)     |
| ✓    | ✓    | bclri _rd_, _rs1_, _imm_ | [Single-Bit Clear (Immediate)](#insns-bclri)   |
| ✓    | ✓    | bext _rd_, _rs1_, _rs2_  | [Single-Bit Extract (Register)](#insns-bext)   |
| ✓    | ✓    | bexti _rd_, _rs1_, _imm_ | [Single-Bit Extract (Immediate)](#insns-bexti) |
| ✓    | ✓    | binv _rd_, _rs1_, _rs2_  | [Single-Bit Invert (Register)](#insns-binv)    |
| ✓    | ✓    | binvi _rd_, _rs1_, _imm_ | [Single-Bit Invert (Immediate)](#insns-binvi)  |
| ✓    | ✓    | bset _rd_, _rs1_, _rs2_  | [Single-Bit Set (Register)](#insns-bset)       |
| ✓    | ✓    | bseti _rd_, _rs1_, _imm_ | [Single-Bit Set (Immediate)](#insns-bseti)     |

### [](#zbkb)30.1.6\. Zbkb: Extension for Bit-manipulation for Cryptography, Version 1.0.0

This extension contains instructions essential for implementing common operations in cryptographic workloads.

| RV32 | RV64  | Mnemonic                                             | Instruction                                 |
| ---- | ----- | ---------------------------------------------------- | ------------------------------------------- |
| ✓    | ✓     | rol                                                  | [Rotate left (Register)](#insns-rol)        |
| ✓    | rolw  | [Rotate Left Word (Register)](#insns-rolw)           |                                             |
| ✓    | ✓     | ror                                                  | [Rotate right (Register)](#insns-ror)       |
| ✓    | ✓     | rori                                                 | [Rotate right (Immediate)](#insns-rori)     |
| ✓    | roriw | [Rotate right Word (Immediate)](#insns-roriw)        |                                             |
| ✓    | rorw  | [Rotate right Word (Register)](#insns-rorw)          |                                             |
| ✓    | ✓     | andn                                                 | [AND with inverted operand](#insns-andn)    |
| ✓    | ✓     | orn                                                  | [OR with inverted operand](#insns-orn)      |
| ✓    | ✓     | xnor                                                 | [Exclusive NOR](#insns-xnor)                |
| ✓    | ✓     | pack                                                 | [Pack low halves of registers](#insns-pack) |
| ✓    | ✓     | packh                                                | [Pack low bytes of registers](#insns-packh) |
| ✓    | packw | [Pack low 16-bits of registers (RV64)](#insns-packw) |                                             |
| ✓    | ✓     | brev8                                                | [Reverse bits in bytes](#insns-brev8)       |
| ✓    | ✓     | rev8                                                 | [Byte-reverse register](#insns-rev8)        |
| ✓    | zip   | [Bit interleave](#insns-zip)                         |                                             |
| ✓    | unzip | [Bit deinterleave](#insns-unzip)                     |                                             |

### [](#zbkc)30.1.7\. Zbkc: Extension for Carry-less multiplication for Cryptography, Version 1.0.0

Carry-less multiplication is the multiplication in the polynomial ring over GF(2). This is a critical operation in some cryptographic workloads, particularly the AES-GCM authenticated encryption scheme. This extension provides only the instructions needed to efficiently implement the GHASH operation, which is part of this workload.

| RV32 | RV64 | Mnemonic                  | Instruction                                      |
| ---- | ---- | ------------------------- | ------------------------------------------------ |
| ✓    | ✓    | clmul _rd_, _rs1_, _rs2_  | [Carry-less multiply (low-part)](#insns-clmul)   |
| ✓    | ✓    | clmulh _rd_, _rs1_, _rs2_ | [Carry-less multiply (high-part)](#insns-clmulh) |

### [](#zbkx)30.1.8\. Zbkx: Extension for Crossbar permutations, Version 1.0.0

These instructions implement a "lookup table" for 4 and 8 bit elements inside the general purpose registers. _rs1_ is used as a vector of N-bit words, and _rs2_ as a vector of N-bit indices into _rs1_.Elements in _rs1_ are replaced by the indexed element in _rs2_, or zero if the index into _rs2_ is out of bounds.

These instructions are useful for expressing N-bit to N-bit boolean operations, and implementing cryptographic code with secret dependent memory accesses (particularly SBoxes) such that the execution latency does not depend on the (secret) data being operated on.

| RV32 | RV64 | Mnemonic                  | Instruction                                     |
| ---- | ---- | ------------------------- | ----------------------------------------------- |
| ✓    | ✓    | xperm4 _rd_, _rs1_, _rs2_ | [Crossbar permutation (nibbles)](#insns-xperm4) |
| ✓    | ✓    | xperm8 _rd_, _rs1_, _rs2_ | [Crossbar permutation (bytes)](#insns-xperm8)   |

### [](#insns-b)30.1.9\. Instructions (in alphabetical order)

The semantics of each instruction is expressed in a SAIL-like syntax.

#### [](#insns-add%5Fuw)30.1.9.1\. add.uw

Synopsis

Add unsigned word

Mnemonic

add.uw _rd_, _rs1_, _rs2_

Pseudoinstructions

zext.w _rd_, _rs1_ → add.uw _rd_, _rs1_, zero

Encoding

![svg](_images/svg-d287b61d49587b4e48a65b5af64ced6314f31a10.svg) 

Description

This instruction performs an XLEN-wide addition between _rs2_ and the zero-extended least-significant word of _rs1_.

Operation

```sail
let base = X(rs2);
let index = EXTZ(X(rs1)[31..0]);

X(rd) = base + index;
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-andn)30.1.9.2\. andn

Synopsis

AND with inverted operand

Mnemonic

andn _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-5037e8d0227804a70953db7915f2b4e3c251a9cc.svg) 

Description

This instruction performs the bitwise logical AND operation between _rs1_ and the bitwise inversion of _rs2_.

Operation

```sail
X(rd) = X(rs1) & ~X(rs2);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | v1.0            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-bclr)30.1.9.3\. bclr

Synopsis

Single-Bit Clear (Register)

Mnemonic

bclr _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-5197c3695ea7f562541ba30a2c5d87f312caac90.svg) 

Description

This instruction returns _rs1_ with a single bit cleared at the index specified in _rs2_. The index is read from the lower log2(XLEN) bits of _rs2_.

Operation

```sail
let index = X(rs2) & (XLEN - 1);
X(rd) = X(rs1) & ~(1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-bclri)30.1.9.4\. bclri

Synopsis

Single-Bit Clear (Immediate)

Mnemonic

bclri _rd_, _rs1_, _shamt_

Encoding (RV32)

![svg](_images/svg-02e365d64002b0b09a8e4e574f7f4867993515a9.svg) 

Encoding (RV64)

![svg](_images/svg-60abd493e6ecf0fbdba20871f941562a0ef1cd82.svg) 

Description

This instruction returns _rs1_ with a single bit cleared at the index specified in _shamt_. The index is read from the lower log2(XLEN) bits of _shamt_.For RV32, the encodings corresponding to shamt\[5\]=1 are reserved.

Operation

```sail
let index = shamt & (XLEN - 1);
X(rd) = X(rs1) & ~(1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-bext)30.1.9.5\. bext

Synopsis

Single-Bit Extract (Register)

Mnemonic

bext _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-eac455dfc9194ec1ab1ac700352b0a3380b6e1e5.svg) 

Description

This instruction returns a single bit extracted from _rs1_ at the index specified in _rs2_. The index is read from the lower log2(XLEN) bits of _rs2_.

Operation

```sail
let index = X(rs2) & (XLEN - 1);
X(rd) = (X(rs1) >> index) & 1;
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-bexti)30.1.9.6\. bexti

Synopsis

Single-Bit Extract (Immediate)

Mnemonic

bexti _rd_, _rs1_, _shamt_

Encoding (RV32)

![svg](_images/svg-aae56a19005d8ff5b81c52a0de91cb7fe8a54f16.svg) 

Encoding (RV64)

![svg](_images/svg-ff66988e340a0a8c2c3ffffd34bca0f276608680.svg) 

Description

This instruction returns a single bit extracted from _rs1_ at the index specified in _shamt_. The index is read from the lower log2(XLEN) bits of _shamt_.For RV32, the encodings corresponding to shamt\[5\]=1 are reserved.

Operation

```sail
let index = shamt & (XLEN - 1);
X(rd) = (X(rs1) >> index) & 1;
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-binv)30.1.9.7\. binv

Synopsis

Single-Bit Invert (Register)

Mnemonic

binv _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-4ee6a1489b3bffc306382d215843de5b07320baa.svg) 

Description

This instruction returns _rs1_ with a single bit inverted at the index specified in _rs2_. The index is read from the lower log2(XLEN) bits of _rs2_.

Operation

```sail
let index = X(rs2) & (XLEN - 1);
X(rd) = X(rs1) ^ (1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-binvi)30.1.9.8\. binvi

Synopsis

Single-Bit Invert (Immediate)

Mnemonic

binvi _rd_, _rs1_, _shamt_

Encoding (RV32)

![svg](_images/svg-10d898da03c5334ffe8e910ac5b665e4f2dea43d.svg) 

Encoding (RV64)

![svg](_images/svg-4fdb41129dada3e8072fa7005628b28ec8ef38b3.svg) 

Description

This instruction returns _rs1_ with a single bit inverted at the index specified in _shamt_. The index is read from the lower log2(XLEN) bits of _shamt_.For RV32, the encodings corresponding to shamt\[5\]=1 are reserved.

Operation

```sail
let index = shamt & (XLEN - 1);
X(rd) = X(rs1) ^ (1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-bset)30.1.9.9\. bset

Synopsis

Single-Bit Set (Register)

Mnemonic

bset _rd_, _rs1_,_rs2_

Encoding

![svg](_images/svg-7a799a829a0a205064eba0d27f32b3090b832c2d.svg) 

Description

This instruction returns _rs1_ with a single bit set at the index specified in _rs2_. The index is read from the lower log2(XLEN) bits of _rs2_.

Operation

```sail
let index = X(rs2) & (XLEN - 1);
X(rd) = X(rs1) | (1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-bseti)30.1.9.10\. bseti

Synopsis

Single-Bit Set (Immediate)

Mnemonic

bseti _rd_, _rs1_,_shamt_

Encoding (RV32)

![svg](_images/svg-a3d3088a9efd3af4ca4a17cfa5f6ddd012677760.svg) 

Encoding (RV64)

![svg](_images/svg-bec3d17dc1959490b585b07d69a47629566c308e.svg) 

Description

This instruction returns _rs1_ with a single bit set at the index specified in _shamt_. The index is read from the lower log2(XLEN) bits of _shamt_.For RV32, the encodings corresponding to shamt\[5\]=1 are reserved.

Operation

```sail
let index = shamt & (XLEN - 1);
X(rd) = X(rs1) | (1 << index)
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbs ([Single-bit instructions](#zbs)) | v1.0            | Ratified        |

#### [](#insns-clmul)30.1.9.11\. clmul

Synopsis

Carry-less multiply (low-part)

Mnemonic

clmul _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-3ace2bb1d5afe94f7c9321cfdf1a432733accd80.svg) 

Description

clmul produces the lower half of the 2·XLEN carry-less product.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);
let output : xlenbits = 0;

foreach (i from 0 to (xlen - 1) by 1) {
   output = if   ((rs2_val >> i) & 1)
            then output ^ (rs1_val << i);
            else output;
}

X[rd] = output
```

Included in

| Extension                                                  | Minimum version | Lifecycle state |
| ---------------------------------------------------------- | --------------- | --------------- |
| Zbc ([Carry-less multiplication](#zbc))                    | v1.0            | Ratified        |
| Zbkc ([Carry-less multiplication for Cryptography](#zbkc)) | v1.0            | Ratified        |

#### [](#insns-clmulh)30.1.9.12\. clmulh

Synopsis

Carry-less multiply (high-part)

Mnemonic

clmulh _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-6107d0ddbb95c0228642e006d50cb857f98e58dc.svg) 

Description

clmulh produces the upper half of the 2·XLEN carry-less product.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);
let output : xlenbits = 0;

foreach (i from 1 to xlen by 1) {
   output = if   ((rs2_val >> i) & 1)
            then output ^ (rs1_val >> (xlen - i));
            else output;
}

X[rd] = output
```

Included in

| Extension                                                  | Minimum version | Lifecycle state |
| ---------------------------------------------------------- | --------------- | --------------- |
| Zbc ([Carry-less multiplication](#zbc))                    | v1.0            | Ratified        |
| Zbkc ([Carry-less multiplication for Cryptography](#zbkc)) | v1.0            | Ratified        |

#### [](#insns-clmulr)30.1.9.13\. clmulr

Synopsis

Carry-less multiply (reversed)

Mnemonic

clmulr _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-144588cb61ea0fafddd576505d53579b34200c32.svg) 

Description

**clmulr** produces bits 2·XLEN−2:XLEN-1 of the 2·XLEN carry-less product.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);
let output : xlenbits = 0;

foreach (i from 0 to (xlen - 1) by 1) {
   output = if   ((rs2_val >> i) & 1)
            then output ^ (rs1_val >> (xlen - i - 1));
            else output;
}

X[rd] = output
```

| |  Note The **clmulr** instruction is used to accelerate CRC calculations. The **r** in the instruction’s mnemonic stands for _reversed_, as the instruction is equivalent to bit-reversing the inputs, performing a **clmul**, then bit-reversing the output. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                               | Minimum version | Lifecycle state |
| --------------------------------------- | --------------- | --------------- |
| Zbc ([Carry-less multiplication](#zbc)) | v1.0            | Ratified        |

#### [](#insns-clz)30.1.9.14\. clz

Synopsis

Count leading zero bits

Mnemonic

clz _rd_, _rs_

Encoding

![svg](_images/svg-74030ddfa6239a384ea769fb82f1bf4f091436d5.svg) 

Description

This instruction counts the number of 0’s before the first 1, starting at the most-significant bit (i.e., XLEN-1) and progressing to bit 0\. Accordingly, if the input is 0, the output is XLEN, and if the most-significant bit of the input is a 1, the output is 0.

Operation

```sail
val HighestSetBit : forall ('N : Int), 'N >= 0. bits('N) -> int

function HighestSetBit x = {
  foreach (i from (xlen - 1) to 0 by 1 in dec)
    if [x[i]] == 0b1 then return(i) else ();
  return -1;
}

let rs = X(rs);
X[rd] = (xlen - 1) - HighestSetBit(rs);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-clzw)30.1.9.15\. clzw

Synopsis

Count leading zero bits in word

Mnemonic

clzw _rd_, _rs_

Encoding

![svg](_images/svg-0aea0581bd17e3cf1f173380258cfab612bf791d.svg) 

Description

This instruction counts the number of 0’s before the first 1 starting at bit 31 and progressing to bit 0\. Accordingly, if the least-significant word is 0, the output is 32, and if the most-significant bit of the word (i.e., bit 31) is a 1, the output is 0.

Operation

```sail
val HighestSetBit32 : forall ('N : Int), 'N >= 0. bits('N) -> int

function HighestSetBit32 x = {
  foreach (i from 31 to 0 by 1 in dec)
    if [x[i]] == 0b1 then return(i) else ();
  return -1;
}

let rs = X(rs);
X[rd] = 31 - HighestSetBit(rs);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-cpop)30.1.9.16\. cpop

Synopsis

Count set bits

Mnemonic

cpop _rd_, _rs_

Encoding

![svg](_images/svg-cb428f8069dcf4274666071bc4b3b0e248ca26b1.svg) 

Description

This instructions counts the number of 1’s (i.e., set bits) in the source register.

Operation

```sail
let bitcount = 0;
let rs = X(rs);

foreach (i from 0 to (xlen - 1) in inc)
    if rs[i] == 0b1 then bitcount = bitcount + 1 else ();

X[rd] = bitcount
```

| |  Software Hint This operation is known as population count, popcount, sideways sum, bit summation, or Hamming weight. The GCC builtin function \_\_builtin\_popcount (unsigned int x) is implemented by cpop on RV32 and by **cpopw** on RV64\. The GCC builtin function \_\_builtin\_popcountl (unsigned long x) for LP64 is implemented by **cpop** on RV64. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-cpopw)30.1.9.17\. cpopw

Synopsis

Count set bits in word

Mnemonic

cpopw _rd_, _rs_

Encoding

![svg](_images/svg-4c58e162882caadbe615b8e18eed769e33bdf658.svg) 

Description

This instructions counts the number of 1’s (i.e., set bits) in the least-significant word of the source register.

Operation

```sail
let bitcount = 0;
let val = X(rs);

foreach (i from 0 to 31 in inc)
    if val[i] == 0b1 then bitcount = bitcount + 1 else ();

X[rd] = bitcount
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-ctz)30.1.9.18\. ctz

Synopsis

Count trailing zeros

Mnemonic

ctz _rd_, _rs_

Encoding

![svg](_images/svg-793bdc506dbf49900ea89fdcac36f0204640a2eb.svg) 

Description

This instruction counts the number of 0’s before the first 1, starting at the least-significant bit (i.e., 0) and progressing to the most-significant bit (i.e., XLEN-1). Accordingly, if the input is 0, the output is XLEN, and if the least-significant bit of the input is a 1, the output is 0.

Operation

```sail
val LowestSetBit : forall ('N : Int), 'N >= 0. bits('N) -> int

function LowestSetBit x = {
  foreach (i from 0 to (xlen - 1) by 1 in dec)
    if [x[i]] == 0b1 then return(i) else ();
  return xlen;
}

let rs = X(rs);
X[rd] = LowestSetBit(rs);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-ctzw)30.1.9.19\. ctzw

Synopsis

Count trailing zero bits in word

Mnemonic

ctzw _rd_, _rs_

Encoding

![svg](_images/svg-524a4a04bbad27bc4eb2fb1e5c9513fa66012e9d.svg) 

Description

This instruction counts the number of 0’s before the first 1, starting at the least-significant bit (i.e., 0) and progressing to the most-significant bit of the least-significant word (i.e., 31). Accordingly, if the least-significant word is 0, the output is 32, and if the least-significant bit of the input is a 1, the output is 0.

Operation

```sail
val LowestSetBit32 : forall ('N : Int), 'N >= 0. bits('N) -> int

function LowestSetBit32 x = {
  foreach (i from 0 to 31 by 1 in dec)
    if [x[i]] == 0b1 then return(i) else ();
  return 32;
}

let rs = X(rs);
X[rd] = LowestSetBit32(rs);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-max)30.1.9.20\. max

Synopsis

Maximum

Mnemonic

max _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-f1d739999eabb70b93d031b92db63ec5d8b15539.svg) 

Description

This instruction returns the larger of two signed integers.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);

let result = if   rs1_val <_s rs2_val
             then rs2_val
             else rs1_val;

X(rd) = result;
```

| |  Software Hint Calculating the absolute value of a signed integer can be performed using the following sequence: **neg rD,rS** followed by **max rD,rS,rD**. When using this common sequence, it is suggested that they are scheduled with no intervening instructions so that implementations that are so optimized can fuse them together. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-maxu)30.1.9.21\. maxu

Synopsis

Unsigned maximum

Mnemonic

maxu _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-28dee91738ed95baa119cf39a15c943c321f50f0.svg) 

Description

This instruction returns the larger of two unsigned integers.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);

let result = if   rs1_val <_u rs2_val
             then rs2_val
             else rs1_val;

X(rd) = result;
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-min)30.1.9.22\. min

Synopsis

Minimum

Mnemonic

min _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-41d337c1029a029a12826c7ef84acd8aad3ed2d0.svg) 

Description

This instruction returns the smaller of two signed integers.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);

let result = if   rs1_val <_s rs2_val
             then rs1_val
             else rs2_val;

X(rd) = result;
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-minu)30.1.9.23\. minu

Synopsis

Unsigned minimum

Mnemonic

minu _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-6b03b98209913a0a84285f4eea463be01afba503.svg) 

Description

This instruction returns the smaller of two unsigned integers.

Operation

```sail
let rs1_val = X(rs1);
let rs2_val = X(rs2);

let result = if   rs1_val <_u rs2_val
             then rs1_val
             else rs2_val;

X(rd) = result;
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-orc%5Fb)30.1.9.24\. orc.b

Synopsis

Bitwise OR-Combine, byte granule

Mnemonic

orc.b _rd_, _rs_

Encoding

![svg](_images/svg-8c20e009ae27789fbd745fb19b8c3a1861c24b26.svg) 

Description

Combines the bits within each byte using bitwise logical OR. This sets the bits of each byte in the result _rd_ to all zeros if no bit within the respective byte of _rs_ is set, or to all ones if any bit within the respective byte of _rs_ is set.

Operation

```sail
let input = X(rs);
let output : xlenbits = 0;

foreach (i from 0 to (xlen - 8) by 8) {
   output[(i + 7)..i] = if   input[(i + 7)..i] == 0
                        then 0b00000000
                        else 0b11111111;
}

X[rd] = output;
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | v1.0            | Ratified        |

#### [](#insns-orn)30.1.9.25\. orn

Synopsis

OR with inverted operand

Mnemonic

orn _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-cd2eb5051fd881d76177c58af39944f79a35e27a.svg) 

Description

This instruction performs the bitwise logical OR operation between _rs1_ and the bitwise inversion of _rs2_.

Operation

```sail
X(rd) = X(rs1) | ~X(rs2);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | v1.0            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-pack)30.1.9.26\. pack

Synopsis

Pack the low halves of _rs1_ and _rs2_ into _rd_.

Mnemonic

pack _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-3b154237dc0d0a29f3ee4a786ba979924f77f0a0.svg) 

Description

The pack instruction packs the XLEN/2-bit lower halves of _rs1_ and _rs2_ into_rd_, with _rs1_ in the lower half and _rs2_ in the upper half.

Operation

```sail
let lo_half : bits(xlen/2) = X(rs1)[xlen/2-1..0];
let hi_half : bits(xlen/2) = X(rs2)[xlen/2-1..0];
X(rd) = EXTZ(hi_half @ lo_half);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

| |  For RV32, the pack instruction with _rs2_\=x0 is the zext.hinstruction. Hence, for RV32, any extension that contains the pack instruction also contains the zext.h instruction (but not necessarily the c.zext.hinstruction, which is only guaranteed to exist if both the Zcb and Zbb extensions are implemented). |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#insns-packh)30.1.9.27\. packh

Synopsis

Pack the low bytes of _rs1_ and _rs2_ into _rd_.

Mnemonic

packh _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-de742e02dd64298507cef284a266492885bc7eb3.svg) 

Description

The packh instruction packs the least-significant bytes of_rs1_ and _rs2_ into the 16 least-significant bits of _rd_, zero extending the rest of _rd_.

Operation

```sail
let lo_half : bits(8) = X(rs1)[7..0];
let hi_half : bits(8) = X(rs2)[7..0];
X(rd) = EXTZ(hi_half @ lo_half);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-packw)30.1.9.28\. packw

Synopsis

Pack the low 16-bits of _rs1_ and _rs2_ into _rd_ on RV64.

Mnemonic

packw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-c62d518868337ac528c94ddef4360d218992288c.svg) 

Description

This instruction packs the low 16 bits of_rs1_ and _rs2_ into the 32 least-significant bits of _rd_, sign extending the 32-bit result to the rest of _rd_. This instruction only exists on RV64 based systems.

Operation

```sail
let lo_half : bits(16) = X(rs1)[15..0];
let hi_half : bits(16) = X(rs2)[15..0];
X(rd) = EXTS(hi_half @ lo_half);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

| |  For RV64, the packw instruction with _rs2_\=x0 is the zext.hinstruction. Hence, for RV64, any extension that contains the packw instruction also contains the zext.h instruction (but not necessarily the c.zext.hinstruction, which is only guaranteed to exist if both the Zcb and Zbb extensions are implemented). |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

#### [](#insns-rev8)30.1.9.29\. rev8

Synopsis

Byte-reverse register

Mnemonic

rev8 _rd_, _rs_

Encoding (RV32)

![svg](_images/svg-693d173289db88cf4b8d29c9a4c08f5ecbe7f7e2.svg) 

Encoding (RV64)

![svg](_images/svg-6d52ea2a08d942672651db671ee4dca698d0b929.svg) 

Description

This instruction reverses the order of the bytes in _rs_.

Operation

```sail
let input = X(rs);
let output : xlenbits = 0;
let j = xlen - 1;

foreach (i from 0 to (xlen - 8) by 8) {
   output[i..(i + 7)] = input[(j - 7)..j];
   j = j - 8;
}

X[rd] = output
```

| |  Note The **rev8** mnemonic corresponds to different instruction encodings in RV32 and RV64. |
| ---------------------------------------------------------------------------------------------- |

| |  Software Hint The byte-reverse operation is only available for the full register width. To emulate word-sized and halfword-sized byte-reversal, perform a rev8 rd,rs followed by a srai rd,rd,K, where K is XLEN-32 and XLEN-16, respectively. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | v1.0            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-brev8)30.1.9.30\. brev8

Synopsis

Reverse the bits in each byte of a source register.

Mnemonic

brev8 _rd_, _rs_

Encoding

![svg](_images/svg-2fb21fe817b13f00b3265dee5e0d3eb405943c35.svg) 

Description

This instruction reverses the order of the bits in every byte of a register.

Operation

```sail
result : xlenbits = EXTZ(0b0);
foreach (i from 0 to sizeof(xlen) by 8) {
    result[i+7..i] = reverse_bits_in_byte(X(rs1)[i+7..i]);
};
X(rd) = result;
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-rol)30.1.9.31\. rol

Synopsis

Rotate Left (Register)

Mnemonic

rol _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-0add38b10235680259e9ea3ba4b471b26a942d2d.svg) 

Description

This instruction performs a rotate left of _rs1_ by the amount in least-significant log2(XLEN) bits of _rs2_.

Operation

```sail
let shamt = if   xlen == 32
            then X(rs2)[4..0]
            else X(rs2)[5..0];
let result = (X(rs1) << shamt) | (X(rs1) >> (xlen - shamt));

X(rd) = result;
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-rolw)30.1.9.32\. rolw

Synopsis

Rotate Left Word (Register)

Mnemonic

rolw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-f5b062418b2d8410926587fb72cd6fc0123e75e9.svg) 

Description

This instruction performs a rotate left on the least-significant word of _rs1_ by the amount in least-significant 5 bits of _rs2_. The resulting word value is sign-extended by copying bit 31 to all of the more-significant bits.

Operation

```sail
let rs1 = EXTZ(X(rs1)[31..0])
let shamt = X(rs2)[4..0];
let result = (rs1 << shamt) | (rs1 >> (32 - shamt));
X(rd) = EXTS(result[31..0]);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-ror)30.1.9.33\. ror

Synopsis

Rotate Right

Mnemonic

ror _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-30fb690178dfc1807bfbaadb3e95c705c92708a3.svg) 

Description

This instruction performs a rotate right of _rs1_ by the amount in least-significant log2(XLEN) bits of _rs2_.

Operation

```sail
let shamt = if   xlen == 32
            then X(rs2)[4..0]
            else X(rs2)[5..0];
let result = (X(rs1) >> shamt) | (X(rs1) << (xlen - shamt));

X(rd) = result;
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-rori)30.1.9.34\. rori

Synopsis

Rotate Right (Immediate)

Mnemonic

rori _rd_, _rs1_, _shamt_

Encoding (RV32)

![svg](_images/svg-938fcfa9f20d5623c60b26ec22337b55fe5692e6.svg) 

Encoding (RV64)

![svg](_images/svg-56357a7bc26ad075b2aa68de3ae2db30bc1d104d.svg) 

Description

This instruction performs a rotate right of _rs1_ by the amount in the least-significant log2(XLEN) bits of _shamt_. For RV32, the encodings corresponding to shamt\[5\]=1 are reserved.

Operation

```sail
let shamt = if   xlen == 32
            then shamt[4..0]
            else shamt[5..0];
let result = (X(rs1) >> shamt) | (X(rs1) << (xlen - shamt));

X(rd) = result;
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-roriw)30.1.9.35\. roriw

Synopsis

Rotate Right Word by Immediate

Mnemonic

roriw _rd_, _rs1_, _shamt_

Encoding

![svg](_images/svg-ade4a28eb2f571fc50a9a5567dbd7991a3b05a4c.svg) 

Description

This instruction performs a rotate right on the least-significant word of _rs1_ by the amount in the least-significant log2(XLEN) bits of_shamt_. The resulting word value is sign-extended by copying bit 31 to all of the more-significant bits.

Operation

```sail
let rs1_data = EXTZ(X(rs1)[31..0];
let result = (rs1_data >> shamt) | (rs1_data << (32 - shamt));
X(rd) = EXTS(result[31..0]);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-rorw)30.1.9.36\. rorw

Synopsis

Rotate Right Word (Register)

Mnemonic

rorw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-565fec38b77826e629c17d1e46d0048fef634910.svg) 

Description

This instruction performs a rotate right on the least-significant word of _rs1_ by the amount in least-significant 5 bits of _rs2_. The resultant word is sign-extended by copying bit 31 to all of the more-significant bits.

Operation

```sail
let rs1 = EXTZ(X(rs1)[31..0])
let shamt = X(rs2)[4..0];
let result = (rs1 >> shamt) | (rs1 << (32 - shamt));
X(rd) = EXTS(result);
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-sext%5Fb)30.1.9.37\. sext.b

Synopsis

Sign-extend byte

Mnemonic

sext.b _rd_, _rs_

Encoding

![svg](_images/svg-56c0f8cb67ef8494715fe3ea758045779c1200ee.svg) 

Description

This instruction sign-extends the least-significant byte in the source to XLEN by copying the most-significant bit in the byte (i.e., bit 7) to all of the more-significant bits.

Operation

```sail
X(rd) = EXTS(X(rs)[7..0]);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | 0.93            | Ratified        |

#### [](#insns-sext%5Fh)30.1.9.38\. sext.h

Synopsis

Sign-extend halfword

Mnemonic

sext.h _rd_, _rs_

Encoding

![svg](_images/svg-884d6d756b0420aeed820f45382fcf146f477843.svg) 

Description

This instruction sign-extends the least-significant halfword in _rs_ to XLEN by copying the most-significant bit in the halfword (i.e., bit 15) to all of the more-significant bits.

Operation

```sail
X(rd) = EXTS(X(rs)[15..0]);
```

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | 0.93            | Ratified        |

#### [](#insns-sh1add)30.1.9.39\. sh1add

Synopsis

Shift left by 1 and add

Mnemonic

sh1add _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-3496adff925a90289b3082d858eab871a9416314.svg) 

Description

This instruction shifts _rs1_ to the left by 1 bit and adds it to _rs2_.

Operation

```sail
X(rd) = X(rs2) + (X(rs1) << 1);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-sh1add%5Fuw)30.1.9.40\. sh1add.uw

Synopsis

Shift unsigned word left by 1 and add

Mnemonic

sh1add.uw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-f9219bafb82a7a4d365baa0fad2f815136e8f694.svg) 

Description

This instruction performs an XLEN-wide addition of two addends. The first addend is _rs2_. The second addend is the unsigned value formed by extracting the least-significant word of _rs1_ and shifting it left by 1 place.

Operation

```sail
let base = X(rs2);
let index = EXTZ(X(rs1)[31..0]);

X(rd) = base + (index << 1);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-sh2add)30.1.9.41\. sh2add

Synopsis

Shift left by 2 and add

Mnemonic

sh2add _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-f1b34ee72bee682b8ca55d8014eb2202ecd616de.svg) 

Description

This instruction shifts _rs1_ to the left by 2 places and adds it to _rs2_.

Operation

```sail
X(rd) = X(rs2) + (X(rs1) << 2);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-sh2add%5Fuw)30.1.9.42\. sh2add.uw

Synopsis

Shift unsigned word left by 2 and add

Mnemonic

sh2add.uw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-5b7ae400d369bca899be827cd16283e0630e9a4f.svg) 

Description

This instruction performs an XLEN-wide addition of two addends. The first addend is _rs2_. The second addend is the unsigned value formed by extracting the least-significant word of _rs1_ and shifting it left by 2 places.

Operation

```sail
let base = X(rs2);
let index = EXTZ(X(rs1)[31..0]);

X(rd) = base + (index << 2);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-sh3add)30.1.9.43\. sh3add

Synopsis

Shift left by 3 and add

Mnemonic

sh3add _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-cae18020bb7c0c1b2b48a043f53e54400ea2254e.svg) 

Description

This instruction shifts _rs1_ to the left by 3 places and adds it to _rs2_.

Operation

```sail
X(rd) = X(rs2) + (X(rs1) << 3);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-sh3add%5Fuw)30.1.9.44\. sh3add.uw

Synopsis

Shift unsigned word left by 3 and add

Mnemonic

sh3add.uw _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-02a948fc567e1c58dad47667f66a51358b33154f.svg) 

Description

This instruction performs an XLEN-wide addition of two addends. The first addend is _rs2_. The second addend is the unsigned value formed by extracting the least-significant word of _rs1_ and shifting it left by 3 places.

Operation

```sail
let base = X(rs2);
let index = EXTZ(X(rs1)[31..0]);

X(rd) = base + (index << 3);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

#### [](#insns-slli%5Fuw)30.1.9.45\. slli.uw

Synopsis

Shift-left unsigned word (Immediate)

Mnemonic

slli.uw _rd_, _rs1_, _shamt_

Encoding

![svg](_images/svg-b962d32860639dddda8ba396d0f05c7274aac470.svg) 

Description

This instruction takes the least-significant word of _rs1_, zero-extends it, and shifts it left by the immediate.

Operation

```sail
X(rd) = (EXTZ(X(rs)[31..0]) << shamt);
```

Included in

| Extension                                     | Minimum version | Lifecycle state |
| --------------------------------------------- | --------------- | --------------- |
| Zba ([Address generation instructions](#zba)) | 0.93            | Ratified        |

| |  Architecture Explanation This instruction is the same as **slli** with **zext.w** performed on _rs1_ before shifting. |
| ------------------------------------------------------------------------------------------------------------------------ |

#### [](#insns-unzip)30.1.9.46\. unzip

Synopsis

Place odd and even bits of the source register into upper and lower halves of the destination register, respectively.

Mnemonic

unzip _rd_, _rs_

Encoding

![svg](_images/svg-021809b893e360d56ec1ac2e1a07b74fe181b9bb.svg) 

Description

This instruction scatters all of the odd and even bits of a source word into the high and low halves of a destination word. It is the inverse of the [zip](scalar-crypto.html#insns-zip-sc) instruction. This instruction is available only on RV32.

Operation

```sail
foreach (i from 0 to xlen/2-1) {
  X(rd)[i] = X(rs1)[2*i]
  X(rd)[i+xlen/2] = X(rs1)[2*i+1]
}
```

| |  Software Hint This instruction is useful for implementing the SHA3 cryptographic hash function on a 32-bit architecture, as it implements the bit-interleaving operation used to speed up the 64-bit rotations directly. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                                                | Minimum version | Lifecycle state |
| -------------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) (RV32) | v1.0            | Ratified        |

#### [](#insns-xnor)30.1.9.47\. xnor

Synopsis

Exclusive NOR

Mnemonic

xnor _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-69198fb0cd20a10e882917a7e04916117cbc5945.svg) 

Description

This instruction performs the bit-wise exclusive-NOR operation on _rs1_ and _rs2_.

Operation

```sail
X(rd) = ~(X(rs1) ^ X(rs2));
```

Included in

| Extension                                         | Minimum version | Lifecycle state |
| ------------------------------------------------- | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb))              | 0.93            | Ratified        |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) | v1.0            | Ratified        |

#### [](#insns-xperm8)30.1.9.48\. xperm8

Synopsis

Byte-wise lookup of indices into a vector in registers.

Mnemonic

xperm8 _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-6425b4a7e06c2628490e17ec51384fe9ff6ee36b.svg) 

Description

The xperm8 instruction operates on bytes. The _rs1_ register contains a vector of XLEN/8 8-bit elements. The _rs2_ register contains a vector of XLEN/8 8-bit indexes. The result is each element in _rs2_ replaced by the indexed element in _rs1_, or zero if the index into _rs2_ is out of bounds.

Operation

```sail
val xperm8_lookup : (bits(8), xlenbits) -> bits(8)
function xperm8_lookup (idx, lut) = {
    (lut >> (idx @ 0b000))[7..0]
}

function clause execute ( XPERM8 (rs2,rs1,rd)) = {
    result : xlenbits = EXTZ(0b0);
    foreach(i from 0 to xlen by 8) {
        result[i+7..i] = xperm8_lookup(X(rs2)[i+7..i], X(rs1));
    };
    X(rd) = result;
    RETIRE_SUCCESS
}
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbkx ([Crossbar permutations](#zbkx)) | v1.0            | Ratified        |

#### [](#insns-xperm4)30.1.9.49\. xperm4

Synopsis

Nibble-wise lookup of indices into a vector.

Mnemonic

xperm4 _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-e633638e4cd9d0c4bfb0a8b0eb4925c256cf5c8f.svg) 

Description

The xperm4 instruction operates on nibbles. The _rs1_ register contains a vector of XLEN/4 4-bit elements. The _rs2_ register contains a vector of XLEN/4 4-bit indexes. The result is each element in _rs2_ replaced by the indexed element in _rs1_, or zero if the index into _rs2_ is out of bounds.

Operation

```sail
val xperm4_lookup : (bits(4), xlenbits) -> bits(4)
function xperm4_lookup (idx, lut) = {
    (lut >> (idx @ 0b00))[3..0]
}

function clause execute ( XPERM4 (rs2,rs1,rd)) = {
    result : xlenbits = EXTZ(0b0);
    foreach(i from 0 to xlen by 4) {
        result[i+3..i] = xperm4_lookup(X(rs2)[i+3..i], X(rs1));
    };
    X(rd) = result;
    RETIRE_SUCCESS
}
```

Included in

| Extension                             | Minimum version | Lifecycle state |
| ------------------------------------- | --------------- | --------------- |
| Zbkx ([Crossbar permutations](#zbkx)) | v1.0            | Ratified        |

#### [](#insns-zext%5Fh)30.1.9.50\. zext.h

Synopsis

Zero-extend halfword

Mnemonic

zext.h _rd_, _rs_

Encoding (RV32)

![svg](_images/svg-e5193b2f300435576a16ceede38c54a2c68bb137.svg) 

Encoding (RV64)

![svg](_images/svg-a131c95e966566e7eb5c42ee69de1512cbeb3255.svg) 

Description

This instruction zero-extends the least-significant halfword of the source to XLEN by inserting 0’s into all of the bits more significant than 15.

Operation

```sail
X(rd) = EXTZ(X(rs)[15..0]);
```

| |  Note The **zext.h** mnemonic corresponds to different instruction encodings in RV32 and RV64. |
| ------------------------------------------------------------------------------------------------ |

Included in

| Extension                            | Minimum version | Lifecycle state |
| ------------------------------------ | --------------- | --------------- |
| Zbb ([Basic bit-manipulation](#zbb)) | 0.93            | Ratified        |

#### [](#insns-zip)30.1.9.51\. zip

Synopsis

Interleave upper and lower halves of the source register into odd and even bits of the destination register, respectively.

Mnemonic

zip _rd_, _rs_

Encoding

![svg](_images/svg-a9c5f3131819c935d2e569aa509a89770202a0d0.svg) 

Description

This instruction gathers bits from the high and low halves of the source word into odd/even bit positions in the destination word. It is the inverse of the [unzip](scalar-crypto.html#insns-unzip-sc) instruction. This instruction is available only on RV32.

Operation

```sail
foreach (i from 0 to xlen/2-1) {
  X(rd)[2*i] = X(rs1)[i]
  X(rd)[2*i+1] = X(rs1)[i+xlen/2]
}
```

| |  Software Hint This instruction is useful for implementing the SHA3 cryptographic hash function on a 32-bit architecture, as it implements the bit-interleaving operation used to speed up the 64-bit rotations directly. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Included in

| Extension                                                | Minimum version | Lifecycle state |
| -------------------------------------------------------- | --------------- | --------------- |
| Zbkb ([Bit-manipulation for Cryptography](#zbkb)) (RV32) | v1.0            | Ratified        |
