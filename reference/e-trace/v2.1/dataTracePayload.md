# 7.1. Data Trace Encoder Output Packets

## [](#dataTracePackets)7.1\. Data Trace Encoder Output Packets

Data trace packets must be differentiated from instruction trace packets, and the means by which this is accomplished is dependent on the trace transport infrastructure. Several possibilities exist: One option is for instruction and data trace to be issued using different IDs (for example, if using ATB transport, different **ATID** values). Alternatively, an additional field as part of the packet encapsulation can be used (Siemens uses a 2-bit **msg\_type** field to differentiate different trace types from the same source).

By default, all data trace packets include both address and data. However, provision is made for run-time configuration options to exclude either the address or the data, in order to minimize trace bandwidth. For example, if filtering has been configured to only trace from a specific data access address there is no need to report the address in the trace. Alternatively, the user may want to know which locations are accessed but not care about the data value. Information about whether address or data are omitted is not encoded in the packets themselves as it does not change dynamically, and to do so would reduce encoding efficiency. The run-time configuration should be reported in the Format 3, subformat 3 support packet (see [Format 3 Subformat 3](payload.html#sec:format33)). The following sections include examples for all three cases.

As outlined in the "Data Trace Interface requirements" section of the [RHTI Specification](https://docs.riscv.org/reference/hti/v1.0/%5Fattachments/riscv-hart-trace-interface.pdf), two different signaling protocols between the RISC-V hart and the encoder are supported: _unified_ and _split_. Accordingly, both unified and split trace packets are defined. Where the _split_ signalling is supported, data accesses with a load data component normally result in two packets, one each for the request and data phases. However, if address or data are omitted as described above, such that all the required information is from a single phase, then the appropriate unified packet format will be used. For example, if the data value is omitted then the _Unified load or store with address only_ packet format will be used even if _split_ signalling is used. Similarly, if the address is omitted then _Unified load or store with data only_ is used.

| |  In the following tables, "clog2" is an abbreviation for "ceiling of log2". |
| ----------------------------------------------------------------------------- |

| |  The packets described in this section do not support data trace for harts that support the Zcmp, Vector or Zacas extensions, and are deprecated in favour of the packets defined in the [MMA/CAS extension](extensions.html#sec:ext-mmacas) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sec:data-loadstore)7.1.1\. Load and Store

#### [](#sec:loadstore-format)7.1.1.1\. format field

Types of data trace packets are differentiated by the **format** field. This field is 2 bits wide if only unified loads and stores are supported, or 3 bits otherwise.

Unified loads and split load request phase share the same code because the encoder will support one or the other, indicated by a discoverable parameter.

Data accesses aligned to their size (e.g. 32-bit loads aligned to 32-bit word boundaries) are expected to be commonplace, and in such cases, encoding efficiency can be improved by not reporting the redundant LSBs of the address.

__Table 1\. Packet format for Unified load or store, with address and data__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                                                                      |
| -------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 2 or 3                                        | Transaction type:000: Unified load or split load address, aligned001: Unified load or split load address, unaligned010: Store, aligned address011: Store, unaligned address(other codes select other packet formats) |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                                                                     |
| **diff**       | 2                                             | 00: Full address and data (sync)01: Differential address, XOR-compressed data10: Differential address, full data11: Differentail address, differential data                                                          |
| **data\_len**  | **size**                                      | Number of bytes of data is **data\_len** \+ 1                                                                                                                                                                        |
| **data**       | 8 \* (**data\_len** \+ 1)                     | Data                                                                                                                                                                                                                 |
| **address**    | _daddress\_width\_p_                          | Byte address if format is unaligned, otherwise shift left by **size** to recover byte address                                                                                                                        |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit data values from data trace packets (trTeDataControl.trTeDataNoValue is 1), even with _split_ siganalling.

__Table 2\. Packet format for Unified load or store, with address only__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                                                                     |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 2 or 3                                        | Transaction type000: Unified load or split load address, aligned001: Unified load or split load address, unaligned010: Store, aligned address011: Store, unaligned address(other codes select other packet formats) |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                                                                    |
| **diff**       | 1                                             | 0: Full address (sync)1: Differential address                                                                                                                                                                       |
| **address**    | _daddress\_width\_p_                          | Byte address if format is unaligned, otherwise shift left by **size** to recover byte address                                                                                                                       |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit address values from data trace packets (trTeDataControl.trTeDataNoAddr is 1), even with _split_ siganalling.

__Table 3\. Packet format for Unified load or store, with data only__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                                                                     |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 2 or 3                                        | Transaction type000: Unified load or split load address, aligned001: Unified load or split load address, unaligned010: Store, aligned address011: Store, unaligned address(other codes select other packet formats) |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                                                                    |
| **diff**       | 1 or 2                                        | 00: Full data (sync)01: Compressed data (XOR if 2 bits)10: reserved11 : Differential data                                                                                                                           |
| **data**       | _data\_width\_p_                              | Data                                                                                                                                                                                                                |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet is used for the request phase of a split load.

__Table 4\. Packet format for Split load - request phase__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                             |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type000: Unified load or split load address, aligned001: Unified load or split load address, unaligned(other codes select other packet formats) |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                            |
| **lrid**       | _lrid\_width\_p_                              | Load request ID                                                                                                                                             |
| **diff**       | 1                                             | 0: Full address (sync)1: Differential address                                                                                                               |
| **address**    | _daddress\_width\_p_                          | Byte address if format is unaligned, otherwise shift left by **size** to recover byte address                                                               |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet is used for the data phase of a split load and split atomic.

__Table 5\. Packet format for Split load - data phase__
| **Field name** | **Bits**                                      | **Description**                                                               |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type100: split load data(other codes select other packet formats) |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                              |
| **lrid**       | _lrid\_width\_p_                              | Load request ID                                                               |
| **resp**       | 2                                             | 00: Error (no data)01: XOR-compressed data10: Full data11: Differential data  |
| **data**       | _data\_width\_p_                              | Data                                                                          |

#### [](#sec:loadstore-size)7.1.1.2\. size field

The width of this field is 2 bits if max size is 64-bits (_data\_width\_p_< 128), 3 bits if wider.

#### [](#sec:loadstore-diff)7.1.1.3\. diff field

Unlike instruction trace, compression options for data trace are somewhat limited. Following a synchronization instruction trace packet, the first data trace packet for a given access size must include the full (unencoded) data access address. Thereafter, the address may be reported differentially (i.e. address of this data access, minus the address of the previous data access of the same size).

Similarly, following a synchronization instruction trace packet, the first data trace packet for a given access size must include the full (unencoded) data value. Beyond this, data may be encoded or unencoded depending on whichever results in the most efficient represenation. Implementors may chose to offer one of XOR or differential compression, or both. XOR compression will be simpler to implement, and avoids the need for performing subtraction of large values. Encoded values are determined on a per access size basis. For example, when using XOR compression, the address of this data access, XOR the address of the previous data access of the same size.

If only one data compression type is offered, the **diff** field can be 1 bit wide rather than 2 for [Table 3](#tab:te%5Fdatadx0y2).

#### [](#sec:loadstore-datalen)7.1.1.4\. data\_len field

However the data is compressed, upper bytes that are all the same value do not need to be included in the packet; the decoder can recreate the full-width value by sign extending from the most significant received bit. In cases where **data** is not the final field in the packet, the width of **data** is indicated by this field.

### [](#sec:data-atomic)7.1.2\. Atomic

#### [](#sec:atomic-size)7.1.2.1\. size field

Strictly, **size** could be just one bit as atomics are currently either 32 or 64 bits. Defining as per regular loads and stores provisions for future extensions (proprietary or otherwise) that support smaller atomics.

__Table 6\. Packet format for Unified atomic with address and data__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                                             |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type110: Unified atomic or split atomic address(other codes select other packet formats)                                                                                        |
| **subtype**    | 3                                             | Atomic sub-type000: Swap001: ADD010: AND011: OR100: XOR101: MAX110: MIN111: reserved                                                                                                        |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                                            |
| **diff**       | 2                                             | 00: Full address and data/operand (sync)01: Differential address, XOR-compressed data/operand10: Differential address, full data/operand11: Differential address, differential data/operand |
| **op\_len**    | **size**                                      | Number of bytes of operand is **op\_len** \+ 1                                                                                                                                              |
| **operand**    | 8 \* (**op\_len** \+ 1)                       | Operand. Value from rs2 before operator applied                                                                                                                                             |
| **data\_len**  | **size**                                      | Number of bytes of data is **data\_len** \+ 1                                                                                                                                               |
| **data**       | 8 \* (**data\_len** \+ 1)                     | Data                                                                                                                                                                                        |
| **address**    | _daddress\_width\_p_                          | Address, aligned and encoded as per size                                                                                                                                                    |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit data values from data trace packets (trTeDataControl.trTeDataNoValue is 1), even with _split_ siganalling.

__Table 7\. Packet format for Unified atomic with address only__
| **Field name** | **Bits**                                      | **Description**                                                                                       |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type110: Unified atomic or split atomic address(other codes select other packet formats)  |
| **subtype**    | 3                                             | Atomic sub-type000: Swap001: ADD010: AND011: OR100: XOR101: MAX110: MIN111: conditional store failure |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                      |
| **diff**       | 1                                             | 0: Full address1: Differential address                                                                |
| **address**    | _daddress\_width\_p_                          | Address, aligned and encoded as per size                                                              |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit address values from data trace packets (trTeDataControl.trTeDataNoAddr is 1), and supports _unified_ signalling.

__Table 8\. Packet format for Unified atomic with data and operand only__
| **Field name** | **Bits**                                      | **Description**                                                                                                  |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type110: Unified atomic or split atomic address(other codes select other packet formats)             |
| **subtype**    | 3                                             | Atomic sub-type000: Swap001: ADD010: AND011: OR100: XOR101: MAX110: MIN111: reserved                             |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                 |
| **diff**       | 1 or 2                                        | 00: Full data/operand (sync)01: Compressed data/operand (XOR if 2 bits)10: reserved11: Differential data/operand |
| **op\_len**    | **size**                                      | Number of bytes of operand is **op\_len** \+ 1                                                                   |
| **operand**    | 8 \* (**op\_len** \+ 1)                       | Operand. Value from rs2 before operator applied                                                                  |
| **data**       | _data\_width\_p_                              | Data                                                                                                             |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#sec:atomic-diff)7.1.2.2\. diff field

See [7.1.1.3\. diff field](#sec:loadstore-diff).

#### [](#sec:atomic-operand)7.1.2.3\. operand field

The operand value for the atomic operation. Uncompressed, although upper bytes that are all the same value do not need to be included in the packet; the decoder can recreate the full-width value by sign extending from the most significant received bit; see [7.1.2.4\. data\_len and op\_len fields](#sec:atomic-datalen).

#### [](#sec:atomic-datalen)7.1.2.4\. data\_len and op\_len fields

Width of **data and \*operand** fields respectively. See **[7.1.1.4\. data\_len field](#sec:loadstore-datalen).**

The following packet is used for the request phase of a split atomic:

__Table 9\. Packet format for Split atomic - request phase__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                         |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type110: Unified atomic or split atomic address(other codes select other packet formats)                                                                    |
| **subtype**    | 3                                             | Atomic sub-type000: Swap001: ADD010: AND011: OR100: XOR101: MAX110: MIN111: reserved                                                                                    |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                        |
| **lrid**       | _lrid\_width\_p_                              | Load request ID                                                                                                                                                         |
| **diff**       | 1 or 2                                        | 00: Full address and operand (sync)01: Differential address, XOR-compressed operand10: Differential address, full operand11: Differential address, differential operand |
| **op\_len**    | **size**                                      | Number of bytes of operand is **op\_len** \+ 1                                                                                                                          |
| **operand**    | 8 \* (**op\_len** \+ 1)                       | Operand. Value from rs2 before operator applied                                                                                                                         |
| **address**    | _daddress\_width\_p_                          | Address, aligned and encoded as per size                                                                                                                                |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit address values from data trace packets (trTeDataControl.trTeDataNoAddr is 1).

__Table 10\. Packet format for Split atomic without address - request phase__
| **Field name** | **Bits**                                      | **Description**                                                                                                                                                         |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                                             | Transaction type110: Unified atomic or split atomic address(other codes select other packet formats)                                                                    |
| **subtype**    | 3                                             | Atomic sub-type000: Swap001: ADD010: AND011: OR100: XOR101: MAX110: MIN111: reserved                                                                                    |
| **size**       | max(1, clog2(clog2( _data\_width\_p_/8 + 1))) | Transfer size is 2**size** bytes                                                                                                                                        |
| **lrid**       | _lrid\_width\_p_                              | Load request ID                                                                                                                                                         |
| **diff**       | 1 or 2                                        | 00: Full address and operand (sync)01: Differential address, XOR-compressed operand10: Differential address, full operand11: Differential address, differential operand |
| **operand**    | _data\_width\_p_                              | Operand. Value from rs2 before operator applied                                                                                                                         |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 11\. Packet format for Split atomic load - data phase__
| **Field name** | **Bits**                  | **Description**                                                                                                   |
| -------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **format**     | 3                         | Transaction type111: Split atomic data(other codes select other packet formats)                                   |
| **lrid**       | _lrid\_width\_p_          | Load request ID                                                                                                   |
| **resp**       | 2                         | 00: Error (no data)01: XOR-compressed data10: full data11: differential data                                      |
| **data\_len**  | **size**                  | Number of bytes of operand is _data\_len + 1_. Not included if resp indicates an error (sign-extend **resp** MSB) |
| **data**       | 8 \* (**data\_len** \+ 1) | Data. Not included if resp indicates an error (sign-extend **resp** MSB)                                          |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sec:data-csr)7.1.3\. CSR

__Table 12\. Packet format for Unified CSR, with address, data and operand__
| **Field name** | **Bits**                  | **Description**                                                                                           |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **format**     | 3                         | Transaction type101: CSR(other codes select other packet formats)                                         |
| **subtype**    | 2                         | CSR sub-type00: RW01: RS10: RC11: reserved                                                                |
| **diff**       | 1 or 2                    | 00: Full data (sync)01: Compressed data/operand (XOR if 2 bits)10: reserved11 : Differential data/operand |
| **data\_len**  | 2 or 3                    | Number of bytes of data is **data\_len** \+ 1                                                             |
| **data**       | 8 \* (**data\_len** \+ 1) | Data                                                                                                      |
| **addr\_msbs** | 6                         | Address\[11:6\]                                                                                           |
| **op\_len**    | 2 or 3                    | Number of bytes of operand is **op\_len** \+ 1                                                            |
| **operand**    | 8 \* (**op\_len** \+ 1)   | Operand. Value from rs1 before operator applied                                                           |
| **addr\_lsbs** | 6                         | Address\[5:0\]                                                                                            |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#sec:csr-diff)7.1.3.1\. diff field

See [7.1.1.3\. diff field](#sec:loadstore-diff).

#### [](#sec:csr-operand)7.1.3.2\. operand field

See [7.1.2.3\. operand field](#sec:atomic-operand).

#### [](#sec:csr-datalen)7.1.3.3\. data\_len and op\_len fields

2 bits wide if hart has 32-bit CSRs, 3 bits if 64-bit. Width of **data**and **operand** fields respectively. See [7.1.1.4\. data\_len field](#sec:loadstore-datalen).

#### [](#sec:csr-addr)7.1.3.4\. addr fields

The address is split into two parts, with the 6 LSBs output last as these are more likely to compress away.

__Table 13\. Packet format for Unified CSR, with address and read-only data (as determined by addr\[11:10\] = 11)__
| **Field name** | **Bits**                  | **Description**                                                                           |
| -------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| **format**     | 3                         | Transaction type101: CSR (other codes select other packet formats)                        |
| **subtype**    | 2                         | CSR sub-type00: RW01: RS10: RC11: reserved                                                |
| **diff**       | 1 or 2                    | 00: Full data (sync)01: Compressed data (XOR if 2 bits)10: reserved11 : Differential data |
| **data\_len**  | 2 or 3                    | Number of bytes of data is **data\_len** \+ 1                                             |
| **data**       | 8 \* (**data\_len** \+ 1) | Data                                                                                      |
| **addr\_msbs** | 6                         | Address\[11:6\]                                                                           |
| **addr\_lsbs** | 6                         | Address\[5:0\]                                                                            |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The following packet format is used when the encoder is configured to omit data values from data trace packets (trTeDataControl.trTeDataNoValue is 1).

__Table 14\. Packet format for Unified CSR, with address only__
| **Field name** | **Bits** | **Description**                                          |
| -------------- | -------- | -------------------------------------------------------- |
| **format**     | 3        | Transaction type101: CSRother codes other packet formats |
| **subtype**    | 2        | CSR sub-type00: RW01: RS10: RC11: reserved               |
| **diff**       | 1        | 0: Full address1: Differential address                   |
| **addr\_msbs** | 6        | Address\[11:6\]                                          |
| **addr\_lsbs** | 6        | Address\[5:0\]                                           |

| |  The above packet is deprecated and has been superseded by the equivalent packet defined in the MMA/CAS extension (see [MMA/CAS extension](extensions.html#sec:ext-mmacas)) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
