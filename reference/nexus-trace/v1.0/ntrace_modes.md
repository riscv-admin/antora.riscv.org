# 5.1. Main N-Trace Trace Modes

## [](#5-1-main-n-trace-trace-modes)5.1\. Main N-Trace Trace Modes

RISC-V N-Trace defines two instruction trace modes:

* **Branch Trace Messaging (BTM)** \- each taken direct conditional branch generates a minimum two-byte message. However, repeated branches can be aggregated and reported as a single message with a count, rather than numerous identical messages.

* **History Trace Messaging (HTM)** \- every direct conditional branch, whether taken or not-taken, contributes a single bit to the history buffer, significantly enhancing the trace efficiency.

The encoder is required to implement at least one of these modes. Both may be supported, but is not required.

| |  Above modes correspond to the following IEEE-5001 Nexus Standard instruction trace modes: **Branch Trace Messaging using Traditional Messages** **Branch Trace Messaging using Branch History Messages** |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  The IEEE-5001 Nexus Standard defines different conformance levels. These levels are not directly applicable to N-Trace as Nexus levels always include debug levels. Different N-Trace options are provided in [N-Trace Specific Trace Controls](#N-Trace Specific Trace Controls) chapter. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
