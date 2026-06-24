# 1.1. Register Convention

## [](#1-1-register-convention)1.1\. Register Convention

### [](#1-1-1-integer-register-convention)1.1.1\. Integer Register Convention

__Table 1\. Integer register convention__
| Name      | ABI Mnemonic | Meaning                | Preserved across calls? |
| --------- | ------------ | ---------------------- | ----------------------- |
| x0        | zero         | Zero                   | — (Immutable)           |
| x1        | ra           | Return address         | No                      |
| x2        | sp           | Stack pointer          | Yes                     |
| x3        | gp           | Global pointer         | — (Unallocatable)       |
| x4        | tp           | Thread pointer         | — (Unallocatable)       |
| x5 - x7   | t0 - t2      | Temporary registers    | No                      |
| x8 - x9   | s0 - s1      | Callee-saved registers | Yes                     |
| x10 - x17 | a0 - a7      | Argument registers     | No                      |
| x18 - x27 | s2 - s11     | Callee-saved registers | Yes                     |
| x28 - x31 | t3 - t6      | Temporary registers    | No                      |

In the standard ABI, procedures should not modify the integer registers tp and gp, because signal handlers may rely upon their values.

The presence of a frame pointer is optional. If a frame pointer exists, it must reside in x8 (s0); the register remains callee-saved.

### [](#1-1-2-floating-point-register-convention)1.1.2\. Floating-point Register Convention

__Table 2\. Floating-point register convention__
| Name      | ABI Mnemonic | Meaning                | Preserved across calls? |
| --------- | ------------ | ---------------------- | ----------------------- |
| f0 - f7   | ft0 - ft7    | Temporary registers    | No                      |
| f8 - f9   | fs0 - fs1    | Callee-saved registers | Yes\*                   |
| f10 - f17 | fa0 - fa7    | Argument registers     | No                      |
| f18 - f27 | fs2 - fs11   | Callee-saved registers | Yes\*                   |
| f28 - f31 | ft8 - ft11   | Temporary registers    | No                      |

\*: Floating-point values in callee-saved registers are only preserved across calls if they are no larger than the width of a floating-point register in the targeted ABI. Therefore, these registers can always be considered temporaries if targeting the base integer calling convention.

The Floating-Point Control and Status Register (fcsr) must have thread storage duration in accordance with C11 section 7.6 "Floating-point environment <fenv.h>".

### [](#1-1-3-vector-register-convention)1.1.3\. Vector Register Convention

__Table 3\. Vector register convention__
| Name   | ABI Mnemonic                                | Meaning | Preserved across calls? |
| ------ | ------------------------------------------- | ------- | ----------------------- |
| v0-v31 | Temporary registers                         | No      |                         |
| vl     | Vector length                               | No      |                         |
| vtype  | Vector data type register                   | No      |                         |
| vxrm   | Vector fixed-point rounding mode register   | No      |                         |
| vxsat  | Vector fixed-point saturation flag register | No      |                         |

Vector registers are not used for passing arguments or return values; we intend to define a new calling convention variant to allow that as a future software optimization.

The `vxrm` and `vxsat` fields of `vcsr` are not preserved across calls and their values are unspecified upon entry.

Procedures may assume that `vstart` is zero upon entry. Procedures may assume that `vstart` is zero upon return from a procedure call.

| |  Application software should normally not write vstart explicitly. Any procedure that does explicitly write vstart to a nonzero value must zerovstart before either returning or calling another procedure. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
