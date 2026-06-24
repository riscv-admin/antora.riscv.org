# 16.1. "Zabha" Extension for Byte and Halfword Atomic Memory Operations, Version 1.0

## [](#16-1-zabha-extension-for-byte-and-halfword-atomic-memory-operations-version-1-0)16.1\. "Zabha" Extension for Byte and Halfword Atomic Memory Operations, Version 1.0

The A-extension offers atomic memory operation (AMO) instructions for _words_,_doublewords_, and _quadwords_ (only for `AMOCAS`). The absence of atomic operations for subword data types necessitates emulation strategies. For bitwise operations, this emulation can be performed via word-sized bitwise AMO\* instructions. For non-bitwise operations, emulation is achievable using word-sized `LR`/`SC` instructions.

Several limitations arise from this emulation approach:

1. In systems with large-scale or Non-Uniform Memory Access (NUMA) configurations, emulation based on `LR`/`SC` introduces issues related to scalability and fairness, particularly under conditions of high contention.
2. Emulation of narrower AMOs through wider AMO\* instructions on non-idempotent IO memory regions may result in unintended side effects.
3. Utilizing wider AMO\* instructions for emulating narrower AMOs risks activating extraneous breakpoints or watchpoints.
4. In the absence of native support for subword atomics, compilers often resort to inlining code sequences to provide the required emulation. This practice contributes to an increase in code size, with consequent impacts on system performance and memory utilization.

The Zabha extension addresses these limitations by adding support for _byte_ and_halfword_ atomic memory operations to the RISC-V Unprivileged ISA. The Zabha extension depends upon the Zaamo standard extension.

### [](#16-1-1-byte-and-halfword-atomic-memory-operation-instructions)16.1.1\. Byte and Halfword Atomic Memory Operation Instructions

Zabha extension provides the `AMO[ADD|AND|OR|XOR|SWAP|MIN[U]|MAX[U]].[B|H]`instructions. If Zacas extension is also implemented, Zabha further provides the`AMOCAS.[B|H]` instructions.

![zabha-ext-wavedrom-reg](_images/zabha-ext-wavedrom-reg-03dfe23087d49235276711642d51aa7df7792a99.svg) 

Byte and halfword AMOs always sign-extend the value placed in `rd`, and ignore the  bits of the original value in `rs2`. The`AMOCAS.[B|H]` instructions similarly ignore the bits of the original value in `rd`.

Similar to the AMOs specified in the A extension, the Zabha extension mandates that the address contained in the `rs1` register must be naturally aligned to the size of the operand. The same exception options as specified in the A extension are applicable in cases where the address is not naturally aligned.

Similar to the AMOs specified in the A and Zacas extensions, the AMOs in the Zabha extension optionally provide release consistency semantics, using the `aq`and `rl` bits, to help implement multiprocessor synchronization.

| |  Zabha omits _byte_ and _halfword_ support for LR and SC due to low utility. |
| ------------------------------------------------------------------------------ |
