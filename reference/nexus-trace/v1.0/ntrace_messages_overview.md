# 6.1. N-Trace Messages (Overview)

## [](#6-1-n-trace-messages-overview)6.1\. N-Trace Messages (Overview)

| |  The terminology Indirect Branch as used by the IEEE-5001 Nexus Standard may lead to confusion, given that the RISC-V ISA exclusively permits direct conditional branches, which are always relative. Furthermore, the RISC-V ISA makes a distinction between 'jump' (unconditional flow change) and 'branch' (conditional flow change), a differentiation not observed in Nexus terminology, where any flow change, including exceptions and interrupts, is uniformly referred to as a 'branch'. This specification employs the terms 'branch' and 'jump' as defined by RISC-V ISA. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#6-1-1-fields-in-messages)6.1.1\. Fields in Messages

The table presented below enumerates all message types that can be generated, with each row comprehensively defining the fields associated with a particular message type. Fields that are present in different messages are consistently ordered.

Message field attributes are described using the following terminology:

* **\[n\]**: A fixed-length field that is **n** bits wide.
* **\[Var\]**: A variable-length, non-empty (at least 1-bit wide), field.
* **\[Cfg\]**: A configurable field, where the existence and size depend on the encoder configuration options.

__Table 1\. Fields in Messages__
| Message ID/Field \[size\]                                | [TCODE](#field%5FTCODE) \[6\] | [SRC](#field%5FSRC) \[Cfg\] | [SYNC](#field%5FSYNC) \[4\]                                              | [B-TYPE](#field%5FB-TYPE) \[2\] | Other fields              | [I-CNT](#field%5FI-CNT) \[Var\] | [x-ADDR](#Address Compression) \[Var\] | [HIST](#field%5FHIST) \[Var\] | [TSTAMP](#field%5FTSTAMP) \[Var,Cfg\] |
| -------------------------------------------------------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------ | ------------------------------- | ------------------------- | ------------------------------- | -------------------------------------- | ----------------------------- | ------------------------------------- |
| [Ownership](#msg2%5FOwnership)                           | 2                             | Cfg                         | [PROCESS](#field%5FPROCESS) **\[Var\]**                                  | Cfg                             |                           |                                 |                                        |                               |                                       |
| [DirectBranch](#msg2%5FDirectBranch)                     | 3                             | Cfg                         | Yes                                                                      | Cfg                             |                           |                                 |                                        |                               |                                       |
| [IndirectBranch](#msg2%5FIndirectBranch)                 | 4                             | Cfg                         | Yes                                                                      | Yes                             | [U-ADDR](#field%5FU-ADDR) | Cfg                             |                                        |                               |                                       |
| [Error](#msg2%5FError)                                   | 8                             | Cfg                         | [ETYPE](#field%5FETYPE) **\[4\]** \+ [ECODE](#field%5FECODE) **\[Var\]** | Cfg                             |                           |                                 |                                        |                               |                                       |
| [ProgTraceSync](#msg2%5FProgTraceSync)                   | 9                             | Cfg                         | Yes                                                                      | Yes                             | [F-ADDR](#field%5FF-ADDR) | Cfg                             |                                        |                               |                                       |
| [DirectBranchSync](#msg2%5FDirectBranchSync)             | 11                            | Cfg                         | Yes                                                                      | Yes                             | [F-ADDR](#field%5FF-ADDR) | Cfg                             |                                        |                               |                                       |
| [IndirectBranchSync](#msg2%5FIndirectBranchSync)         | 12                            | Cfg                         | Yes                                                                      | Yes                             | Yes                       | [F-ADDR](#field%5FF-ADDR)       | Cfg                                    |                               |                                       |
| [ResourceFull](#msg2%5FResourceFull)                     | 27                            | Cfg                         | [RCODE](#field%5FRCODE) **\[4\]** \+ [RDATA](#field%5FRDATA) **\[Var\]** | Cfg                             |                           |                                 |                                        |                               |                                       |
| [IndirectBranchHist](#msg2%5FIndirectBranchHist)         | 28                            | Cfg                         | Yes                                                                      | Yes                             | [U-ADDR](#field%5FU-ADDR) | Yes                             | Cfg                                    |                               |                                       |
| [IndirectBranchHistSync](#msg2%5FIndirectBranchHistSync) | 29                            | Cfg                         | Yes                                                                      | Yes                             | Yes                       | [F-ADDR](#field%5FF-ADDR)       | Yes                                    | Cfg                           |                                       |
| [RepeatBranch](#msg2%5FRepeatBranch)                     | 30                            | Cfg                         | [B-CNT](#field%5FB-CNT) **\[Var\]**                                      | Cfg                             |                           |                                 |                                        |                               |                                       |
| [ProgTraceCorrelation](#msg2%5FProgTraceCorrelation)     | 33                            | Cfg                         | [EVCODE](#field%5FEVCODE) **\[4\]** \+ [CDF](#field%5FCDF) **\[2\]**     | Yes                             | **Cfg**                   | Cfg                             |                                        |                               |                                       |
| [Vendor Defined](#msg%5Fother)                           | 56..62                        | Cfg                         | Designated for use by Vendor Defined messages                            |                                 |                           |                                 |                                        |                               |                                       |
| [Reserved](#msg%5Fother)                                 | other                         | Cfg                         | Reserved for future extensions of N-Trace specification                  |                                 |                           |                                 |                                        |                               |                                       |

| |  Any message may include the optional [TSTAMP](#field%5FTSTAMP) **\[Var,Cfg\]** field as the very last field of a message. It must be enabled by [trTsEnable](#trTsEnable) control bit. Timestamp field always starts at byte-boundary (as it is always preceded by variable-length field). See [Timestamp Reporting](#Timestamp Reporting) chapter for more details. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  Messages marked as **Reserved** or **Vendor Defined** should be ignored by decoders interested in program flow only. However, decoders should provide an option to display/dump them and/or generate a warning as such a message may be seen when trace capture is corrupted.**Vendor Defined** messages can be used for prototyping, debugging, validation and maintenance purposes. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Reference code header [NexRvMsg.h](https://github.com/riscv-non-isa/tg-nexus-trace/blob/main/refcode/c/NexRvMsg.h) defines all N-Trace messages in machine-readable format. Here is small snipped from this file as an example:

```c
  // Naming:
  //    NEXM=Nexus Message, BEG/END=Beginning/End of definition.
  //    SRC=Message source (system-field). Name of an option given.
  //    FLD/VAR=Fixed/variable size field.
  //    ADR=Special case of variable field (without least significant bit).
  //    CFG=Configurable, Name of an option given.
  NEXM_BEG(IndirectBranchSync, 12)
    NEXM_SRC(SrcBits)                         // Configurable
    NEXM_FLD(SYNC, 4)
    NEXM_FLD(BTYPE, 2)
    NEXM_VAR(ICNT)
    NEXM_ADR(FADDR)
    NEXM_VAR(TSTAMP)
  NEXM_END()

  NEXM_BEG(ResourceFull, 27)
    NEXM_SRC(SrcBits)                         // Configurable
    NEXM_FLD(RCODE, 4)
    NEXM_VAR(RDATA)
    NEXM_VAR_CFG(HREPEAT, EnaRepeatedHistory) // Configurable
    NEXM_VAR(TSTAMP)
  NEXM_END()

  NEXM_BEG(IndirectBranchHist, 28)
    NEXM_SRC(SrcBits)                         // Configurable
    NEXM_FLD(BTYPE, 2)
    NEXM_VAR(ICNT)
    NEXM_ADR(UADDR)
    NEXM_VAR(HIST)
    NEXM_VAR(TSTAMP)
  NEXM_END()
```

| |  Reference code is using plain C-style identifiers, so the field name as **B-TYPE** will become **BTYPE**. |
| ------------------------------------------------------------------------------------------------------------ |

### [](#6-1-2-common-fields)6.1.2\. Common Fields

The table below provides details for fields which are used in more than one message type. Fields which are present in only one message are described with each message.

__Table 2\. Details of Common Fields__
| Name                             | Bits    | Description                    | Values/Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fields used in many messages** |         |                                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TCODE                            | 6       | Transfer Code                  | Message header that identifies the number and/or size of fields to be transferred, and how to interpret each of the fields following it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| SRC                              | **Cfg** | Source of Message Transmission | Width of SRC field is defined by [trTeSrcBits](#trTeSrcBits) control field and it may be enabled/disabled by [trTeInhibitSrc](#trTeInhibitSrc) control bit. This optional field is used to identify the source of the message transmission. In configurations that comprise only a single hart, this field need not be transmitted. For devices that comprise multiple harts, this field must be transmitted (if enabled) as part of the message to identify the source of the message transmission. The transmitted SRC field size should be the same for all enabled trace encoders sharing a trace stream. |
| SYNC                             | 4       | Reason for Synchronization     | Encodings and details are provided in the [Synchronizing Messages](#Synchronizing Messages) chapter. **NOTE:** The SYNC field is always sent together with the [F-ADDR](#field%5FF-ADDR) field, so decoding may start from a message containing the SYNC field.                                                                                                                                                                                                                                                                                                                                               |
| B-TYPE                           | 2       | Branch Type                    | Reason for indirect flow change: **0:** Indirect control flow change (jump, call or return) or in a [synchronizing message](#Synchronizing Messages) not related to code execution. **1:** Exception or interrupt (if the encoder is not capable of reporting 2 and 3). **2:** **Extension:** Exception **3:** **Extension:** Interrupt **NOTE:** Either 1-only or both 2 and 3 should be implemented and consistently reported. Extended values 2 and 3 allow trace tools to distinguish exceptions and interrupts easily.                                                                                   |
| I-CNT                            | **Var** | Instruction Count              | As RISC-V allows variable-length instructions, this is the number of 16-bit (INST\_LEN/2) instruction units executed/retired since the I-CNT counter was transmitted or reset. See [I-CNT Details](#I-CNT Details) chapter for more details.                                                                                                                                                                                                                                                                                                                                                                  |
| F-ADDR                           | **Var** | Full Target Address            | Full PC without the least significant bit. The least significant bit is not reported as it is always 0\. See [Address Compression](#Address Compression) chapter for more details. **NOTE:** The F-ADDR field is always sent together with the [SYNC](#field%5FSYNC) field.                                                                                                                                                                                                                                                                                                                                   |
| U-ADDR                           | **Var** | Unique part of Target Address  | Unique part of PC address (XOR with recently reported address). See [Address Compression](#Address Compression) chapter for more details.The U-ADDR field is always sent together with the [B-TYPE](#field%5FB-TYPE) field.                                                                                                                                                                                                                                                                                                                                                                                   |
| HIST                             | **Var** | Direct Branch History map      | Most significant bit (always 1) serves as a 'stop-bit', the least significant bit denotes the last direct conditional branch. See [HIST Field Generation](#HIST Field Generation) chapter for more details.                                                                                                                                                                                                                                                                                                                                                                                                   |
| TSTAMP                           | **Var** | Timestamp (optional)           | It must be enabled by [trTsEnable](#trTsEnable) control bit. See [Timestamp Reporting](#Timestamp Reporting) chapter for more details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

IEEE-5001 Nexus Standard does not define limits for variable-length fields, but N-Trace provides some limits. It will help to write efficient decoding software but is not limiting hardware in any way.

__Table 3\. Maximum Field Sizes__
| Field          | Symbol               | Bits | Description                                                                                                                          |
| -------------- | -------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| SRC            | NTRACE\_MAX\_SRC     | 12   | Determined by size of Trace Control register field. Enough for 4096 (4K) trace sources.                                              |
| I-CNT          | NTRACE\_MAX\_ICNT    | 22   | Usually a smaller value will be sufficient. An overflow bit may be used for efficient I-CNT full detection.                          |
| F-ADDR, U-ADDR | NTRACE\_MAX\_ADDR    | 63   | Only 63 bits suffice as the least significant bit of an instruction address is always 0 and does not need to be reported.            |
| HIST           | NTRACE\_MAX\_HIST    | 32   | It includes stop-bit. This size is optimal for not wasting any bits in very often used [ResourceFull](#msg%5FResourceFull) messages. |
| TSTAMP         | NTRACE\_MAX\_TSTAMP  | 64   | It is certainly big enough. It corresponds to architecture defined timer and cycle count registers.                                  |
| HREPEAT        | NTRACE\_MAX\_HREPEAT | 18   | Assure some trace is periodically generated for very long loops.                                                                     |
| B-CNT          | NTRACE\_MAX\_BCNT    | 18   | Assure some trace is periodically generated for very long loops.                                                                     |
