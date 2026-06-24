# 8.1. ELF Object Files

## [](#8-1-elf-object-files)8.1\. ELF Object Files

The ELF object file format for RISC-V follows the_Generic System V Application Binary Interface_ [elf-bib.adoc#gabi](elf-bib.html#gabi)("gABI"); this specification only describes RISC-V-specific definitions.

### [](#8-1-1-file-header)8.1.1\. File Header

The section below lists the defined RISC-V-specific values for several ELF header fields; any fields not listed in this section have no RISC-V-specific values.

e\_ident

EI\_CLASS

Specifies the base ISA, either RV32 or RV64\. Linking RV32 and RV64 code together is not supported.

| ELFCLASS64 | ELF-64 Object File |
| ---------- | ------------------ |

| ELFCLASS32 | ELF-32 Object File |
| ---------- | ------------------ |

EI\_DATA

Specifies the endianness; either big-endian or little-endian. Linking big-endian and little-endian code together is not supported.

| ELFDATA2LSB | Little-endian Object File |
| ----------- | ------------------------- |
| ELFDATA2MSB | Big-endian Object File    |

e\_machine

Identifies the machine this ELF file targets. Always contains EM\_RISCV (243) for RISC-V ELF files.

e\_flags

Describes the format of this ELF file. These flags are used by the linker to disallow linking ELF files with incompatible ABIs together,[Table 1](#e-flags-layout) shows the layout of e\_flags, and flag details are listed below.

__Table 1\. Layout of e\_flags__
| Bit 0 | Bits 1 - 2 | Bit 3 | Bit 4 | Bits 5 - 23  | Bits 24 - 31                |
| ----- | ---------- | ----- | ----- | ------------ | --------------------------- |
| RVC   | Float ABI  | RVE   | TSO   | **Reserved** | **Non-standard extensions** |

EF\_RISCV\_RVC (0x0001)

This bit is set when the binary targets the C ABI, which allows instructions to be aligned to 16-bit boundaries (the base RV32 and RV64 ISAs only allow 32-bit instruction alignment). When linking objects which specify EF\_RISCV\_RVC, the linker is permitted to use RVC instructions such as C.JAL in the linker relaxation process.

EF\_RISCV\_FLOAT\_ABI\_SOFT (0x0000)

EF\_RISCV\_FLOAT\_ABI\_SINGLE (0x0002)

EF\_RISCV\_FLOAT\_ABI\_DOUBLE (0x0004)

EF\_RISCV\_FLOAT\_ABI\_QUAD (0x0006)

 These flags identify the floating point ABI in use for this ELF file. They store the largest floating-point type that ends up in registers as part of the ABI (but do not control if code generation is allowed to use floating-point internally). The rule is that if you have a floating-point type in a register, then you also have all smaller floating-point types in registers. For example \_DOUBLE would store "float" and "double" values in F registers, but would not store "long double" values in F registers. If none of the float ABI flags are set, the object is taken to use the soft-float ABI.

EF\_RISCV\_FLOAT\_ABI (0x0006)

This macro is used as a mask to test for one of the above floating-point ABIs, e.g.,`(e_flags & EF_RISCV_FLOAT_ABI) == EF_RISCV_FLOAT_ABI_DOUBLE`.

EF\_RISCV\_RVE (0x0008)

This bit is set when the binary targets the E ABI.

EF\_RISCV\_TSO (0x0010)

This bit is set when the binary requires the RVTSO memory consistency model.

Until such a time that the **Reserved** bits (0x00ffffe0) are allocated by future versions of this specification, they shall not be set by standard software. Non-standard extensions are free to use bits 24-31 for any purpose. This may conflict with other non-standard extensions.

| |  There is no provision for compatibility between conflicting uses of the e\_flags bits reserved for non-standard extensions, and many standard RISC-V tools will ignore them. Do not use them unless you control both the toolchain and the operating system, and the ABI differences are so significant they cannot be done with a .RISCV.attributes tag nor an ELF note, such as using a different syscall ABI. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

\==== 8.1.1.1\. Policy for Merge Objects With Different File Headers

This section describe the behavior when the inputs files come with different file headers.

`e_ident` and `e_machine` should have exact same value otherwise linker should raise an error.

`e_flags` has different different policy for different fields:

RVC

Input file could have different values for the RVC field; the linker should set this field into EF\_RISCV\_RVC if any of the input objects has been set.

Float ABI

Linker should report errors if object files of different value for float ABI field.

RVE

Linker should report errors if object files of different value for RVE field.

TSO

Linker should report errors if object files of different value for TSO field.

| |  The static linker may ignore the compatibility checks if all fields in thee\_flags are zero and all sections in the input file are non-executable sections. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#8-1-2-string-tables)8.1.2\. String Tables

There are no RISC-V specific definitions relating to ELF string tables.

### [](#8-1-3-symbol-table)8.1.3\. Symbol Table

st\_other

The lower 2 bits are used to specify a symbol’s visibility. The remaining 6 bits have no defined meaning in the ELF gABI. We use the highest bit to mark functions that do not follow the standard calling convention for the ABI in use.

The defined processor-specific `st_other` flags are listed in [Table 2](#rv-st-other).

__Table 2\. RISC-V-specific st\_other flags__
| Name                    | Mask |
| ----------------------- | ---- |
| STO\_RISCV\_VARIANT\_CC | 0x80 |

See [\[Dynamic Linking\]](#Dynamic Linking) for the meaning of `STO_RISCV_VARIANT_CC`.

`__global_pointer$` must be exported in the dynamic symbol table of dynamically-linked executables if there are any GP-relative accesses present in the executable.

### [](#8-1-4-relocations)8.1.4\. Relocations

RISC-V is a classical RISC architecture that has densely packed non-word sized instruction immediate values. While the linker can make relocations on arbitrary memory locations, many of the RISC-V relocations are designed for use with specific instructions or instruction sequences. RISC-V has several instruction specific encodings for PC-Relative address loading, jumps, branches and the RVC compressed instruction set.

The purpose of this section is to describe the RISC-V specific instruction sequences with their associated relocations in addition to the general purpose machine word sized relocations that are used for symbol addresses in the Global Offset Table or DWARF meta data.

[Table 3](#reloc-table) provides details of the RISC-V ELF relocations; the meaning of each column is given below:

Enum

The number of the relocation, encoded in the r\_info field

ELF Reloc Type

The name of the relocation, omitting the prefix of `R_RISCV_`.

Type

Whether the relocation is a static or dynamic relocation:

* A static relocation relocates a location in a relocatable file, processed by a static linker.
* A dynamic relocation relocates a location in an executable or shared object, processed by a run-time linker.
* `Both`: Some relocation types are used by both static relocations and dynamic relocations.

Field

Describes the set of bits affected by this relocation; see [\[Field Symbols\]](#Field Symbols) for the definitions of the individual types

Calculation

Formula for how to resolve the relocation value; definitions of the symbols can be found in [\[Calculation Symbols\]](#Calculation Symbols)

Description

Additional information about the relocation

__Table 3\. Relocation types__
| Enum                     | ELF Reloc Type | Type    | Field / Calculation                                                                                                                                                                                         | Description                                                                                      |
| ------------------------ | -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0                        | NONE           | None    |                                                                                                                                                                                                             |                                                                                                  |
| 1                        | 32             | Both    | _word32_                                                                                                                                                                                                    | 32-bit relocation                                                                                |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 2                        | 64             | Both    | _word64_                                                                                                                                                                                                    | 64-bit relocation                                                                                |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 3                        | RELATIVE       | Dynamic | _wordclass_                                                                                                                                                                                                 | Adjust a link address (A) to its load address (B + A)                                            |
| B + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 4                        | COPY           | Dynamic | Must be in executable; not allowed in shared library                                                                                                                                                        |                                                                                                  |
| 5                        | JUMP\_SLOT     | Dynamic | _wordclass_                                                                                                                                                                                                 | Indicates the symbol associated with a PLT entry                                                 |
| S                        |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 6                        | TLS\_DTPMOD32  | Dynamic | _word32_                                                                                                                                                                                                    |                                                                                                  |
| TLSMODULE                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 7                        | TLS\_DTPMOD64  | Dynamic | _word64_                                                                                                                                                                                                    |                                                                                                  |
| TLSMODULE                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 8                        | TLS\_DTPREL32  | Dynamic | _word32_                                                                                                                                                                                                    |                                                                                                  |
| S + A - TLS\_DTV\_OFFSET |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 9                        | TLS\_DTPREL64  | Dynamic | _word64_                                                                                                                                                                                                    |                                                                                                  |
| S + A - TLS\_DTV\_OFFSET |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 10                       | TLS\_TPREL32   | Dynamic | _word32_                                                                                                                                                                                                    |                                                                                                  |
| S + A + TLSOFFSET        |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 11                       | TLS\_TPREL64   | Dynamic | _word64_                                                                                                                                                                                                    |                                                                                                  |
| S + A + TLSOFFSET        |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 16                       | BRANCH         | Static  | _B-Type_                                                                                                                                                                                                    | 12-bit PC-relative branch offset                                                                 |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 17                       | JAL            | Static  | _J-Type_                                                                                                                                                                                                    | 20-bit PC-relative jump offset                                                                   |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 18                       | CALL           | Static  | _U+I-Type_                                                                                                                                                                                                  | **Deprecated, please use CALL\_PLT instead** 32-bit PC-relative function call, macros call, tail |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 19                       | CALL\_PLT      | Static  | _U+I-Type_                                                                                                                                                                                                  | 32-bit PC-relative function call, macros call, tail (PIC)                                        |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 20                       | GOT\_HI20      | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of 32-bit PC-relative GOT access, %got\_pcrel\_hi(symbol)                           |
| G + GOT + A - P          |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 21                       | TLS\_GOT\_HI20 | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of 32-bit PC-relative TLS IE GOT access, macro la.tls.ie                            |
| 22                       | TLS\_GD\_HI20  | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of 32-bit PC-relative TLS GD GOT reference, macro la.tls.gd                         |
| 23                       | PCREL\_HI20    | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of 32-bit PC-relative reference, %pcrel\_hi(symbol)                                 |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 24                       | PCREL\_LO12\_I | Static  | _I-type_                                                                                                                                                                                                    | Low 12 bits of a 32-bit PC-relative, %pcrel\_lo(address of %pcrel\_hi), the addend must be 0     |
| S - P                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 25                       | PCREL\_LO12\_S | Static  | _S-Type_                                                                                                                                                                                                    | Low 12 bits of a 32-bit PC-relative, %pcrel\_lo(address of %pcrel\_hi), the addend must be 0     |
| S - P                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 26                       | HI20           | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of 32-bit absolute address, %hi(symbol)                                             |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 27                       | LO12\_I        | Static  | _I-Type_                                                                                                                                                                                                    | Low 12 bits of 32-bit absolute address, %lo(symbol)                                              |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 28                       | LO12\_S        | Static  | _S-Type_                                                                                                                                                                                                    | Low 12 bits of 32-bit absolute address, %lo(symbol)                                              |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 29                       | TPREL\_HI20    | Static  | _U-Type_                                                                                                                                                                                                    | High 20 bits of TLS LE thread pointer offset, %tprel\_hi(symbol)                                 |
| 30                       | TPREL\_LO12\_I | Static  | _I-Type_                                                                                                                                                                                                    | Low 12 bits of TLS LE thread pointer offset, %tprel\_lo(symbol)                                  |
| 31                       | TPREL\_LO12\_S | Static  | _S-Type_                                                                                                                                                                                                    | Low 12 bits of TLS LE thread pointer offset, %tprel\_lo(symbol)                                  |
| 32                       | TPREL\_ADD     | Static  | TLS LE thread pointer usage, %tprel\_add(symbol)                                                                                                                                                            |                                                                                                  |
| 33                       | ADD8           | Static  | _word8_                                                                                                                                                                                                     | 8-bit label addition                                                                             |
| V + S + A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 34                       | ADD16          | Static  | _word16_                                                                                                                                                                                                    | 16-bit label addition                                                                            |
| V + S + A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 35                       | ADD32          | Static  | _word32_                                                                                                                                                                                                    | 32-bit label addition                                                                            |
| V + S + A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 36                       | ADD64          | Static  | _word64_                                                                                                                                                                                                    | 64-bit label addition                                                                            |
| V + S + A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 37                       | SUB8           | Static  | _word8_                                                                                                                                                                                                     | 8-bit label subtraction                                                                          |
| V - S - A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 38                       | SUB16          | Static  | _word16_                                                                                                                                                                                                    | 16-bit label subtraction                                                                         |
| V - S - A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 39                       | SUB32          | Static  | _word32_                                                                                                                                                                                                    | 32-bit label subtraction                                                                         |
| V - S - A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 40                       | SUB64          | Static  | _word64_                                                                                                                                                                                                    | 64-bit label subtraction                                                                         |
| V - S - A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 41-42                    | **Reserved**   | \-      | Reserved for future standard use                                                                                                                                                                            |                                                                                                  |
| 43                       | ALIGN          | Static  | Alignment statement. The addend indicates the number of bytes occupied by nop instructions at the relocation offset. The alignment boundary is specified by the addend rounded up to the next power of two. |                                                                                                  |
| 44                       | RVC\_BRANCH    | Static  | _CB-Type_                                                                                                                                                                                                   | 8-bit PC-relative branch offset                                                                  |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 45                       | RVC\_JUMP      | Static  | _CJ-Type_                                                                                                                                                                                                   | 11-bit PC-relative jump offset                                                                   |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 46                       | RVC\_LUI       | Static  | _CI-Type_                                                                                                                                                                                                   | High 6 bits of 18-bit absolute address                                                           |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 47-50                    | **Reserved**   | \-      | Reserved for future standard use                                                                                                                                                                            |                                                                                                  |
| 51                       | RELAX          | Static  | Instruction can be relaxed, paired with a normal relocation at the same address                                                                                                                             |                                                                                                  |
| 52                       | SUB6           | Static  | _word6_                                                                                                                                                                                                     | Local label subtraction                                                                          |
| V - S - A                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 53                       | SET6           | Static  | _word6_                                                                                                                                                                                                     | Local label assignment                                                                           |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 54                       | SET8           | Static  | _word8_                                                                                                                                                                                                     | Local label assignment                                                                           |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 55                       | SET16          | Static  | _word16_                                                                                                                                                                                                    | Local label assignment                                                                           |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 56                       | SET32          | Static  | _word32_                                                                                                                                                                                                    | Local label assignment                                                                           |
| S + A                    |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 57                       | 32\_PCREL      | Static  | _word32_                                                                                                                                                                                                    | 32-bit PC relative                                                                               |
| S + A - P                |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 58                       | IRELATIVE      | Dynamic | _wordclass_                                                                                                                                                                                                 | Relocation against a non-preemptible ifunc symbol                                                |
| ifunc\_resolver(B + A)   |                |         |                                                                                                                                                                                                             |                                                                                                  |
| 59-191                   | **Reserved**   | \-      | Reserved for future standard use                                                                                                                                                                            |                                                                                                  |
| 192-255                  | **Reserved**   | \-      | Reserved for nonstandard ABI extensions                                                                                                                                                                     |                                                                                                  |

Nonstandard extensions are free to use relocation numbers 192-255 for any purpose. These relocations may conflict with other nonstandard extensions.

This section and later ones contain fragments written in assembler. The precise assembler syntax, including that of the relocations, is described in the_RISC-V Assembly Programmer’s Manual_ [elf-bib.adoc#rv-asm](elf-bib.html#rv-asm).

#### [](#8-1-4-1-calculation-symbols)8.1.4.1\. Calculation Symbols

[Table 4](#var-reloc-calc) provides details on the variables used in relocation calculation:

__Table 4\. Variables used in relocation calculation__
| Variable  | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| A         | Addend field in the relocation entry associated with the symbol               |
| B         | Base address of a shared object loaded into memory                            |
| G         | Offset of the symbol into the GOT (Global Offset Table)                       |
| GOT       | Address of the GOT (Global Offset Table)                                      |
| P         | Position of the relocation                                                    |
| S         | Value of the symbol in the symbol table                                       |
| V         | Value at the position of the relocation                                       |
| GP        | Value of \_\_global\_pointer$ symbol                                          |
| TLSMODULE | TLS module index for the object containing the symbol                         |
| TLSOFFSET | TLS static block offset (relative to tp) for the object containing the symbol |

**Global Pointer**: It is assumed that program startup code will load the value of the `__global_pointer$` symbol into register `gp` (aka `x3`).

#### [](#8-1-4-2-field-symbols)8.1.4.2\. Field Symbols

[Table 5](#var-reloc-field) provides details on the variables used in relocation fields:

__Table 5\. Variables used in relocation fields__
| Variable    | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| _word6_     | Specifies the 6 least significant bits of a _word8_ field                         |
| _word8_     | Specifies an 8-bit word                                                           |
| _word16_    | Specifies a 16-bit word                                                           |
| _word32_    | Specifies a 32-bit word                                                           |
| _word64_    | Specifies a 64-bit word                                                           |
| _wordclass_ | Specifies a _word32_ field for ILP32 or a _word64_ field for LP64                 |
| _B-Type_    | Specifies a field as the immediate field in a B-type instruction                  |
| _CB-Type_   | Specifies a field as the immediate field in a CB-type instruction                 |
| _CI-Type_   | Specifies a field as the immediate field in a CI-type instruction                 |
| _CJ-Type_   | Specifies a field as the immediate field in a CJ-type instruction                 |
| _I-Type_    | Specifies a field as the immediate field in an I-type instruction                 |
| _S-Type_    | Specifies a field as the immediate field in an S-type instruction                 |
| _U-Type_    | Specifies a field as the immediate field in an U-type instruction                 |
| _J-Type_    | Specifies a field as the immediate field in a J-type instruction                  |
| _U+I-Type_  | Specifies a field as the immediate fields in a U-type and I-type instruction pair |

#### [](#8-1-4-3-constants)8.1.4.3\. Constants

[Table 6](#const-reloc-field) provides details on the constants used in relocation fields:

__Table 6\. Constants used in relocation fields__
| Name             | Value |
| ---------------- | ----- |
| TLS\_DTV\_OFFSET | 0x800 |

#### [](#8-1-4-4-absolute-addresses)8.1.4.4\. Absolute Addresses

32-bit absolute addresses in position dependent code are loaded with a pair of instructions which have an associated pair of relocations:`R_RISCV_HI20` plus `R_RISCV_LO12_I` or `R_RISCV_LO12_S`.

The `R_RISCV_HI20` refers to an `LUI` instruction containing the high 20-bits to be relocated to an absolute symbol address. The `LUI` instruction is used in conjunction with one or more I-Type instructions (add immediate or load) with `R_RISCV_LO12_I` relocations or S-Type instructions (store) with`R_RISCV_LO12_S` relocations. The addresses for pair of relocations are calculated like this:

| HI20 | (symbol\_address + 0x800) >> 12 |
| ---- | ------------------------------- |
| LO12 | symbol\_address                 |

The following assembly and relocations show loading an absolute address:

```asm
    lui  a0, %hi(symbol)     # R_RISCV_HI20 (symbol)
    addi a0, a0, %lo(symbol) # R_RISCV_LO12_I (symbol)
```

#### [](#8-1-4-5-global-offset-table)8.1.4.5\. Global Offset Table

For position independent code in dynamically linked objects, each shared object contains a GOT (Global Offset Table), which contains addresses of global symbols (objects and functions) referred to by the dynamically linked shared object. The GOT in each shared library is filled in by the dynamic linker during program loading, or on the first call to extern functions.

To avoid dynamic relocations within the text segment of position independent code the GOT is used for indirection. Instead of code loading virtual addresses directly, as can be done in static code, addresses are loaded from the GOT. This allows runtime binding to external objects and functions at the expense of a slightly higher runtime overhead for access to extern objects and functions.

#### [](#8-1-4-6-program-linkage-table)8.1.4.6\. Program Linkage Table

The PLT (Program Linkage Table) exists to allow function calls between dynamically linked shared objects. Each dynamic object has its own GOT (Global Offset Table) and PLT (Program Linkage Table).

The first entry of a shared object PLT is a special entry that calls`_dl_runtime_resolve` to resolve the GOT offset for the called function. The `_dl_runtime_resolve` function in the dynamic loader resolves the GOT offsets lazily on the first call to any function, except when`LD_BIND_NOW` is set in which case the GOT entries are populated by the dynamic linker before the executable is started. Lazy resolution of GOT entries is intended to speed up program loading by deferring symbol resolution to the first time the function is called. The first entry in the PLT occupies two 16 byte entries:

```asm
1:  auipc  t2, %pcrel_hi(.got.plt)
    sub    t1, t1, t3               # shifted .got.plt offset + hdr size + 12
    l[w|d] t3, %pcrel_lo(1b)(t2)    # _dl_runtime_resolve
    addi   t1, t1, -(hdr size + 12) # shifted .got.plt offset
    addi   t0, t2, %pcrel_lo(1b)    # &.got.plt
    srli   t1, t1, log2(16/PTRSIZE) # .got.plt offset
    l[w|d] t0, PTRSIZE(t0)          # link map
    jr     t3
```

Subsequent function entry stubs in the PLT take up 16 bytes and load a function pointer from the GOT. On the first call to a function, the entry redirects to the first PLT entry which calls `_dl_runtime_resolve`and fills in the GOT entry for subsequent calls to the function:

```asm
1:  auipc   t3, %pcrel_hi(function@.got.plt)
    l[w|d]  t3, %pcrel_lo(1b)(t3)
    jalr    t1, t3
    nop
```

#### [](#8-1-4-7-procedure-calls)8.1.4.7\. Procedure Calls

`R_RISCV_CALL` and `R_RISCV_CALL_PLT` relocations are associated with pairs of instructions (`AUIPC+JALR`) generated by the `CALL` or `TAIL`pseudoinstructions. Originally, these relocations had slightly different behavior, but that has turned out to be unnecessary, and they are now interchangeable, `R_RISCV_CALL` is deprecated, suggest using `R_RISCV_CALL_PLT`instead.

With linker relaxation enabled, the `AUIPC` instruction in the `AUIPC+JALR` pair has both a `R_RISCV_CALL` or `R_RISCV_CALL_PLT` relocation and an `R_RISCV_RELAX`relocation indicating the instruction sequence can be relaxed during linking.

Procedure call linker relaxation allows the `AUIPC+JALR` pair to be relaxed to the `JAL` instruction when the procedure or PLT entry is within (-1MiB to +1MiB-2) of the instruction pair.

The pseudoinstruction:

```asm
    call symbol
    call symbol@plt
```

expands to the following assembly and relocation:

```asm
    auipc ra, 0           # R_RISCV_CALL (symbol), R_RISCV_RELAX (symbol)
    jalr  ra, ra, 0
```

and when symbol has an `@plt` suffix it expands to:

```asm
    auipc ra, 0           # R_RISCV_CALL_PLT (symbol), R_RISCV_RELAX (symbol)
    jalr  ra, ra, 0
```

#### [](#8-1-4-8-pc-relative-jumps-and-branches)8.1.4.8\. PC-Relative Jumps and Branches

Unconditional jump (J-Type) instructions have a `R_RISCV_JAL` relocation that can represent an even signed 21-bit offset (-1MiB to +1MiB-2).

Branch (SB-Type) instructions have a `R_RISCV_BRANCH` relocation that can represent an even signed 13-bit offset (-4096 to +4094).

#### [](#8-1-4-9-pc-relative-symbol-addresses)8.1.4.9\. PC-Relative Symbol Addresses

32-bit PC-relative relocations for symbol addresses on sequences of instructions such as the `AUIPC+ADDI` instruction pair expanded from the `la` pseudoinstruction, in position independent code typically have an associated pair of relocations: `R_RISCV_PCREL_HI20` plus`R_RISCV_PCREL_LO12_I` or `R_RISCV_PCREL_LO12_S`.

The `R_RISCV_PCREL_HI20` relocation refers to an `AUIPC` instruction containing the high 20-bits to be relocated to a symbol relative to the program counter address of the `AUIPC` instruction. The `AUIPC`instruction is used in conjunction with one or more I-Type instructions (add immediate or load) with `R_RISCV_PCREL_LO12_I` relocations or S-Type instructions (store) with `R_RISCV_PCREL_LO12_S` relocations.

The `R_RISCV_PCREL_LO12_I` or `R_RISCV_PCREL_LO12_S` relocations contain a label pointing to an instruction in the same section with an`R_RISCV_PCREL_HI20` relocation entry that points to the target symbol:

* At label: `R_RISCV_PCREL_HI20` relocation entry → symbol
* `R_RISCV_PCREL_LO12_I` relocation entry → label

To get the symbol address to perform the calculation to fill the 12-bit immediate on the add, load or store instruction the linker finds the`R_RISCV_PCREL_HI20` relocation entry associated with the `AUIPC`instruction. The addresses for pair of relocations are calculated like this:

| HI20 | (symbol\_address - hi20\_reloc\_offset + 0x800) >> 12 |
| ---- | ----------------------------------------------------- |
| LO12 | symbol\_address - hi20\_reloc\_offset                 |

The successive instruction has a signed 12-bit immediate so the value of the preceding high 20-bit relocation may have 1 added to it.

Note the compiler emitted instructions for PC-relative symbol addresses are not necessarily sequential or in pairs. There is a constraint is that the instruction with the `R_RISCV_PCREL_LO12_I` or `R_RISCV_PCREL_LO12_S`relocation label points to a valid HI20 PC-relative relocation pointing to the symbol.

Here is example assembler showing the relocation types:

```asm
label:
    auipc t0, %pcrel_hi(symbol)   # R_RISCV_PCREL_HI20 (symbol)
    lui t1, 1
    lw t2, t0, %pcrel_lo(label)   # R_RISCV_PCREL_LO12_I (label)
    add t2, t2, t1
    sw t2, t0, %pcrel_lo(label)   # R_RISCV_PCREL_LO12_S (label)
```

#### [](#8-1-4-10-relocation-for-alignment)8.1.4.10\. Relocation for Alignment

The relocation type `R_RISCV_ALIGN` marks a location that must be aligned to`N`\-bytes, where `N` is the smallest power of two that is greater than the value of the addend field, e.g. `R_RISCV_ALIGN` with addend value 2 means align to 4 bytes, `R_RISCV_ALIGN` with addend value 4 means align to 8 bytes; this relocation is only required if the containing section has any `R_RISCV_RELAX`relocations, `R_RISCV_ALIGN` points to the beginning of the padding bytes, and the instruction that actually needs to be aligned is located at the point of `R_RISCV_ALIGN` plus its addend.

To ensure the linker can always satisfy the required alignment solely by deleting bytes, the compiler or assembler must emit a `R_RISCV_ALIGN` relocation and then insert `N` \- [\[IALIGN\]](#IALIGN) padding bytes before the location where we need to align, it could be mark by an alignment directive like `.align`, `.p2align` or`.balign` or emit by compiler directly, the addend value of that relocation is the number of padding bytes.

The compiler and assembler must ensure padding bytes are valid instructions without any side-effect like `nop` or `c.nop`, and make sure those instructions are aligned to IALIGN if possible.

The linker may remove part of the padding bytes at the linking process to meet the alignment requirement, and must make sure those padding bytes still are valid instructions and each instruction is aligned to at least IALIGN byte.

Here is example to showing how `R_RISCV_ALIGN` is used:

```asm
0x0    c.nop           # R_RISCV_ALIGN with addend 2
0x2    add t1, t2, t3  # This instruction must align to 4 byte.
```

| |  R\_RISCV\_ALIGN relocation is needed because linker relaxation can shrink preceding code during the linking process, which may cause an aligned location to become mis-aligned. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  IALIGN means the instruction-address alignment constraint. IALIGN is 4 bytes in the base ISA, but some ISA extensions, including the compressed ISA extension, relax IALIGN to 2 bytes. IALIGN may not take on any value other than 4 or 2\. This term is also defined in The RISC-V Instruction Set Manual with a similar meaning, the only difference being it is specified in terms of the number of bits instead of the number of bytes. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  Here is pseudocode to decide the alignment of R\_RISCV\_ALIGN relocation: |
| ---------------------------------------------------------------------------- |

```python
# input:
#   addend: addend value of relocation with R_RISCV_ALIGN type.
# output:
#   Alignment of this relocation.

def align(addend):
  ALIGN = 1
  while addend >= ALIGN:
    ALIGN *= 2
  return ALIGN
```

### [](#8-1-5-thread-local-storage)8.1.5\. Thread Local Storage

RISC-V adopts the ELF Thread Local Storage Model in which ELF objects define`.tbss` and `.tdata` sections and `PT_TLS` program headers that contain the TLS "initialization images" for new threads. The `.tbss` and `.tdata` sections are not referenced directly like regular segments, rather they are copied or allocated to the thread local storage space of newly created threads. See _ELF Handling For Thread-Local Storage_ [elf-bib.adoc#tls](elf-bib.html#tls).

In The ELF Thread Local Storage Model, TLS offsets are used instead of pointers. The ELF TLS sections are initialization images for the thread local variables of each new thread. A TLS offset defines an offset into the dynamic thread vector which is pointed to by the TCB (Thread Control Block). RISC-V uses Variant I as described by the ELF TLS specification, with `tp` containing the address one past the end of the TCB.

There are various thread local storage models for statically allocated or dynamically allocated thread local storage. [Table 7](#tls-model) lists the thread local storage models:

__Table 7\. TLS models__
| Mnemonic | Model          |
| -------- | -------------- |
| TLS LE   | Local Exec     |
| TLS IE   | Initial Exec   |
| TLS LD   | Local Dynamic  |
| TLS GD   | Global Dynamic |

The program linker in the case of static TLS or the dynamic linker in the case of dynamic TLS allocate TLS offsets for storage of thread local variables.

| |  Global Dynamic model is also known as General Dynamic model. |
| --------------------------------------------------------------- |

#### [](#8-1-5-1-local-exec)8.1.5.1\. Local Exec

Local exec is a form of static thread local storage. This model is used when static linking as the TLS offsets are resolved during program linking.

Variable attribute

`__thread int i __attribute__((tls_model("local-exec")));`

Example assembler load and store of a thread local variable `i` using the`%tprel_hi`, `%tprel_add` and `%tprel_lo` assembler functions. The emitted relocations are in comments.

```asm
    lui  a5,%tprel_hi(i)           # R_RISCV_TPREL_HI20 (symbol)
    add  a5,a5,tp,%tprel_add(i)    # R_RISCV_TPREL_ADD (symbol)
    lw   t0,%tprel_lo(i)(a5)       # R_RISCV_TPREL_LO12_I (symbol)
    addi t0,t0,1
    sw   t0,%tprel_lo(i)(a5)       # R_RISCV_TPREL_LO12_S (symbol)
```

The `%tprel_add` assembler function does not return a value and is used purely to associate the `R_RISCV_TPREL_ADD` relocation with the `add` instruction.

#### [](#8-1-5-2-initial-exec)8.1.5.2\. Initial Exec

Initial exec is is a form of static thread local storage that can be used in shared libraries that use thread local storage. TLS relocations are performed at load time. `dlopen` calls to libraries that use thread local storage may fail when using the initial exec thread local storage model as TLS offsets must all be resolved at load time. This model uses the GOT to resolve TLS offsets.

Variable attribute

`__thread int i __attribute__((tls_model("initial-exec")));`

ELF flags

DF\_STATIC\_TLS

Example assembler load and store of a thread local variable `i` using the`la.tls.ie` pseudoinstruction, with the emitted TLS relocations in comments:

```asm
    la.tls.ie a5,i
    add  a5,a5,tp
    lw   t0,0(a5)
    addi t0,t0,1
    sw   t0,0(a5)
```

The assembler pseudoinstruction:

```asm
    la.tls.ie a5,symbol
```

expands to the following assembly instructions and relocations:

```asm
label:
    auipc a5, 0                   # R_RISCV_TLS_GOT_HI20 (symbol)
    {ld,lw} a5, 0(a5)             # R_RISCV_PCREL_LO12_I (label)
```

#### [](#8-1-5-3-global-dynamic)8.1.5.3\. Global Dynamic

RISC-V local dynamic and global dynamic TLS models generate equivalent object code. The Global dynamic thread local storage model is used for PIC Shared libraries and handles the case where more than one library uses thread local variables, and additionally allows libraries to be loaded and unloaded at runtime using `dlopen`. In the global dynamic model, application code calls the dynamic linker function`__tls_get_addr` to locate TLS offsets into the dynamic thread vector at runtime.

Variable attribute

`__thread int i __attribute__((tls_model("global-dynamic")));`

Example assembler load and store of a thread local variable `i` using the`la.tls.gd` pseudoinstruction, with the emitted TLS relocations in comments:

```asm
    la.tls.gd a0,i
    call  __tls_get_addr@plt
    mv   a5,a0
    lw   t0,0(a5)
    addi t0,t0,1
    sw   t0,0(a5)
```

The assembler pseudoinstruction:

```asm
    la.tls.gd a0,symbol
```

expands to the following assembly instructions and relocations:

```asm
label:
    auipc a0,0                    # R_RISCV_TLS_GD_HI20 (symbol)
    addi  a0,a0,0                 # R_RISCV_PCREL_LO12_I (label)
```

In the Global Dynamic model, the runtime library provides the `__tls_get_addr` function:

```c
extern void *__tls_get_addr (tls_index *ti);
```

where the type tls\_index is defined as:

```c
typedef struct
{
  unsigned long int ti_module;
  unsigned long int ti_offset;
} tls_index;
```

### [](#8-1-6-sections)8.1.6\. Sections

#### [](#8-1-6-1-section-types)8.1.6.1\. Section Types

The defined processor-specific section types are listed in [Table 8](#rv-section-type).

__Table 8\. RISC-V-specific section types__
| Name                   | Value      | Attributes |
| ---------------------- | ---------- | ---------- |
| SHT\_RISCV\_ATTRIBUTES | 0x70000003 | none       |

#### [](#8-1-6-2-special-sections)8.1.6.2\. Special Sections

[Table 9](#rv-section) lists the special sections defined by this ABI.

__Table 9\. RISC-V-specific sections__
| Name              | Type                   | Attributes |
| ----------------- | ---------------------- | ---------- |
| .riscv.attributes | SHT\_RISCV\_ATTRIBUTES | none       |

.riscv.attributes names a section that contains RISC-V ELF attributes.

### [](#8-1-7-program-header-table)8.1.7\. Program Header Table

The defined processor-specific segment types are listed in [Table 10](#rv-seg-type).

__Table 10\. RISC-V-specific segment types__
| Name                  | Value      | Meaning                       |
| --------------------- | ---------- | ----------------------------- |
| PT\_RISCV\_ATTRIBUTES | 0x70000003 | RISC-V ELF attribute section. |

`PT_RISCV_ATTRIBUTES` describes the location of RISC-V ELF attribute section.

### [](#8-1-8-note-sections)8.1.8\. Note Sections

There are no RISC-V specific definitions relating to ELF note sections.

### [](#8-1-9-dynamic-section)8.1.9\. Dynamic Section

The defined processor-specific dynamic array tags are listed in [Table 11](#rv-dyn-tag).

__Table 11\. RISC-V-specific dynamic array tags__
| Name                   | Value      | d\_un  | Executable        | Shared Object     |
| ---------------------- | ---------- | ------ | ----------------- | ----------------- |
| DT\_RISCV\_VARIANT\_CC | 0x70000001 | d\_val | Platform specific | Platform specific |

An object must have the dynamic tag `DT_RISCV_VARIANT_CC` if it has one or more`R_RISCV_JUMP_SLOT` relocations against symbols with the `STO_RISCV_VARIANT_CC`attribute.

`DT_INIT` and `DT_FINI` are not required to be supported and should be avoided in favour of `DT_PREINIT_ARRAY`, `DT_INIT_ARRAY` and `DT_FINI_ARRAY`.

### [](#8-1-10-hash-table)8.1.10\. Hash Table

There are no RISC-V specific definitions relating to ELF hash tables.

### [](#8-1-11-attributes)8.1.11\. Attributes

Attributes are used to record information about an object file/binary that a linker or runtime loader needs to check compatibility.

Attributes are encoded in a vendor-specific section of type SHT\_RISCV\_ATTRIBUTES and name .riscv.attributes. The value of an attribute can hold an integer encoded in the uleb128 format or a null-terminated byte string (NTBS).

RISC-V attributes have a string value if the tag number is odd and an integer value if the tag number is even.

#### [](#8-1-11-1-list-of-attributes)8.1.11.1\. List of attributes

__Table 12\. RISC-V attributes__
| Tag                                 | Value     | Parameter type | Description                                                                     |
| ----------------------------------- | --------- | -------------- | ------------------------------------------------------------------------------- |
| Tag\_RISCV\_stack\_align            | 4         | uleb128        | Indicates the stack alignment requirement in bytes.                             |
| Tag\_RISCV\_arch                    | 5         | NTBS           | Indicates the target architecture of this object.                               |
| Tag\_RISCV\_unaligned\_access       | 6         | uleb128        | Indicates whether to impose unaligned memory accesses in code generation.       |
| Tag\_RISCV\_priv\_spec              | 8         | uleb128        | **Deprecated**, indicates the major version of the privileged specification.    |
| Tag\_RISCV\_priv\_spec\_minor       | 10        | uleb128        | **Deprecated**, indicates the minor version of the privileged specification.    |
| Tag\_RISCV\_priv\_spec\_revision    | 12        | uleb128        | **Deprecated**, indicates the revision version of the privileged specification. |
| Reserved for non-standard attribute | \>= 32768 | \-             | \-                                                                              |

#### [](#8-1-11-2-detailed-attribute-description)8.1.11.2\. Detailed attribute description

##### [](#8-1-11-2-1-how-does-this-specification-describe-public-attributes)8.1.11.2.1\. How does this specification describe public attributes?

Each attribute is described in the following structure:`<Tag name>, <Value>, <Parameter type 1>=<Parameter name 1>[, <Parameter type 2>=<Parameter name 2>]`

##### [](#8-1-11-2-2-tag%5Friscv%5Fstack%5Falign-4-uleb128value)8.1.11.2.2\. Tag\_RISCV\_stack\_align, 4, uleb128=value

Tag\_RISCV\_stack\_align records the N-byte stack alignment for this object. The default value is 16 for RV32I or RV64I, and 4 for RV32E.

Merge Policy

The linker should report erros if link object files with different `Tag_RISCV_stack_align` values.

##### [](#8-1-11-2-3-tag%5Friscv%5Farch-5-ntbssubarch)8.1.11.2.3\. Tag\_RISCV\_arch, 5, NTBS=subarch

Tag\_RISCV\_arch contains a string for the target architecture taken from the option `-march`. Different architectures will be integrated into a superset when object files are merged.

Tag\_RISCV\_arch should be recorded in lowercase, and all extensions should be separated by underline(`_`).

Note that the version information for target architecture must be presented explicitly in the attribute and abbreviations must be expanded. The version information, if not given by `-march`, must agree with the default specified by the tool. For example, the architecture `rv32i` has to be recorded in the attribute as `rv32i2p1` in which `2p1` stands for the default version of its based ISA. On the other hand, the architecture `rv32g` has to be presented as `rv32i2p1_m2p0_a2p1_f2p2_d2p2_zicsr2p0_zifencei2p0` in which the abbreviation `g` is expanded to the `imafd_zicsr_zifencei` combination with default versions of the standard extensions.

The toolchain should normalized the architecture string into canonical order whcih defined in_The RISC-V Instruction Set Manual, Volume I: User-Level ISA, Document_ [elf-bib.adoc#riscv-unpriv](elf-bib.html#riscv-unpriv), expanded with all required extension and should add shorthand extension into architecture string if all expanded extensions are included in architecture string.

| |  A shorthand extension is an extension that does not define any actual instructions, registers or behavior, but requires other extensions, such as thezks extension, which is defined in the cryptographic extension,zks extension is shorthand for zbkb, zbkc, zbkx, zksed and zksh, so the toolchain should normalize rv32i\_zbkb\_zbkc\_zbkx\_zksed\_zksh torv32i\_zbkb\_zbkc\_zbkx\_zks\_zksed\_zksh; g is an exception and does not apply to this rule. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Merge Policy

The linker should merge the different architectures into a superset when object files are merged, and should report errors if the merge result contains conflict extensions.

This specification does not mandate rules on how to merge ISA strings that refer to different versions of the same ISA extension. The suggested merge rules are as follows:

* Merge versions into the latest version of all input versions that are ratified without warning or error.
* The linker should emit a warning or error if input versions have different versions and any extension versions are not ratified.
* The linker may report a warning or error if it detects incompatible versions, even if it’s ratified.

| |  Example of conflicting merge result: RV32IF and RV32IZfinx will be merged into RV32IFZfinx, which is an invalid architecture since F andZfinx conflict. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#8-1-11-2-4-tag%5Friscv%5Funaligned%5Faccess-6-uleb128value)8.1.11.2.4\. Tag\_RISCV\_unaligned\_access, 6, uleb128=value

Tag\_RISCV\_unaligned\_access denotes the code generation policy for this object file. Its values are defined as follows:

| 0 | This object does not perform any unaligned memory accesses. |
| - | ----------------------------------------------------------- |
| 1 | This object may perform unaligned memory accesses.          |

Merge policy

Input file could have different values for the Tag\_RISCV\_unaligned\_access; the linker should set this field into 1 if any of the input objects has been set.

##### [](#8-1-11-2-5-tag%5Friscv%5Fpriv%5Fspec-8-uleb128version)8.1.11.2.5\. Tag\_RISCV\_priv\_spec, 8, uleb128=version

##### [](#8-1-11-2-6-tag%5Friscv%5Fpriv%5Fspec%5Fminor-10-uleb128version)8.1.11.2.6\. Tag\_RISCV\_priv\_spec\_minor, 10, uleb128=version

##### [](#8-1-11-2-7-tag%5Friscv%5Fpriv%5Fspec%5Frevision-12-uleb128version)8.1.11.2.7\. Tag\_RISCV\_priv\_spec\_revision, 12, uleb128=version

| |  Those three attributes are deprecated since RISC-V using extensions with version rather than a single privileged specification version scheme for privileged ISA. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Tag\_RISCV\_priv\_spec contains the major/minor/revision version information of the privileged specification.

Merge policy

The linker should report errors if object files of different privileged specification versions are merged.
