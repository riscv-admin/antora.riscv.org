# undefined

**_Preface to Version 2.1 2026-10-20_**

* [Ingress Port Interface](ingressPort.html#Interface) contents replaced with a reference to the [RISC-V Hart to Trace Interface (RHTI) Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf), V1.0.  
   * This introduces a small normative change related to multi-memory access instructions; see [Ingress Port Interface](ingressPort.html#Interface) for details.
* Added [Standard Support Packet extension](extensions.html#sec:ext-support), which describes the Standard Support Packet extension to Version 2.0.
* Added [Implicit Return extension](extensions.html#sec:ext-impret), which describes the Implicit Return extension to Version 2.0.
* Added [Data Trace of Multiple-Memory Access and Compare and Swap](extensions.html#sec:ext-mmacas), which describes the Data Trace of Multiple-Memory Access and Compare and Swap extension to Version 2.0.
* Updated the decoder pseudo-code in [Decoder](decoder.html#Decoder) to include support for Implicit Return, Branch Predictor and Jump Target Cache optional modes.
* Corrections to [Encoder Control](control.html#encoderControl): **trTeInstMode** hardcoded to 6 (not 7 as previously stated), **trTeContext** and **trTeInstImplicitReturnMode** changed to optional rather than not-applicable.
* Fixed error in **branch\_map** descriptions in tables in [Format 1](payload.html#sec:format1) introduced during earlier translation from LaTeX to asciidoc: values for branch taken or not taken were missing.
* Added informative recommendation regarding the use of partial timestamps in packet encapsulation to [Timestamping](timestamping.html#ch:timestamping).
* Remove historical "Future directions" chapter.
* Minor clarifications, formatting and typo fixes.

**_Preface to Version 20250616_**

Clarifications only - no changes to normative behaviour.

* Updated [Packets](payload.html#packets) and [Fragments](fragmentCodeAndTransport.html#fragments) to reference the [Unformatted Trace & Diagnostic Data Packet Encapsulation for RISC-V Specification](https://docs.riscv.org/reference/trace-encap/v1.0/%5Fattachments/e-trace-encap.pdf);
* Removed ambiguity between 'last' and 'final'. Last was previously used to mean both the instruction before the current one, and the final instruction traced;
* Clarified behaviour when trace-on and trace-off triggers occur both occur in the same cycle (now in [RHTI Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf));
* Clarified that full synchronization also takes place on a privilege change (see [Synchronization](branchTrace.html#sec:synchronization) and [Thread Address](payload.html#sec:thaddr));
* Reworded jump classifications to align with terminology used in other specifications (now in [RHTI Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf));
* Clarified when to issue sync-support packet when trace is enabled (see [Format 33](payload.html#sec:format33));
* Clarified that branch\_map can be set to 31 any time an address needs to be reported and the branch map is full (see [Format 1](payload.html#sec:format1));
* Updated reference encoding algorithm to generalize resync behaviour and add missing trap conditions (see [Algorithm](exampleAlgorithm.html#Algorithm));
* Clarified that implicit returns are not stored in the jump target cache (see [Jump Target Cache](branchTrace.html#sec:jump-cache));
* Updated decoder to remove ECALL, EBREAK and C.EBREAK from is\_uninferrable\_jump function. Including them is harmless but unnecessary, as these instrucitons don’t retire (see [Decoder](decoder.html#Decoder));
* Corrected description of why the EPC is not always reported (see [Thread Address](payload.html#sec:thaddr)).
* Minor clarifications, formatting and typo fixes.

**_Preface to Version 20240419_**

Formatting and typo fixes.

**_Preface to Version 20240305_**

First version in AsciiDoc format.

**_Preface to Version 20231215_**

Clarifications only - no changes to normative behaviour.

* Control field definitions removed from section 2, which now references the [RISC-V Trace Control Interface Specification](https://docs.riscv.org/reference/trace-control-interface/v1.0/%5Fattachments/RISC-V-Trace-Control-Interface.pdf), V1.0
* Added detail on handling of multi-load/store instructions for data trace (now in [RHTI Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf)).
* Removed references to tail-calls in jump classifications (now in [RHTI Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf)).
* Corrected typos where `lrid` was inadvertently refered to by an earlier name (`index`) in [Data Trace of Load/Store](dataTracePayload.html#sec:data-loadstore).
* Corrected reference decoder in [Decoder](decoder.html#Decoder) to cover a corner-case related to trap returns.

**_Preface to Version 2.0_**

Ratified version of the Efficient Trace for RISC-V specification.
