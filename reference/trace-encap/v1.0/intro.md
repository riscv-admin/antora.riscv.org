# 2.1. Introduction

## [](#intro)2.1\. Introduction

The [Efficient Trace for RISC-V](https://github.com/riscv-non-isa/riscv-trace-spec/releases/download/v2.0rc2/riscv-trace-spec.pdf) (E-trace) standard defines packet payloads for instruction and data trace but does not fully define how this should be encapsulated into fully formed packets for transport, nor how instruction and data trace should be differentiated. Chapter 7 gives some illustrative examples but this is insufficiently detailed and informative only.

Although the primary motivation for developing this standard was to define an encapsulation format for E-Trace packets that allows tools to parse and decode them in a standard manner, the encapsulation format defined in this document is agnostic to the packet payload structure and meaning and so can be used for any kind of unformatted data. In addition to E-trace, it could also be used for a wide variety of other uses, for example: performance counter metrics, trace or other diagnostic data from a bus fabric monitor or on-chip logic analyser.

It is not suitable for data that has already been formatted into packets, such as N-Trace, which inserts a 2-bit MSEO formatting code into each byte.

This specification defines an encapsulation format suitable for use with a variety of transport mechanisms, including but not limited to AMBA Advanced Trace Bus (ATB) and Siemens' Messaging Infrastructure.

Examples of how trace packets can be routed for transport is given in the 'Trace Components' subsection of the [RISC-V Trace Control Interface Specification](https://github.com/riscv-non-isa/tg-nexus-trace/blob/master/docs/RISC-V-Trace-Control-Interface.adoc).

### [](#2-1-1-glossary)2.1.1\. Glossary

* **ATB** \- Advanced Trace Bus, a protocol described in ARM document IHI0032B;
* **E-Trace** \- Abbreviation for [Efficient Trace for RISC-V](https://github.com/riscv-non-isa/riscv-trace-spec/releases/download/v2.0rc2/riscv-trace-spec.pdf);
* **PIB** \- Pin Interface Block, a parallel or serial off-chip trace port feeding into a trace probe, as defined in the [RISC-V Trace Control Interface Specification](https://github.com/riscv-non-isa/tg-nexus-trace/blob/master/docs/RISC-V-Trace-Control-Interface.adoc);
* **N-Trace** \- Abbreviation for [RISC-V N-Trace (Nexus-based trace) Specification](https://github.com/riscv-non-isa/tg-nexus-trace/blob/master/docs/RISC-V-N-Trace.adoc)
* **Trace Encoder** \- Hardware module that accepts execution information from a hart and generates a stream of trace packets;
* **TFP** \- Trace Formatter protocol, a trace framing protocol described in ARM document IHI0029E. Also adopted by MIPI as Trace Wrapper Protocol (TWP);
* **TWP** \- See **TFP**.
