# 23.1. "Q" Extension for Quad-Precision Floating-Point, Version 2.2

## [](#23-1-q-extension-for-quad-precision-floating-point-version-2-2)23.1\. "Q" Extension for Quad-Precision Floating-Point, Version 2.2

This chapter describes the Q standard extension for 128-bit quad-precision binary floating-point instructions compliant with the IEEE 754-2008 arithmetic standard. The quad-precision binary floating-point instruction-set extension is named "Q"; it depends on the double-precision floating-point extension D. The floating-point registers are now extended to hold either a single, double, or quad-precision floating-point value (FLEN=128). The NaN-boxing scheme described in [NaN Boxing of Narrower Values](d-st-ext.html#nanboxing) is now extended recursively to allow a single-precision value to be NaN-boxed inside a double-precision value which is itself NaN-boxed inside a quad-precision value.

### [](#23-1-1-quad-precision-load-and-store-instructions)23.1.1\. Quad-Precision Load and Store Instructions

New 128-bit variants of LOAD-FP and STORE-FP instructions are added, encoded with a new value for the funct3 width field.

![svg](_images/svg-2a16e859bb5c0fca32e52b3b4f44d98f3e6caa3d.svg) 

![svg](_images/svg-2b334c20b68f921d79e5e277822a6e133384456d.svg) 

FLQ and FSQ are only guaranteed to execute atomically if the effective address is naturally aligned and XLEN=128.

FLQ and FSQ do not modify the bits being transferred; in particular, the payloads of non-canonical NaNs are preserved.

### [](#23-1-2-quad-precision-computational-instructions)23.1.2\. Quad-Precision Computational Instructions

A new supported format is added to the format field of most instructions, as shown in [Table 1](#fpextfmt)

__Table 1\. Format field encoding.__
| _fmt_ field | Mnemonic | Meaning                 |
| ----------- | -------- | ----------------------- |
| 00          | S        | 32-bit single-precision |
| 01          | D        | 64-bit double-precision |
| 10          | H        | 16-bit half-precision   |
| 11          | Q        | 128-bit quad-precision  |

The quad-precision floating-point computational instructions are defined analogously to their double-precision counterparts, but operate on quad-precision operands and produce quad-precision results.

![svg](_images/svg-1a95a7294abe66b7b5523af0b0b2943db84a86bb.svg) 

![svg](_images/svg-eaca638bb8b9f77d2f3d6ef3e1b39c19dc76c841.svg) 

### [](#quad-compute)23.1.3\. Quad-Precision Convert and Move Instructions

New floating-point-to-integer and integer-to-floating-point conversion instructions are added. These instructions are defined analogously to the double-precision-to-integer and integer-to-double-precision conversion instructions. FCVT.W.Q or FCVT.L.Q converts a quad-precision floating-point number to a signed 32-bit or 64-bit integer, respectively. FCVT.Q.W or FCVT.Q.L converts a 32-bit or 64-bit signed integer, respectively, into a quad-precision floating-point number.FCVT.WU.Q, FCVT.LU.Q, FCVT.Q.WU, and FCVT.Q.LU variants convert to or from unsigned integer values. FCVT.L\[U\].Q and FCVT.Q.L\[U\] are RV64-only instructions. Note FCVT.Q.L\[U\] always produces an exact result and is unaffected by rounding mode.

![svg](_images/svg-d88b4219a55f29d8ac2ed938270389bc162dd354.svg) 

New floating-point-to-floating-point conversion instructions are added. These instructions are defined analogously to the double-precision floating-point-to-floating-point conversion instructions. FCVT.S.Q or FCVT.Q.S converts a quad-precision floating-point number to a single-precision floating-point number, or vice-versa, respectively.FCVT.D.Q or FCVT.Q.D converts a quad-precision floating-point number to a double-precision floating-point number, or vice-versa, respectively.

![svg](_images/svg-4653d8c6b12c99eaa852fa93984e16156f5c3f31.svg) 

Floating-point to floating-point sign-injection instructions, FSGNJ.Q, FSGNJN.Q, and FSGNJX.Q are defined analogously to the double-precision sign-injection instruction.

![svg](_images/svg-14b1c2fe50e599c8139fe51f78dc16a9c60fdfca.svg) 

FMV.X.Q and FMV.Q.X instructions are not provided in RV32 or RV64, so quad-precision bit patterns must be moved to the integer registers via memory.

### [](#23-1-4-quad-precision-floating-point-compare-instructions)23.1.4\. Quad-Precision Floating-Point Compare Instructions

The quad-precision floating-point compare instructions are defined analogously to their double-precision counterparts, but operate on quad-precision operands.

![svg](_images/svg-a4cc3c2f3b5bb151c91158a3df3a779fa63bdbdb.svg) 

### [](#quad-float-compare)23.1.5\. Quad-Precision Floating-Point Classify Instruction

The quad-precision floating-point classify instruction, FCLASS.Q, is defined analogously to its double-precision counterpart, but operates on quad-precision operands.

![svg](_images/svg-0fbdc9079ae6482318595fb8e617b3c7f19cbd69.svg) 
