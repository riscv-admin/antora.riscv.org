# Preface

## [](#preface)Preface

**_Preface to Version 20250616_**

Clarifications only - no changes to normative behaviour.

* Updated [Instruction Trace Encoder Output Packets](payload.html#packets) and [Code fragment and transport](fragmentCodeAndTransport.html#fragments) to reference the [Unformatted Trace & Diagnostic Data Packet Encapsulation for RISC-V Specification](https://github.com/riscv-non-isa/e-trace-encap/releases/latest/);
* Removed ambiguity between 'last' and 'final'. Last was previously used to mean both the instruction before the current one, and the final instruction traced;
* Clarified behaviour when trace-on and trace-off triggers occur both occur in the same cycle (see [Using trigger outputs from the Debug Module](ingressPort.html#sec:trigger));
* Clarified that full synchronization also takes place on a privilege change (see [Synchronization](branchTrace.html#sec:synchronization) and [Format 3 thaddr, address and privilege fields](payload.html#sec:thaddr));
* Reworded jump classifications in jump classifications in [Instruction Trace Interface requirements](ingressPort.html#sec:InstructionInterfaceRequirements) to align with terminology used in other specifications;
* Clarified when to issue sync-support packet when trace is enabled (see [Format 3 subformat 3 - Support](payload.html#sec:format33));
* Clarified that branch\_map can be set to 31 any time an address needs to be reported and the branch map is full (see [Format 1 packets](payload.html#sec:format1));
* Updated reference encoding algorithm to generalize resync behaviour and add missing trap conditions (see [Reference Compressed Branch Trace Algorithm](exampleAlgorithm.html#Algorithm));
* Clarified that implicit returns are not stored in the jump target cache (see [Jump target cache mode](branchTrace.html#sec:jump-cache));
* Updated decoder to remove ECALL, EBREAK and C.EBREAK from is\_uninferrable\_jump function. Including them is harmless but unnecessary, as these instrucitons don’t retire (see [Decoder](decoder.html#Decoder));
* Corrected description of why the EPC is not always reported (see [Format 3 thaddr, address and privilege fields](payload.html#sec:thaddr)).
* Minor clarifications, formatting and typo fixes.

**_Preface to Version 20240419_**

Formatting and typo fixes.

**_Preface to Version 20240305_**

First version in AsciiDoc format.

**_Preface to Version 20231215_**

Clarifications only - no changes to normative behaviour.

* Control field definitions removed from section 2, which now references the [RISC-V Trace Control Interface Specification](#https://github.com/riscv-non-isa/e-trace-encap/releases/latest/)
* Added detail on handling of multi-load/store instructions for data trace to [Data Trace Interface requirements](ingressPort.html#sec:DataInterfaceRequirements).
* Removed references to tail-calls in jump classifications in [Instruction Trace Interface requirements](ingressPort.html#sec:InstructionInterfaceRequirements).
* Corrected typos where `lrid` was inadvertently refered to by an earlier name (`index`) in [Load and Store](dataTracePayload.html#sec:data-loadstore).
* Corrected reference decoder in [Decoder](decoder.html#Decoder) to cover a corner-case related to trap returns.

**_Preface to Version 2.0_**

Ratified version of the Efficient Trace for RISC-V specification.
