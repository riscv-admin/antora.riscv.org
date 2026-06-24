# 7.1. N-Trace Messages (Details)

## [](#7-1-n-trace-messages-details)7.1\. N-Trace Messages (Details)

This chapter provides a detailed description of all N-Trace messages. Overview of all fields in all messages is provided in the [Fields in Messages](#Fields in Messages) table.

Common fields are described in the [Common Fields](#Common Fields) chapter, but fields specific to message **TCODE** values are explained here.

Size of field in **Bits** column may be one or more of the following values:

* **n (1..6)** \- This is an **n**\-bits wide, fixed-length field.
* **Var** \- This is a variable-length, at least 1-bit wide field.
* **Cfg** \- Size of this field depends on configuration setting (**Cfg** fields are always optional).

Each message has its own table showing all fields in that message.

| |  The IEEE-5001 Nexus Standard presents tables with **TCODE** (which is sent first) in the last row. In contrast, this specification shows [Fields in Messages](#Fields in Messages) in the order they are sent (the first field sent is described first), aligning with the order of storage, processing, and text dumps. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#msg2%5FOwnership)7.1.1\. Ownership Message

This message furnishes the requisite context (privileged mode and Context ID, as assigned by the operating system or hypervisor), enabling the decoder to correlate program flow with distinct code segments associated with various programs. Activation of this feature requires explicit enabling of the [trTeContext](#trTeContext) control bit.

Reporting of this information occurs under one of the following three conditions:

* Upon the retirement of an instruction that writes to the **scontext/hcontext** CSR (as reported via `priv` and `context` field on an ingress port).
* In the event of a trap or trap return that results in a change in privilege mode (including **ECALL** and **EBREAK** instructions).
* Following any trace [synchronizing message](#Synchronizing Messages).

| |  Should **hcontext** be implemented, the protocol requires two consecutive messages: the first presenting **hcontext** information and the second **scontext** information. This sequence is important for enabling the decoder to identify the code associated with a specific process. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| |  If tracing multiple OS-es, main decoder may route messages to an OS-specific decoder after seeing **hcontext** and the **scontext** (which follows) will be decoded by decoder determined by **hcontext**. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 1\. Ownership Message Fields__
| Bits    | Name    | Description                                                                                                                                                   |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6       | TCODE   | Value=2(0x2). Standard Transfer Code ([TCODE](#field%5FTCODE)) field.                                                                                         |
| Cfg     | SRC     | Standard Message Source ([SRC](#field%5FSRC)) field.                                                                                                          |
| Var     | PROCESS | This is a variable-length field, which encodes **V** and **PRV** privilege mode bits as well as **scontext/hcontext** CSR values. Details are provided below. |
| Var,Cfg | TSTAMP  | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                                                                                                         |

**Explanations and Notes**

Field PROCESS is encoded as 4 sub-fields (FORMAT, PRV, V, CONTEXT). Bit layout is defined in RTL-like syntax as follows:

PROCESS[x+5:0] = {CONTEXT[x:0], V[0], PRV[1:0], FORMAT[1:0]}

__Table 2\. Encoding of PROCESS field (in LSB to MSB order)__
| Reason                      | FORMAT\[1:0\] | PRV\[1:0\] | V\[0\] | CONTEXT\[x:0\]     |
| --------------------------- | ------------- | ---------- | ------ | ------------------ |
| V and/or PRV change         | 00            | Yes        | Yes    | —                  |
| Reserved                    | 01            | —          | —      | —                  |
| Sync or **scontext** change | 10            | Yes        | Yes    | **scontext** value |
| Sync or **hcontext** change | 11            | Yes        | Yes    | **hcontext** value |

Encodings of **V/PRV** follow ISA privilege mode encodings and are encoded as follows:

U-mode:     V=0, PRV[1:0]=00
S-mode:     V=0, PRV[1:0]=01
M-mode:     V=0, PRV[1:0]=11
VU-mode:    V=1, PRV[1:0]=00
VS-mode:    V=1, PRV[1:0]=01

All unused encodings are reserved.

Examples:

PROCESS=0x3B2 = 0b11101_1_00_10   => scontext=0x1D,V=1,PRV[1:0]=00  (VU-mode)
PROCESS=0xC           0b0_11_00   => V=0,PRV[1:0]=11                (M-mode)

### [](#msg2%5FDirectBranch)7.1.2\. DirectBranch Message

It is applicable to [BTM](#mode%5FBTM) mode only.

This message is generated when the taken direct conditional branch has retired.

__Table 3\. Direct Branch Message Fields__
| Bits    | Name   | Description                                                           |
| ------- | ------ | --------------------------------------------------------------------- |
| 6       | TCODE  | Value=3(0x3). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                  |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.           |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                 |

**Explanations and Notes**

Last instruction in the code block (or blocks) with all inferable instructions (described by I-CNT) is a taken, direct conditional branch instruction. Next PC is determined by decoding the conditional branch instruction opcode to determine the encoded signed offset and adding it to the address of the conditional branch instruction.

| |  Not-taken direct conditional branches and direct unconditional jumps increment I-CNT but do not generate any trace. Direct unconditional jumps change the PC to the destination address of such a jump. The I-CNT enables determination of the PC of the last instruction in the code block(s). |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#msg2%5FIndirectBranch)7.1.3\. IndirectBranch Message

It is applicable to [BTM](#mode%5FBTM) mode only.

This message is generated under two conditions:

* An instruction that causes an indirect unconditional control flow change has retired.
* A trap due to an interrupt or exception is delivered.

__Table 4\. Indirect Branch Message Fields__
| Bits    | Name   | Description                                                           |
| ------- | ------ | --------------------------------------------------------------------- |
| 6       | TCODE  | Value=4(0x4). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                  |
| 2       | B-TYPE | Standard Branch Type ([B-TYPE](#field%5FB-TYPE)) field.               |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.           |
| Var     | U-ADDR | Standard Unique Address ([U-ADDR](#field%5FU-ADDR)) field.            |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                 |

**Explanations and Notes**

The last instruction within the code block(s), as specified by the I-CNT field, either represents an indirect unconditional control flow change (i.e., jump, call, or return) or this packet is generated in response to an exception or interrupt reported on the ingress port. The next PC is determined by applying the [Address Compression](#Address Compression) rules to the U-ADDR field present in this message.

| |  Not-taken conditional branches and direct unconditional jumps do not generate any trace. However, they do increase the I-CNT. Additionally, direct unconditional jumps modify the PC to the destination address specified in the instruction. Consequently, the PC of the last instruction in a code block(s) can be determined. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#msg2%5FError)7.1.4\. Error Message

An error message must be generated in the event of an internal messages FIFO overflow, resulting in the loss of a trace message.

__Table 5\. Error Message Fields__
| Bits    | Name   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6       | TCODE  | Value=8(0x8). Standard Transfer Code ([TCODE](#field%5FTCODE)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 4       | ETYPE  | Standard Error Type (a subset of IEEE-5001 Nexus Standard encoding): **0:** A FIFO overrun has resulted in the loss of one or more messages. **1..7:** Reserved. **8..15:** Designated for Vendor Defined Error(s).                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Var     | ECODE  | Standard Error Code (a subset of IEEE-5001 Nexus Standard encoding). A bit mask that when not equal to 0 may have one or more bits set as follows to indicate errors: **0:** Exact reason unknown/not provided. **xxxxxxx1:** Reserved. **xxxxxx1x:** Reserved (for data trace in future). **xxxxx1xx:** Program Trace Message(s) lost. **xxxx1xxx:** Ownership Trace Message(s) lost. **xxx1xxxx:** Reserved. **xx1xxxxx:** Reserved (for data trace in future). **x1xxxxxx:** Reserved. **1xxxxxxx:** Vendor Defined Message(s) lost. **IMPORTANT:** The field must be generated even if the reported value is always 0, to guarantee that the TSTAMP field aligns at the byte boundary. |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Explanations and Notes**

Error Message must be sent immediately prior to a [synchronizing message](#Synchronizing Messages) as soon as space is available in the Trace Encoder output queue. It is recommended that the timestamp reported in the message corresponds to the moment when the first trace message was dropped; however, this is not a requirement.

| |  This message **is required** as otherwise decoder (even though restart after FIFO overflow is signaled) would not be aware that trace was lost in case of the following sequence of events: Trace is turned off by trigger (or from any other reason). Message reporting 'trace off' event is lost (due to lack of space for it). Here Error Message should be generated (as soon as there is a room) Trace is never restarted. Trace is stopped (this will not generate any trace as trace is turned off). In the above case, Error Message will be the last message in trace stream. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#msg2%5FProgTraceSync)7.1.5\. ProgTraceSync Message

__Table 6\. Program Trace Synchronization Message Fields__
| Bits    | Name   | Description                                                           |
| ------- | ------ | --------------------------------------------------------------------- |
| 6       | TCODE  | Value=9(0x9). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                  |
| 4       | SYNC   | Standard Synchronization Reason ([SYNC](#field%5FSYNC)) field.        |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.           |
| Var     | F-ADDR | Standard Full Address ([F-ADDR](#field%5FF-ADDR)) field.              |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                 |

**Explanations and Notes**

This message is produced at the start or restart of trace. In such instances, the I-CNT field is required to be set to 0\. However, under certain conditions associated with the SYNC parameter (e.g., `External Trace Trigger`), the I-CNT field may not be zero. Instead, it serves to pinpoint the precise Program Counter (PC) location at which the specified trigger or event occurred. Additionally, the F-ADDR field provides the complete PC address at the moment the trigger was activated.

This message may be also generated on linear code for certain synchronization events as described in [Synchronizing Message](#Synchronizing Messages) chapter.

### [](#msg2%5FDirectBranchSync)7.1.6\. DirectBranchSync Message

__Table 7\. Direct Branch with Sync Message Fields__
| Bits    | Name   | Description                                                            |
| ------- | ------ | ---------------------------------------------------------------------- |
| 6       | TCODE  | Value=11(0xB). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                   |
| 4       | SYNC   | Standard Synchronization Reason ([SYNC](#field%5FSYNC)) field.         |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.            |
| Var     | F-ADDR | Standard Full Address ([F-ADDR](#field%5FF-ADDR)) field.               |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                  |

**Explanations and Notes**

This message is produced under the same conditions as the [DirectBranch](#msg2%5FDirectBranch) message. However, it further includes details on the reason for synchronization via the SYNC field, as well as the full Program Counter (PC) address through the F-ADDR field.

This message may be also generated on linear code for certain synchronization events as described in [Synchronizing Message](#Synchronizing Messages) chapter.

### [](#msg2%5FIndirectBranchSync)7.1.7\. IndirectBranchSync Message

__Table 8\. Indirect Branch with Sync Message Fields__
| Bits    | Name   | Description                                                            |
| ------- | ------ | ---------------------------------------------------------------------- |
| 6       | TCODE  | Value=12(0xC). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                   |
| 4       | SYNC   | Standard Synchronization Reason ([SYNC](#field%5FSYNC)) field.         |
| 2       | B-TYPE | Standard Branch Type ([B-TYPE](#field%5FB-TYPE)) field.                |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.            |
| Var     | F-ADDR | Standard Full Address ([F-ADDR](#field%5FF-ADDR)) field.               |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                  |

**Explanations and Notes**

This message is generated in the same conditions as [IndirectBranch](#msg2%5FIndirectBranch) message, but additionally provides a reason for synchronization (SYNC field) and full PC (F-ADDR field).

This message may be also generated (with [B-TYPE](#field%5FB-TYPE)\=0 field) on linear code for certain synchronization events as described in [Synchronizing Message](#Synchronizing Messages) chapter.

### [](#msg2%5FResourceFull)7.1.8\. ResourceFull Message

This message is emitted when either the HIST register is full, or the I-CNT counter became full for a given encoder implementation. This mechanism ensures that no information is lost, as it enables the decoder to reconstruct larger I-CNT and HIST fields by concatenating or adding the emitted values.

__Table 9\. Resource Full Message Fields__
| Bits    | Name        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6       | TCODE       | Value=27(0x1B). Standard Transfer Code ([TCODE](#field%5FTCODE)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Cfg     | SRC         | Standard Message Source ([SRC](#field%5FSRC)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4       | RCODE       | Standard Resource Code field (defines a meaning of RDATA fields). **0:** I-CNT counter has reached max value and is reported in the RDATA\[0\] field. See [I-CNT Details](#I-CNT Details) chapter. **1:** HIST field is full and is reported in the RDATA\[0\] field. See [HIST Field Full](#HIST Field Full) chapter for more details. **2**: **Extension:** HIST field is full and is repeated. RDATA\[0\] field holds HIST value and RDATA\[1\] field holds HREPEAT (History Repeat) value. This optional extension can be enabled via the [trTeInstEnRepeatedHistory](#trTeInstEnRepeatedHistory) control bit. **3..7:** Reserved for future encodings. **8..15:** Designated for vendor specific encodings. |
| Var     | RDATA \[0\] | Standard For RCODE=0, this is the I-CNT field. For RCODE=1 this is the HIST field (with most significant bit=1 being stop-bit). **Extension:** For RCODE=2 this is the HIST field (with most significant bit=1 being stop-bit).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Var,Cfg | RDATA \[1\] | **Extension:** When RCODE=2 is reported this field includes HREPEAT (History Repeat) count.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Var,Cfg | TSTAMP      | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Explanations and Notes**

When RCODE is set to 1, this signifies that the HIST register is full and will not be repeated. Under these circumstances, the HIST field generally encapsulates the maximum number of history bits implemented within the HIST register.

Nonetheless, implementations may opt to include any quantity of history bits in this field, with the range extending from a minimum of 2 bits up to the maximum defined by [NTRACE\_MAX\_HIST](#NTRACE%5FMAX%5FHIST) bits.

Should the I-CNT counter and the HIST register simultaneously reach their respective capacity limits, it is mandatory to emit two successive ResourceFull messages.

### [](#msg2%5FIndirectBranchHist)7.1.9\. IndirectBranchHist Message

__Table 10\. Indirect Branch History Message Fields__
| Bits    | Name   | Description                                                             |
| ------- | ------ | ----------------------------------------------------------------------- |
| 6       | TCODE  | Value=28(0x1C). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                    |
| 2       | B-TYPE | Standard Branch Type ([B-TYPE](#field%5FB-TYPE)) field.                 |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.             |
| Var     | U-ADDR | Standard Unique Address ([U-ADDR](#field%5FU-ADDR)) field.              |
| Var     | HIST   | Standard Branch History ([HIST](#field%5FHIST)) field.                  |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                   |

**Explanations and Notes**

Last instruction in the code block (or blocks) (described by HIST and I-CNT fields) is indirect unconditional control flow change (jump, call, return) instruction or this message is generated when exception or interrupt is reported in the ingress port. See [HIST Field Generation](#HIST Field Generation) and [I-CNT Details](#I-CNT Details) chapters for clarifications.

Next PC is determined by applying the [Address Compression](#Address Compression) rules using the U-ADDR field in this message.

### [](#msg2%5FIndirectBranchHistSync)7.1.10\. IndirectBranchHistSync Message

__Table 11\. Indirect Branch History with Sync Message Fields__
| Bits    | Name   | Description                                                             |
| ------- | ------ | ----------------------------------------------------------------------- |
| 6       | TCODE  | Value=29(0x1D). Standard Transfer Code ([TCODE](#field%5FTCODE)) field. |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                    |
| 4       | SYNC   | Standard Synchronization Reason ([SYNC](#field%5FSYNC)) field.          |
| 2       | B-TYPE | Standard Branch Type ([B-TYPE](#field%5FB-TYPE)) field.                 |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.             |
| Var     | F-ADDR | Standard Full Address ([F-ADDR](#field%5FF-ADDR)) field.                |
| Var     | HIST   | Standard Branch History ([HIST](#field%5FHIST)) field.                  |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                   |

**Explanations and Notes**

This message is generated in the same conditions as [IndirectBranchHist](#msg2%5FIndirectBranchHist) message. However, it further includes details on the reason for synchronization via the SYNC field, as well as the full Program Counter (PC) address through the F-ADDR field.

This message may be also generated (with [B-TYPE](#field%5FB-TYPE)\=0 field) on linear code for certain synchronization events as described in [Synchronizing Message](#Synchronizing Messages) chapter.

### [](#msg2%5FRepeatBranch)7.1.11\. RepeatBranch Message

__Table 12\. Repeat Branch Message Fields__
| Bits    | Name   | Description                                                                                                                                                                                                              |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6       | TCODE  | Value=30(0x1E). Standard Transfer Code ([TCODE](#field%5FTCODE)) field.                                                                                                                                                  |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                                                                                                                                                                     |
| Var     | B-CNT  | Standard Branch Count field. Number of times the previous branch message (without a [SYNC](#field%5FSYNC) field) is repeated. Generated if I-CNT, HIST and target address is the same as in the previous branch message. |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                                                                                                                                                                    |

**Explanations and Notes**

This message is reported when an identical (direct or indirect) branch message is encountered (just to save trace bandwidth). Trace decoder should just repeat handling of previous branch message B-CNT times.

### [](#msg2%5FProgTraceCorrelation)7.1.12\. ProgTraceCorrelation Message

This message is emitted when the trace is disabled or stopped.

__Table 13\. Program Trace Correlation Message Fields__
| Bits    | Name   | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6       | TCODE  | Value=33(0x21). Standard Transfer Code ([TCODE](#field%5FTCODE)) field.                                                                                                                                                                                                                                                                                                                       |
| Cfg     | SRC    | Standard Message Source ([SRC](#field%5FSRC)) field.                                                                                                                                                                                                                                                                                                                                          |
| 4       | EVCODE | Standard Reason to generate Program Correlation: **0:** Entry into Debug Mode. Required (do not send 4 instead!). **1:** Entry into Low-power Mode. Optional. **2..3:** Reserved for data trace. **4:** Program Trace Disabled (hart may be still running). Optional. **5..7:** Reserved for future extensions of N-Trace specification. **8..15:** Designated for vendor specific encodings. |
| 2       | CDF    | Standard number of CDATA fields following it: **0:** Only I-CNT field follows and there is no HIST field. **1:** I-CNT field and single CDATA (HIST) field (for HTM trace). **2..3:** Reserved for future extensions of N-Trace specification.In BTM trace mode CDF must be 0\. In HTM trace mode CDF must be 1 (even if HIST field is empty, encoded as 0x1).                                |
| Var     | I-CNT  | Standard Instruction Count ([I-CNT](#field%5FI-CNT)) field.                                                                                                                                                                                                                                                                                                                                   |
| Var,Cfg | HIST   | Standard Branch History ([HIST](#field%5FHIST)) field. **This field must be present in HTM mode**, so decoder does not need to read CDF to determine its existence.                                                                                                                                                                                                                           |
| Var,Cfg | TSTAMP | Standard Timestamp ([TSTAMP](#field%5FTSTAMP)) field.                                                                                                                                                                                                                                                                                                                                         |

**Explanations and Notes**

It provides a reason (in EVCODE field) plus I-CNT and HIST fields, which allows the decoder to determine the PC where an execution or the trace stopped.

This message includes the EVCODE field, which specifies the reason for generating this message, alongside the I-CNT and HIST fields. These fields collectively enable the decoder to accurately identify the PC location where execution or tracing was halted.
