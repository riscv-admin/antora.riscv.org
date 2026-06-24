# 24.1. "Zfh" and "Zfhmin" Extensions for Half-Precision Floating-Point, Version 1.0

## [](#chap:zfh)24.1\. "Zfh" and "Zfhmin" Extensions for Half-Precision Floating-Point, Version 1.0

This chapter describes the Zfh standard extension for 16-bit half-precision binary floating-point instructions compliant with the IEEE 754-2008 arithmetic standard. The Zfh extension depends on the single-precision floating-point extension, F. The NaN-boxing scheme described in [NaN Boxing of Narrower Values](d-st-ext.html#nanboxing) is extended to allow a half-precision value to be NaN-boxed inside a single-precision value (which may be recursively NaN-boxed inside a double- or quad-precision value when the D or Q extension is present).

| |  This extension primarily provides instructions that consume half-precision operands and produce half-precision results. However, it is also common to compute on half-precision data using higher intermediate precision. Although this extension provides explicit conversion instructions that suffice to implement that pattern, future extensions might further accelerate such computation with additional instructions that implicitly widen their operands—e.g., half×half+single→single—or implicitly narrow their results—e.g., half+single→half. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#24-1-1-half-precision-load-and-store-instructions)24.1.1\. Half-Precision Load and Store Instructions

New 16-bit variants of LOAD-FP and STORE-FP instructions are added, encoded with a new value for the funct3 width field.

![svg](_images/svg-43b5c2b0a97281843159ef82964b366feac332bd.svg) 

![svg](_images/svg-cbf3aef7c9e9452cdb40ee9820c3cca33bb798c9.svg) 

FLH and FSH are only guaranteed to execute atomically if the effective address is naturally aligned.

FLH and FSH do not modify the bits being transferred; in particular, the payloads of non-canonical NaNs are preserved. FLH NaN-boxes the result written to _rd_, whereas FSH ignores all but the lower 16 bits in _rs2_.

### [](#24-1-2-half-precision-computational-instructions)24.1.2\. Half-Precision Computational Instructions

A new supported format is added to the format field of most instructions, as shown in [Table 1](#tab:fpextfmth).

__Table 1\. Format field encoding.__
| _fmt_ field | Mnemonic | Meaning                 |
| ----------- | -------- | ----------------------- |
| 00          | S        | 32-bit single-precision |
| 01          | D        | 64-bit double-precision |
| 10          | H        | 16-bit half-precision   |
| 11          | Q        | 128-bit quad-precision  |

The half-precision floating-point computational instructions are defined analogously to their single-precision counterparts, but operate on half-precision operands and produce half-precision results.

![svg](_images/svg-46361031bb67f0d9c15ff2d4a33cc02bd86b95e5.svg) 

![svg](_images/svg-99b93bf80c94c94f0ec817b44bdb5a7165378a42.svg) 

### [](#24-1-3-half-precision-conversion-and-move-instructions)24.1.3\. Half-Precision Conversion and Move Instructions

New floating-point-to-integer and integer-to-floating-point conversion instructions are added. These instructions are defined analogously to the single-precision-to-integer and integer-to-single-precision conversion instructions. FCVT.W.H or FCVT.L.H converts a half-precision floating-point number to a signed 32-bit or 64-bit integer, respectively. FCVT.H.W or FCVT.H.L converts a 32-bit or 64-bit signed integer, respectively, into a half-precision floating-point number.FCVT.WU.H, FCVT.LU.H, FCVT.H.WU, and FCVT.H.LU variants convert to or from unsigned integer values. FCVT.L\[U\].H and FCVT.H.L\[U\] are RV64-only instructions.

![svg](_images/svg-48aa1e6d42b94d88e20f7fcd27e6f716202f453c.svg) 

New floating-point-to-floating-point conversion instructions are added. These instructions are defined analogously to the double-precision floating-point-to-floating-point conversion instructions. FCVT.S.H or FCVT.H.S converts a half-precision floating-point number to a single-precision floating-point number, or vice-versa, respectively. If the D extension is present, FCVT.D.H or FCVT.H.D converts a half-precision floating-point number to a double-precision floating-point number, or vice-versa, respectively. If the Q extension is present, FCVT.Q.H or FCVT.H.Q converts a half-precision floating-point number to a quad-precision floating-point number, or vice-versa, respectively.

![svg](_images/svg-0ecff240910136246b1ea4cf5796e2cf903635d6.svg) 

Floating-point to floating-point sign-injection instructions, FSGNJ.H, FSGNJN.H, and FSGNJX.H are defined analogously to the single-precision sign-injection instruction.

![svg](_images/svg-9062450444720ccfbffb4f64412ffad9b70c2027.svg) 

Instructions are provided to move bit patterns between the floating-point and integer registers. FMV.X.H moves the half-precision value in floating-point register _rs1_ to a representation in IEEE 754-2008 standard encoding in integer register _rd_, filling the upper XLEN-16 bits with copies of the floating-point number’s sign bit.

FMV.H.X moves the half-precision value encoded in IEEE 754-2008 standard encoding from the lower 16 bits of integer register _rs1_ to the floating-point register _rd_, NaN-boxing the result.

FMV.X.H and FMV.H.X do not modify the bits being transferred; in particular, the payloads of non-canonical NaNs are preserved.

![svg](_images/svg-86412cb7a6df56627d86059a8dbc406ee8faf887.svg) 

### [](#flt-pt-to-int-move)24.1.4\. Half-Precision Floating-Point Compare Instructions

The half-precision floating-point compare instructions are defined analogously to their single-precision counterparts, but operate on half-precision operands.

![svg](_images/svg-97b3530202d91cc76da0d43426f7bd7ff5cc0883.svg) 

### [](#half-pr-flt-pt-compare)24.1.5\. Half-Precision Floating-Point Classify Instruction

The half-precision floating-point classify instruction, FCLASS.H, is defined analogously to its single-precision counterpart, but operates on half-precision operands.

![svg](_images/svg-ce65c8430d703053d0c5f1b1bccb74e9706e2300.svg) 

### [](#half-pr-flt-class)24.1.6\. "Zfhmin" Standard Extension for Minimal Half-Precision Floating-Point

This section describes the Zfhmin standard extension, which provides minimal support for 16-bit half-precision binary floating-point instructions. The Zfhmin extension is a subset of the Zfh extension, consisting only of data transfer and conversion instructions. Like Zfh, the Zfhmin extension depends on the single-precision floating-point extension, F. The expectation is that Zfhmin software primarily uses the half-precision format for storage, performing most computation in higher precision.

The Zfhmin extension includes the following instructions from the Zfh extension: FLH, FSH, FMV.X.H, FMV.H.X, FCVT.S.H, and FCVT.H.S. If the D extension is present, the FCVT.D.H and FCVT.H.D instructions are also included. If the Q extension is present, the FCVT.Q.H and FCVT.H.Q instructions are additionally included.

| |  Zfhmin does not include the FSGNJ.H instruction, because it suffices to instead use the FSGNJ.S instruction to move half-precision values between floating-point registers. Half-precision addition, subtraction, multiplication, division, and square-root operations can be faithfully emulated by converting the half-precision operands to single-precision, performing the operation using single-precision arithmetic, then converting back to half-precision. \[[21](../biblio/bibliography.html#bib-roux:hal-01091186)\] Performing half-precision fused multiply-addition using this method incurs a 1-ulp error on some inputs for the RNE and RMM rounding modes. Conversion from 8- or 16-bit integers to half-precision can be emulated by first converting to single-precision, then converting to half-precision. Conversion from 32-bit integer can be emulated by first converting to double-precision. If the D extension is not present and a 1-ulp error under RNE or RMM is tolerable, 32-bit integers can be first converted to single-precision instead. The same remark applies to conversions from 64-bit integers without the Q extension. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
