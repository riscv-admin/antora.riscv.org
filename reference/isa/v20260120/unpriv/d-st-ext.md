# 22.1. "D" Extension for Double-Precision Floating-Point, Version 2.2

## [](#22-1-d-extension-for-double-precision-floating-point-version-2-2)22.1\. "D" Extension for Double-Precision Floating-Point, Version 2.2

This chapter describes the standard double-precision floating-point instruction-set extension, which is named "D" and adds double-precision floating-point computational instructions compliant with the IEEE 754-2008 arithmetic standard. The D extension depends on the base single-precision instruction subset F.

### [](#22-1-1-d-register-state)22.1.1\. D Register State

The D extension widens the 32 floating-point registers, `f0-f31`, to 64 bits (FLEN=64 in [RISC-V standard F extension single-precision floating-point state](f-st-ext.html#fprs). The `f` registers can now hold either 32-bit or 64-bit floating-point values as described below in [22.1.2\. NaN Boxing of Narrower Values](#nanboxing).

| |  FLEN can be 32, 64, or 128 depending on which of the F, D, and Q extensions are supported. There can be up to four different floating-point precisions supported, including H, F, D, and Q. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#nanboxing)22.1.2\. NaN Boxing of Narrower Values

When multiple floating-point precisions are supported, then valid values of narrower _n_\-bit types, _n_<FLEN, are represented in the lower _n_ bits of an FLEN-bit NaN value, in a process termed NaN-boxing. The upper bits of a valid NaN-boxed value must be all 1s. Valid NaN-boxed _n_\-bit values therefore appear as negative quiet NaNs (qNaNs) when viewed as any wider_m_\-bit value, _n_ < _m_ ≤ FLEN. Any operation that writes a narrower result to an 'f' register must write all 1s to the uppermost FLEN-_n_ bits to yield a legal NaN-boxedvalue.

| |  Software might not know the current type of data stored in a floating-point register but has to be able to save and restore the register values, hence the result of using wider operations to transfer narrower values has to be defined. A common case is for callee-saved registers, but a standard convention is also desirable for features including variadic functions, user-level threading libraries, virtual machine migration, and debugging. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Floating-point _n_\-bit transfer operations move external values held in IEEE standard formats into and out of the `f` registers, and comprise floating-point loads and stores (FL_n_/FS_n_) and floating-point move instructions (FMV._n_.X/FMV.X._n_). A narrower _n_\-bit transfer, _n_<FLEN, into the `f` registers will create a valid NaN-boxed value. A narrower_n_\-bit transfer out of the floating-point registers will transfer the lower _n_ bits of the register ignoring the upper FLEN-_n_ bits.

Apart from transfer operations described in the previous paragraph, all other floating-point operations on narrower _n_\-bit operations, _n_<FLEN, check if the input operands are correctly NaN-boxed, i.e., all upper FLEN-_n_ bits are 1\. If so, the _n_ least-significant bits of the input are used as the input value, otherwise the input value is treated as an_n_\-bit canonical NaN.

| |  Earlier versions of this document did not define the behavior of feeding the results of narrower or wider operands into an operation, except to require that wider saves and restores would preserve the value of a narrower operand. The new definition removes this implementation-specific behavior, while still accommodating both non-recoded and recoded implementations of the floating-point unit. The new definition also helps catch software errors by propagating NaNs if values are used incorrectly. Non-recoded implementations unpack and pack the operands to IEEE standard format on the input and output of every floating-point operation. The NaN-boxing cost to a non-recoded implementation is primarily in checking if the upper bits of a narrower operation represent a legal NaN-boxed value, and in writing all 1s to the upper bits of a result. Recoded implementations use a more convenient internal format to represent floating-point values, with an added exponent bit to allow all values to be held normalized. The cost to the recoded implementation is primarily the extra tagging needed to track the internal types and sign bits, but this can be done without adding new state bits by recoding NaNs internally in the exponent field. Small modifications are needed to the pipelines used to transfer values in and out of the recoded format, but the datapath and latency costs are minimal. The recoding process has to handle shifting of input subnormal values for wide operands in any case, and extracting the NaN-boxed value is a similar process to normalization except for skipping over leading-1 bits instead of skipping over leading-0 bits, allowing the datapath multiplexing to be shared. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#fld%5Ffsd)22.1.3\. Double-Precision Load and Store Instructions

The FLD instruction loads a double-precision floating-point value from memory into floating-point register _rd_. FSD stores a double-precision value from the floating-point registers to memory.

| |  The double-precision value may be a NaN-boxed single-precision value. |
| ------------------------------------------------------------------------ |

![svg](_images/svg-d4ffa908465b22f19a933707f37b735f0d0bfd0a.svg) 

![svg](_images/svg-656c89be04c06a5dfe06fd44adc21c89334990dc.svg) 

FLD and FSD are only guaranteed to execute atomically if the effective address is naturally aligned and XLEN≥64.

FLD and FSD do not modify the bits being transferred; in particular, the payloads of non-canonical NaNs are preserved.

### [](#22-1-4-double-precision-floating-point-computational-instructions)22.1.4\. Double-Precision Floating-Point Computational Instructions

The double-precision floating-point computational instructions are defined analogously to their single-precision counterparts, but operate on double-precision operands and produce double-precision results.

![svg](_images/svg-142775b31975f01a76690e3e4218f8c9b9daf1fb.svg) 

![svg](_images/svg-c3655833ba7f784bee67a3bb24e228e9516b781e.svg) 

### [](#fl-compute)22.1.5\. Double-Precision Floating-Point Conversion and Move Instructions

Floating-point-to-integer and integer-to-floating-point conversion instructions are encoded in the OP-FP major opcode space. FCVT.W.D or FCVT.L.D converts a double-precision floating-point number in floating-point register _rs1_ to a signed 32-bit or 64-bit integer, respectively, in integer register _rd_. FCVT.D.W or FCVT.D.L converts a 32-bit or 64-bit signed integer, respectively, in integer register _rs1_into a double-precision floating-point number in floating-point register_rd_. FCVT.WU.D, FCVT.LU.D, FCVT.D.WU, and FCVT.D.LU variants convert to or from unsigned integer values. For RV64, FCVT.W\[U\].D sign-extends the 32-bit result. FCVT.L\[U\].D and FCVT.D.L\[U\] are RV64-only instructions. The range of valid inputs for FCVT._int_.D and the behavior for invalid inputs are the same as for FCVT._int_.S.

All floating-point to integer and integer to floating-point conversion instructions round according to the _rm_ field. Note FCVT.D.W\[U\] always produces an exact result and is unaffected by rounding mode.

![svg](_images/svg-5343b5568f8ac26ec76f528f044d1a877ceda072.svg) 

The double-precision to single-precision and single-precision to double-precision conversion instructions, FCVT.S.D and FCVT.D.S, are encoded in the OP-FP major opcode space and both the source and destination are floating-point registers. The _rs2_ field encodes the datatype of the source, and the _fmt_ field encodes the datatype of the destination. FCVT.S.D rounds according to the RM field; FCVT.D.S will never round.

![svg](_images/svg-cd8d03339c8bc8758718e983991d4ac6015b83bb.svg) 

Floating-point to floating-point sign-injection instructions, FSGNJ.D, FSGNJN.D, and FSGNJX.D are defined analogously to the single-precision sign-injection instruction.

![svg](_images/svg-ceea64436f525b0b617354938f8bd598c7336533.svg) 

For XLEN≥64 only, instructions are provided to move bit patterns between the floating-point and integer registers.FMV.X.D moves the double-precision value in floating-point register _rs1_ to a representation in IEEE 754-2008 standard encoding in integer register_rd_. FMV.D.X moves the double-precision value encoded in IEEE 754-2008 standard encoding from the integer register _rs1_ to the floating-point register _rd_.

FMV.X.D and FMV.D.X do not modify the bits being transferred; in particular, the payloads of non-canonical NaNs are preserved.

![svg](_images/svg-7a7bc3f523031e28f968d14c024f47e4b5ae65fb.svg) 

| |  Early versions of the RISC-V ISA had additional instructions to allow RV32 systems to transfer between the upper and lower portions of a 64-bit floating-point register and an integer register. However, these would be the only instructions with partial register writes and would add complexity in implementations with recoded floating-point or register renaming, requiring a pipeline read-modify-write sequence. Scaling up to handling quad-precision for RV32 and RV64 would also require additional instructions if they were to follow this pattern. The ISA was defined to reduce the number of explicit int-float register moves, by having conversions and comparisons write results to the appropriate register file, so we expect the benefit of these instructions to be lower than for other ISAs. We note that for systems that implement a 64-bit floating-point unit including fused multiply-add support and 64-bit floating-point loads and stores, the marginal hardware cost of moving from a 32-bit to a 64-bit integer datapath is low, and a software ABI supporting 32-bit wide address-space and pointers can be used to avoid growth of static data and dynamic memory traffic. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#22-1-6-double-precision-floating-point-compare-instructions)22.1.6\. Double-Precision Floating-Point Compare Instructions

The double-precision floating-point compare instructions are defined analogously to their single-precision counterparts, but operate on double-precision operands.

![svg](_images/svg-0beaca8788bdb6d1a86fce92ebf35d35906f78d1.svg) 

### [](#fl-compare)22.1.7\. Double-Precision Floating-Point Classify Instruction

The double-precision floating-point classify instruction, FCLASS.D, is defined analogously to its single-precision counterpart, but operates on double-precision operands.

![svg](_images/svg-3b75fd3d1b263968d3a971d85da7deda7ca63654.svg) 
