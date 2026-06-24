# 1.1. Introduction

## [](#1-1-introduction)1.1\. Introduction

This specification delineates the operation parameters according the general PLIC architecture defined in the RISC-V platform-level interrupt controller (PLIC) specification (was removed from [RISC-V Privileged Spec v1.11-draft](https://github.com/riscv/riscv-isa-manual/releases/download/draft-20181201-5449851/riscv-privileged.pdf)) to work in the context of RISC-V systems.  
The PLIC multiplexes various device interrupts onto the external interrupt lines of Hart contexts, with hardware support for interrupt priorities. PLIC supports up-to 1023 interrupts (0 is reserved) and 15872 contexts, but the actual number of interrupts and context depends on the PLIC implementation. However, the implementation must adhere to the offset of each register within the PLIC operation parameters. The PLIC which claimed as PLIC-Compliant standard PLIC should follow the implementations mentioned in sections below.
