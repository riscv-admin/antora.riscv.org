# 3.1. Packet Encapsulation

## [](#chapter2)3.1\. Packet Encapsulation

Two types of encapsulation are defined: _normal_ and _null_. A transmitted stream of encapsulated packets comprises a mixture of _normal_ and _null_ packets. Each packet is atomic, and must be transmitted in its entirety before another packet can be sent.

### [](#3-1-1-normal-encapsulation-structure)3.1.1\. Normal Encapsulation Structure

The normal encapsulation structure is comprised of four field-groups as shown in [Table 1](#%5Ftable%5FGroups). In this and the following tables, the field-groups and fields are listed in transmission order: the uppermost field-group or field in a table is transmitted first, and multi-bit fields are transmitted least significant bit first.

__Table 1\. Encapsulation Field Groups__
| Group Name    | \# Bits | Description                                                         |
| ------------- | ------- | ------------------------------------------------------------------- |
| **header**    | 8       | Encapsulation header. See [3.1.1.1\. Header](#%5Fsection%5FHeader). |
| **srcID**     | 0 - 16  | Source ID. See [3.1.1.2\. srcID](#%5Fsection%5FsrcID).              |
| **timestamp** | T\*8    | Time stamp. See [3.1.1.3\. Timestamp](#%5Fsection%5FTimestamp).     |
| **payload**   | 1-248   | Packet payload. See [3.1.1.4\. Payload](#%5Fsection%5FPayload).     |

The groups are defined in the following sections:

#### [](#%5Fsection%5FHeader)3.1.1.1\. Header

The header is a single byte comprising the fields defined in [Table 2](#%5Ftable%5FHeader).

__Table 2\. Header Fields__
| Field Name | \# Bits | Description                                                                                                                                                                                              |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **length** | 5       | Encapsulated payload length. A value of _L_ indicates an _L_ byte payload. Must be > 0 - see [3.1.2\. Null Encapsulation](#%5Fsection%5Fnull%5Fencapsulation).                                           |
| **flow**   | 2       | Flow indicator. This can be used to direct packets to a particular sink in systems where multiple sinks exist, and those sinks include the ability to accept or discard packets based on the flow value. |
| **extend** | 1       | Indicates presence of timestamp when 1\. Must be 0 if timestamp width is 0.                                                                                                                              |

#### [](#%5Fsection%5FsrcID)3.1.1.2\. srcID

The **srcID** field identifies the source of the packet. It can be between 0 and 16 bits in length. This length must be fixed and discoverable for a given system.

The **srcID** may be omitted (i.e. zero bits in length) if there is only one source in the system, or if the transport scheme includes a sideband bus for the source ID (for example, ATB).

When present, an 8-bit **srcID** will be sufficient for most use cases, and is simplest in terms of determining the packet length, keeping all field groups aligned to byte boundaries. However, the length of the field can be reduced to improve efficiency for small systems, or increased if required for larger systems. This is explained in more detail in [3.1.1.5\. Packet Length](#%5Fsection%5Fpacket%5Flength).

#### [](#%5Fsection%5FTimestamp)3.1.1.3\. Timestamp

The **timestamp** field provides a means to include time information with every packet. It is included in the encapsulation if **header.extend** is 1\. When included, the timestamp must be T bytes in length. The length must be discoverable, and fixed for a given system.

Timestamps may be omitted either because time is not of interest to the user, or if time information is already included within the encapsulated payload.

#### [](#%5Fsection%5FPayload)3.1.1.4\. Payload

The encapsulation payload can be up to 248 bits (31 bytes) in length, and comprises the fields shown in table [Table 3](#%5Ftable%5Fpayload).

__Table 3\. Payload Fields__
| Field Name         | \# Bits | Description                                                                                                                                                                                                                                                                               |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **type**           | ≥ 0     | Packet type. May be eliminated (i.e. width set to 0) for sources with only one packet type. Length must be fixed for a given **srcID**, and discoverable if > 0.                                                                                                                          |
| **trace\_payload** | ≤ R     | Packet payloads such as those defined for E-Trace.Maximum value of R is defined as 248 - Y - **srcID**%8, where Y is the length of the **type** field. See [3.1.1.5\. Packet Length](#%5Fsection%5Fpacket%5Flength) for details of the relationship between **srcID** and payload length. |

#### [](#%5Fsection%5Fpacket%5Flength)3.1.1.5\. Packet Length

Encapsulated packets are a number of whole bytes in length, the exact number depending on the sizes of the **srcID**, **timestamp** (if present) and **header.length**:

Packet length = 1 + S + (T \* **header.extend**) + **header.length**

S and T are discoverable constants; S is the number of whole bytes of **srcID**: int(#bits(**srcID**)/8).

For the case where the size of **srcID** is a multiple of 8 bits, **header.length** is simply the number of bits of payload rounded up to the nearest multiple of 8 and expressed in bytes:

**header.length** \= ceiling(#bits(**payload**)/8)

However, if the **srcID** is not a multiple of 8 bits the remaining **srcID** bits not accounted for by 'S' are instead included when determining the value of **header.length**. Thus the more general definition for any **srcID** size is:

**header.length** \= ceiling((#bits(**payload**) + #bits(**srcID**)%8)/8)

In this way, the maximum payload length is reduced by up to 7 when the **srcID** is not a multiple of 8 bits.

In cases where the number of bits of **payload** \+ **srcID** is not a multiple of 8, some padding bits are required. These must be placed in the most significant bits of the final byte of the packet. Their value is "don’t care", but they must not "leak" information (for example, the previous contents of an intermediate buffer that may relate to a different trace session which the current recipient of trace is not authorised to receive).

### [](#%5Fsection%5Fnull%5Fencapsulation)3.1.2\. Null Encapsulation

For _normal_ encapsulation, the **header.length** field is at least 1, and the overall length of the encapsulated packet will be at least 2 bytes (**header** plus 1 byte of payload).

A _null_ packet is specified as consisting exclusively of one **header** byte with its **length** field set to zero, explicitly indicating the packet’s total size as one byte. The **extend** field is used to distinguish 2 different types of null packet, which are defined as follows:

* **extend** \= 0: _null.idle_
* **extend** \= 1: _null.alignment_

Usually, _null.idle_ will be used. _null.alignment_ is used for synchronization, as described in the following section.

Insertion of _null_ packets typically occurs at a trace sink where there are no sideband signals accompanying the data stream to identify valid data. Packets emitted from a trace source are generally transported over some form of on-chip transport (e.g. ATB) that includes sideband signalling to indicate when data is valid. In this situation when there is no data to send, valid is simply deasserted. That said, the **flow** field definition in _null_ packets is unchanged, so _null_ packets can be routed from a trace source to a specific sink if required. When generated at a sink, the **flow** field value is unimportant and is typically 0\. If the sink is generating a bit stream (i.e. the byte boundaries are not inherently known to the recipient) then the **flow** field must be zero in all _null_ packets within the generated bitstream.

### [](#3-1-3-synchronization)3.1.3\. Synchronization

In a data stream comprised of packets, it’s a requirement to be able to determine where packets start and end, when starting from an arbitrary point, without knowledge of the full packet history. This can be achieved by inserting a synchronization sequence into the packet stream. This sequence is comprised of a sufficiently long sequence of _null_ packets.

A 'null' byte is defined as a byte with the 5LSBs all zero, which may be a _null_ packet, or may be part of a _normal_ packet. The longest run N of ‘null’ bytes possible within a _normal_ packet is:

N = 31 + T + S (see [3.1.1.3\. Timestamp](#%5Fsection%5FTimestamp) and [3.1.1.5\. Packet Length](#%5Fsection%5Fpacket%5Flength) for definitions of T and S respectively)

Therefore, in a sequence of N or more ‘null’ bytes, the first N 'null' bytes may actually be part of a packet. However, any 'null' bytes after this must be _null_ packets, and the 1st non-null byte seen after this must therefore be the 1st byte of a _normal_ packet.

For unframed data streams such as PIB, a _null.alignment_ packet must be transmitted as the final _null_ before a _normal_ packet. Strictly speaking this is necessary only if the data stream is sent via an interface less than 8 bits wide, but for simplicity this is mandatory for any width. The single 1 at the end of this sequence uniquely identifies the byte boundary, and what follows as the start of a packet. For example, for two _normal_ packets with M _nulls_ between them, this would comprise M-1 _null.idles_ and 1 _null.alignment_ (M > 0).

For framed data streams which incorporate synchronization information in their own framing such as MIPI TWP (aka ARM Trace Formatter Protocol) or USB there is no requirement to include _null.alignment_ packets.

The synchronization requirements are summarized in the following rules:

* A synchronization sequence must have a length of N+1 bytes (N defined above), comprising:  
   * For unframed data streams, N consecutive _null.idle_ packets, directly followed by one _null.alignment_ packet;  
   * For framed data streams, N consecutive _null.idle_ packets, directly followed by one _null.idle_ or _null.alignment_ packet.

Synchronization sequences are typically inserted periodically. In addition, a sufficiently long run of _null_ packets (due to a lack of _normal_ packets to send) may also serve as an 'opportunistic' synchronization sequence. For unframed data streams, this requires _null.alignment_ packets to be included, either as every (N+1)th _null_, or as the final _null_.

For writing unframed data to memory, alternative synchronisation mechanisms may also be employed. For example, by dividing memory into blocks of known size, and requiring that packets do not straddle block boundaries. The first byte of every block will therefore be the start of a packet. Details of such schemes are out of scope of this specification.
