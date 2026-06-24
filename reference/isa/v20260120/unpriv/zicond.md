# 11.1. "Zicond" Extension for Integer Conditional Operations, Version 1.0.0

## [](#Zicond)11.1\. "Zicond" Extension for Integer Conditional Operations, Version 1.0.0

The Zicond extension defines two R-type instructions that support branchless conditional operations.

| RV32 | RV64 | Mnemonic                     | Instruction                                                         |
| ---- | ---- | ---------------------------- | ------------------------------------------------------------------- |
| ✓    | ✓    | czero.eqz _rd_, _rs1_, _rs2_ | [Conditional zero, if condition is equal to zero](#insns-czero-eqz) |
| ✓    | ✓    | czero.nez _rd_, _rs1_, _rs2_ | [Conditional zero, if condition is nonzero](#insns-czero-nez)       |

### [](#11-1-1-instructions-in-alphabetical-order)11.1.1\. Instructions (in alphabetical order)

#### [](#insns-czero-eqz)11.1.1.1\. czero.eqz

Synopsis

Moves zero to a register _rd_, if the condition _rs2_ is equal to zero, otherwise moves _rs1_ to _rd_.

Mnemonic

czero.eqz _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-34389227572362e4a64211391b05200befc2cb7b.svg) 

Description

If _rs2_ contains the value zero, this instruction writes the value zero to _rd_. Otherwise, this instruction copies the contents of _rs1_ to _rd_.

This instruction carries a syntactic dependency from both _rs1_ and _rs2_ to _rd_.

Furthermore, if the Zkt extension is implemented, this instruction’s timing is independent of the data values in _rs1_ and _rs2_.

SAIL code

```sail
  let condition = X(rs2);
  result : xlenbits = if (condition == zeros()) then zeros()
                                                else X(rs1);
  X(rd) = result;
```

#### [](#insns-czero-nez)11.1.1.2\. czero.nez

Synopsis

Moves zero to a register _rd_, if the condition _rs2_ is nonzero, otherwise moves _rs1_ to _rd_.

Mnemonic

czero.nez _rd_, _rs1_, _rs2_

Encoding

![svg](_images/svg-7d786258fac0cfe4283212b4dde9b0da28236053.svg) 

Description

If _rs2_ contains a nonzero value, this instruction writes the value zero to _rd_. Otherwise, this instruction copies the contents of _rs1_ to _rd_.

This instruction carries a syntactic dependency from both _rs1_ and _rs2_ to _rd_.

Furthermore, if the Zkt extension is implemented, this instruction’s timing is independent of the data values in _rs1_ and _rs2_.

SAIL code

```sail
  let condition = X(rs2);
  result : xlenbits = if (condition != zeros()) then zeros()
                                                else X(rs1);
  X(rd) = result;
```

### [](#11-1-2-usage-examples)11.1.2\. Usage examples

The instructions from this extension can be used to construct sequences that perform conditional-arithmetic, conditional-bitwise-logical, and conditional-select operations.

#### [](#11-1-2-1-instruction-sequences)11.1.2.1\. Instruction sequences

| Operation                                                                   | Instruction sequence                                                     | Length                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| **Conditional add, if zero** rd = (rc == 0) ? (rs1 + rs2) : rs1             | czero.nez  rd, rs2, rc add        rd, rs1, rd                            | 2 insns                       |
| **Conditional add, if non-zero** rd = (rc != 0) ? (rs1 + rs2) : rs1         | czero.eqz  rd, rs2, rc add        rd, rs1, rd                            |                               |
| **Conditional subtract, if zero** rd = (rc == 0) ? (rs1 - rs2) : rs1        | czero.nez  rd, rs2, rc sub        rd, rs1, rd                            |                               |
| **Conditional subtract, if non-zero** rd = (rc != 0) ? (rs1 - rs2) : rs1    | czero.eqz  rd, rs2, rc sub        rd, rs1, rd                            |                               |
| **Conditional bitwise-or, if zero** rd = (rc == 0) ? (rs1 \| rs2) : rs1     | czero.nez  rd, rs2, rc or         rd, rs1, rd                            |                               |
| **Conditional bitwise-or, if non-zero** rd = (rc != 0) ? (rs1 \| rs2) : rs1 | czero.eqz  rd, rs2, rc or         rd, rs1, rd                            |                               |
| **Conditional bitwise-xor, if zero** rd = (rc == 0) ? (rs1 ^ rs2) : rs1     | czero.nez  rd, rs2, rc xor        rd, rs1, rd                            |                               |
| **Conditional bitwise-xor, if non-zero** rd = (rc != 0) ? (rs1 ^ rs2) : rs1 | czero.eqz  rd, rs2, rc xor        rd, rs1, rd                            |                               |
| **Conditional bitwise-and, if zero** rd = (rc == 0) ? (rs1 & rs2) : rs1     | and        rd, rs1, rs2 czero.eqz  rtmp, rs1, rc or         rd, rd, rtmp | 3 insns(requires 1 temporary) |
| **Conditional bitwise-and, if non-zero** rd = (rc != 0) ? (rs1 & rs2) : rs1 | and        rd, rs1, rs2 czero.nez  rtmp, rs1, rc or         rd, rd, rtmp |                               |
| **Conditional select, if zero** rd = (rc == 0) ? rs1 : rs2                  | czero.nez  rd, rs1, rc czero.eqz  rtmp, rs2, rc add        rd, rd, rtmp  |                               |
| **Conditional select, if non-zero** rd = (rc != 0) ? rs1 : rs2              | czero.eqz  rd, rs1, rc czero.nez  rtmp, rs2, rc add        rd, rd, rtmp  |                               |
