# 3.1. Incoming MSI Controller (IMSIC)

## [](#IMSIC)3.1\. Incoming MSI Controller (IMSIC)

An Incoming MSI Controller (IMSIC) is an optional RISC-V hardware component that is closely coupled with a hart, one IMSIC per hart. An IMSIC receives and records incoming message-signaled interrupts (MSIs) for a hart, and signals to the hart when there are pending and enabled interrupts to be serviced.

An IMSIC has one or more memory-mapped registers in the machine’s address space for receiving MSIs. Aside from those memory-mapped registers, software interacts with an IMSIC primarily through several RISC-V CSRs at the attached hart.

### [](#IMSIC-intrFilesAndIdents)3.1.1\. Interrupt files and interrupt identities

In a RISC-V system, MSIs are directed not just to a specific hart but to a specific privilege level of a specific hart, such as machine or supervisor level. Furthermore, when a hart implements the H extension, an IMSIC may optionally allow MSIs to be directed to a specific virtual hart at virtual supervisor level (VS level).

For each privilege level and each virtual hart to which MSIs may be directed at a hart, the hart’s IMSIC contains a separate _interrupt file_. Assuming a hart implements supervisor mode, its IMSIC has at least two interrupt files, one for machine level and the other for supervisor level. When a hart also implements the H extension, its IMSIC may have additional interrupt files for virtual harts, called_guest interrupt files_. The number of guest interrupt files an IMSIC has for virtual harts is exactly _GEILEN_, the number of supported guest external interrupts, as defined by the H extension.

Each individual interrupt file consists mainly of two arrays of bits of the same size, one array for recording MSIs that have arrived but are not yet serviced (interrupt-pending bits), and the other array for specifying which interrupts the hart will currently accept (interrupt-enable bits). Each bit position in the two arrays corresponds with a different interrupt _identity number_ by which MSIs from different sources are distinguished at an interrupt file. Because an IMSIC is the external interrupt controller for a hart, an interrupt file’s interrupt identities become the _minor identities_ for external interrupts at the attached hart.

The number of interrupt identities supported by an interrupt file (and hence the number of active bits in each array) is one less than a multiple of 64, and may be a minimum of 63 and a maximum of 2047.

| |  Platform standards may increase the minimum number of interrupt identities that must be implemented by each interrupt file. |
| ------------------------------------------------------------------------------------------------------------------------------ |

When an interrupt file supports  distinct interrupt identities, valid identity numbers are between 1 and inclusive. The identity numbers within this range are said to be implemented by the interrupt file; numbers outside this range are not implemented. The number zero is never a valid interrupt identity.

IMSIC hardware does not assume any connection between the interrupt identity numbers at one interrupt file and those at another interrupt file. Software is commonly expected to assign the same interrupt identity number to different MSI sources at different interrupt files, without coordination across interrupt files. Thus the total number of MSI sources that can be separately distinguished within a system is potentially the product of the number of interrupt identities at a single interrupt file times the total number of interrupt files in the system, over all harts.

It is not necessarily the case that all interrupt files in a system are the same size (implement the same number of interrupt identities). For a given hart, the interrupt files for guest external interrupts must all be the same size, but the interrupt files at machine level and at supervisor level may differ in size from those of guest external interrupts, and from each other. Likewise, the interrupt files of different harts may be different sizes.

A platform might provide a means for software to configure the number of interrupt files in an IMSIC and/or their sizes, such as by allowing a smaller interrupt file at machine level to be traded for a larger one at supervisor level, or vice versa, for example. Any such configurability is outside the scope of this specification. It is recommended, however, that only machine level be given the power to change the number and sizes of interrupt files in an IMSIC.

### [](#MSIEncoding)3.1.2\. MSI encoding

Established standards (in particular, for PCI and PCI Express) dictate that an individual message-signaled interrupt (MSI) from a device takes the form of a naturally aligned 32-bit write by the device, with the address and value both configured at the device (or device controller) by software. Depending on the versions of the standards to which a device or controller conforms, the address might be restricted to the lower 4-GiB (32-bit) range, and the value written might be limited to a 16-bit range, with the upper 16 bits always being zeros.

When RISC-V harts have IMSICs, an MSI from a device is normally sent directly to an individual hart that was selected by software to handle the interrupt (presumably based on some interrupt affinity policy). An MSI is directed to a specific privilege level, or to a specific virtual hart, via the corresponding interrupt file that exists in the receiving hart’s IMSIC. The MSI write address is the physical address of a particular word-size register that is physically connected to the target interrupt file. The MSI write data is simply the identity number of the interrupt to be made pending in that interrupt file (becoming eventually the minor identity for an external interrupt to the attached hart).

By configuring an MSI’s address and data at a device, system software fully controls: (a) which hart receives a particular device interrupt, (b) the target privilege level or virtual hart, and (c) the identity number that represents the MSI in the target interrupt file. Elements a and b are determined by which interrupt file is targeted by the MSI address, while element c is communicated by the MSI data.

| |  As the maximum interrupt identity number an IMSIC can support is 2047, a 16-bit limit on MSI data values presents no problem. |
| -------------------------------------------------------------------------------------------------------------------------------- |

When the H extension is implemented and a device is being managed directly by a guest operating system, MSI addresses from the device are initially guest physical addresses, as they are configured at the device by the guest OS. These guest addresses must be translated by an IOMMU, which gets configured by the hypervisor to redirect those MSIs to the interrupt files for the correct guest external interrupts. For more on this topic, see [IOMMU Support for MSIs to Virtual Machines](IOMMU.html#IOMMU).

### [](#3-1-3-interrupt-priorities)3.1.3\. Interrupt priorities

Within a single interrupt file, interrupt priorities are determined directly from interrupt identity numbers. Lower identity numbers have higher priority.

| |  Because MSIs give software complete control over the assignment of identity numbers in an interrupt file, software is free to select identity numbers that reflect the relative priorities desired for interrupts. It is true that software could adjust interrupt priorities more dynamically if interrupt files included an array of priority numbers to assign to each interrupt identity. However, we believe that such additional flexibility would not be utilized often enough to justify the extra hardware expense. In fact, for many systems currently employing MSIs, it is common practice for software to ignore interrupt priorities entirely and act as though all interrupts had equal priority. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  An interrupt file’s lowest identity numbers have been given the highest priorities, not the reverse order, because it is only for the highest-priority interrupts that priority order may need to be carefully managed, yet it is the low-numbered identities, 1 through 63 (or perhaps 1 through 127), that are guaranteed to exist across all systems. Consider, for example, that an interrupt file’s highest-priority interrupt—presumably the most time-critical—is always identity number 1\. If priority order were reversed, the highest-priority interrupt would have different identity numbers on different machines, depending on how many identities are implemented by interrupt files. The ability for software to assign fixed identity numbers to the highest-priority interrupts is considered worth any discomfort that may be felt from interrupt priorities being the reverse of the natural number order. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#3-1-4-reset-and-revealed-state)3.1.4\. Reset and revealed state

Upon reset of an IMSIC, all the state of its interrupt files becomes valid and consistent but otherwise UNSPECIFIED, except possibly for the `eidelivery` register of machine-level and supervisor-level interrupt files, as specified in[3.1.8.1\. External interrupt delivery enable register (eidelivery)](#IMSIC-reg-eidelivery).

If an IMSIC contains a supervisor-level interrupt file and software at the attached hart enables S-mode that was previously disabled (e.g. by changing bit S of CSR `misa` from zero to one), all state of the supervisor-level interrupt file is valid and consistent but otherwise UNSPECIFIED. Likewise, if an IMSIC contains guest interrupt files and software at the attached hart enables the H extension that was previously disabled (e.g. by changing bit H of `misa` from zero to one), all state of the IMSIC’s guest interrupt files is valid and consistent but otherwise UNSPECIFIED.

### [](#IMSIC-memRegion)3.1.5\. Memory region for an interrupt file

Each interrupt file in an IMSIC has one or two memory-mapped 32-bit registers for receiving MSI writes. These memory-mapped registers are located within a naturally aligned 4-KiB region (a page) of physical address space that exists for the interrupt file, i.e., one page per interrupt file.

The layout of an interrupt-file’s memory region is:

| offset | size    | register name |
| ------ | ------- | ------------- |
| 0x000  | 4 bytes | seteipnum\_le |
| 0x004  | 4 bytes | seteipnum\_be |

All other bytes in an interrupt file’s 4-KiB memory region are reserved and must be implemented as read-only zeros.

Only naturally aligned 32-bit simple reads and writes are supported within an interrupt file’s memory region. Writes to read-only bytes are ignored. For other forms of accesses (other sizes, misaligned accesses, or AMOs), an IMSIC implementation should preferably report an access fault or bus error but must otherwise ignore the access.

If  is an implemented interrupt identity number, writing value  in little-endian byte order to `seteipnum_le` (Set External Interrupt-Pending bit by Number, Little-Endian) causes the pending bit for interrupt  to be set to one. A write to `seteipnum_le` is ignored if the value written is not an implemented interrupt identity number in little-endian byte order.

For systems that support big-endian byte order, if  is an implemented interrupt identity number, writing value  in big-endian byte order to `seteipnum_be` (Set External Interrupt-Pending bit by Number, Big-Endian) causes the pending bit for interrupt  to be set to one. A write to `seteipnum_be` is ignored if the value written is not an implemented interrupt identity number in big-endian byte order. Systems that support only little-endian byte order may choose to ignore all writes to `seteipnum_be`.

In most systems, `seteipnum_le` is the write port for MSIs directed to this interrupt file. For systems built mainly for big-endian byte order, `seteipnum_be` may serve as the write port for MSIs directed to this interrupt file from some devices.

A read of `seteipnum_le` or `seteipnum_be` returns zero in all cases.

When not ignored, writes to an interrupt file’s memory region are guaranteed to be reflected in the interrupt file eventually, but not necessarily immediately. For a single interrupt file, the effects of multiple writes (stores) to its memory region, though arbitrarily delayed, always occur in the same order as the _global memory order_ of the stores as defined by the RISC-V Unprivileged ISA.

| |  In most circumstances, any delay between the completion of a write to an interrupt file’s memory region and the effect of the write on the interrupt file is indistinguishable from other delays in the memory system. However, if a hart writes to a seteipnum\_le or seteipnum\_be register of its own IMSIC, then a delay between the completion of the store instruction and the consequent setting of an interrupt-pending bit in the interrupt file may be visible to the hart. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#IMSIC-systemMemRegions)3.1.6\. Arrangement of the memory regions of multiple interrupt files

Each interrupt file that an IMSIC implements has its own memory region as described in the previous section, occupying exactly one 4-KiB page of machine address space. When practical, the memory pages of the machine-level interrupt files of all IMSICs should be located together in one part of the address space, and the memory pages of all supervisor-level and guest interrupt files should similarly be located together in another part of the address space, according to the rules below.

| |  The main reason for separating the machine-level interrupt files from the other interrupt files in the address space is so harts that implement physical memory protection (PMP) can grant supervisor-level access to all supervisor-level and guest interrupt files using only a single PMP table entry. If the memory pages for machine-level interrupt files are instead interleaved with those of lower-privilege interrupt files, the number of PMP table entries needed for granting supervisor-level access to all non-machine-level interrupt files could equal the number of harts in the system. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If a machine’s construction dictates that harts be subdivided into groups, with each group relegated to its own portion of the address space, then the best that can be achieved is to locate together the machine-level interrupt files of each group of harts separately, and likewise locate together the supervisor-level and guest interrupt files of each group of harts separately. This situation is further addressed later below.

| |  A system may divide harts into groups in the address space because each group exists on a separate chip (or chiplet in a multi-chip module), and weaving together the address spaces of the multiple chips is impractical. In that case, granting supervisor-level access to all non-machine-level interrupt files takes one PMP table entry per group. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

For the purpose of locating the memory pages of interrupt files in the address space, assume each hart (or each hart within a group) has a unique hart number that may or may not be related to the unique hart identifiers ("hart IDs") that the Privileged Architecture assigns to harts. For convenient addressing, the memory pages of all machine-level interrupt files (or all those of a single group of harts) should be arranged so that the address of the machine-level interrupt file for hart number  is given by the formula  for some integer constants  and . If the largest hart number is , let , the number of bits needed to represent any hart number. Then the base address  should be aligned to a  address boundary, so  always equals  | , where the vertical bar (|) represents bitwise logical OR.

The smallest that  can be is 12, with  being the size of one 4-KiB page. If , the start of the memory page for each machine-level interrupt file is aligned not just to a 4-KiB page but to a stricter  address boundary. Within the \-size address range through , every 4-KiB page that is not occupied by a machine-level interrupt file should be filled with 32-bit words of read-only zeros, such that any read of an aligned word returns zero and any write to an aligned word is ignored.

The memory pages of all supervisor-level interrupt files (or all those of a single group of harts) should similarly be arranged so that the address of the supervisor-level interrupt file for hart number  is  for some integer constants  and , with the base address  being aligned to a address boundary.

If an IMSIC implements guest interrupt files, the memory pages for the IMSIC’s supervisor-level interrupt file and for its guest interrupt files should be contiguous, starting with the supervisor-level interrupt file at the lowest address and followed by the guest interrupt files, ordered by guest interrupt number. Schematically, the memory pages should be ordered contiguously as

S, , , , …

where S is the page for the supervisor-level interrupt file and each  is the page for the interrupt file of guest interrupt number . Consequently, the smallest that constant  can be is , recalling that GEILEN for each IMSIC is the number of guest interrupt files the IMSIC implements.

Within the \-size address range  through , every 4-KiB page that is not occupied by an interrupt file (supervisor-level or guest) should be filled with 32-bit words of read-only zeros.

When a system divides harts into groups, each in its own separate portion of the address space, the memory page addresses of interrupt files should follow the formulas  for machine-level interrupt files, and  for supervisor-level interrupt files, with  being a _group number_,  being a hart number relative to the group, and  being another integer constant  but usually much larger. If the largest group number is , let , the number of bits needed to represent any group number. Besides being multiples of  and  respectively,  and  should be chosen so

 &  and  & 

where an ampersand (&) represents bitwise logical AND. This ensures that

 always equals ( ) |  | ( ), and  
 always equals ( ) |  | ( ).

Infilling with read-only-zero pages is expected only within each group, not between separate groups. Specifically, if  is any integer between 0 and  inclusive, then within the address ranges,

 through , and  
 through ,

pages not occupied by an interrupt file should be read-only zeros.

See also [Addresses and data for outgoing MSIs](AdvPLIC.html#AdvPLIC-MSIAddrs) for the default algorithms an Advanced PLIC may use to determine the destination addresses of outgoing MSIs, which should be the addresses of IMSIC interrupt files.

### [](#3-1-7-csrs-for-external-interrupts-via-an-imsic)3.1.7\. CSRs for external interrupts via an IMSIC

Software accesses a hart’s IMSIC primarily through the CSRs introduced in [Control and Status Registers (CSRs) Added to Harts](CSRs.html#CSRs). There is a separate set of CSRs for each implemented privilege level that can receive interrupts. The machine-level CSRs interact with the IMSIC’s machine-level interrupt file, while, if supervisor mode is implemented, the supervisor-level CSRs interact with the IMSIC’s supervisor-level interrupt file. When an IMSIC has guest interrupt files, the VS CSRs interact with a single guest interrupt file, selected by the VGEIN field of CSR `hstatus`.

For machine level, the relevant CSRs are `miselect`, `mireg`, and `mtopei`. When supervisor mode is implemented, the set of supervisor-level CSRs matches those of machine level: `siselect`, `sireg`, and `stopei`. And when the H extension is implemented, there are three corresponding VS CSRs: `vsiselect`, `vsireg`, and `vstopei`.

As explained in [Control and Status Registers (CSRs) Added to Harts](CSRs.html#CSRs), registers `miselect` and `mireg` provide indirect access to additional machine-level registers. Likewise for supervisor-level `siselect` and `sireg`, and VS-level `vsiselect` and `vsireg` . In each case, a value of the **_\*iselect_** _CSR_ (`miselect`, `siselect` , or `vsiselect)`) in the range 0x70-0xFF selects a register of the corresponding IMSIC interrupt file, either the machine-level interrupt file (`miselect`), the supervisor-level interrupt file (`siselect`), or a guest interrupt file (`vsiselect`).

Interrupt files at each level act identically. For a given privilege level, values of the `*iselect` CSR in the range `0x70-0xFF` select these registers of the corresponding interrupt file:

| 0x70 | eidelivery  |
| ---- | ----------- |
| 0x72 | eithreshold |
| 0x80 | eip0        |
| 0x81 | eip1        |
| …​   | …​          |
| 0xBF | eip63       |
| 0xC0 | eie0        |
| 0xC1 | eie1        |
| …​   | …​          |
| 0xFF | eie63       |

Register numbers 0x71 and 0x73-0x7F are reserved. When an `_*iselect_` _CSR_ has one of these values, reads from the matching `_*ireg_` _CSR_ (`mireg`, `sireg`, or `vsireg`) return zero, and writes to the `_*ireg_` _CSR_ are ignored. (For `vsiselect` and `vsireg`, all accesses depend on `hstatus`.VGEIN being the valid number of a guest interrupt file.)

Registers `eip0` through `eip63` contain the pending bits for all implemented interrupt identities, and are collectively called the `_eip_` _array_. Registers `eie0` through `eie63` contain the enable bits for the same interrupt identities, and are collectively called the `_eie_` _array_.

The indirectly accessed interrupt-file registers and CSRs `mtopei`, `stopei`, and `vstopei` are all documented in more detail in the next two sections.

### [](#3-1-8-indirectly-accessed-interrupt-file-registers)3.1.8\. Indirectly accessed interrupt-file registers

This section describes the registers of an interrupt file that are accessed indirectly through a `_*iselect_` _CSR_ (`miselect`, `siselect`, or `vsiselect`) and its partner `_*ireg_` _CSR_ (`mireg`, `sireg`, or `vsireg`). The width of these indirect accesses is always the current XLEN, 32 bits for RV32 code, or 64 bits for RV64 code.

#### [](#IMSIC-reg-eidelivery)3.1.8.1\. External interrupt delivery enable register (`eidelivery`)

`eidelivery` is a **WARL** register that controls whether interrupts from this interrupt file are delivered from the IMSIC to the attached hart so they appear as a pending external interrupt in the hart’s `mip` or `hgeip` CSR. Register `eidelivery` may optionally also support the direct delivery of interrupts from a PLIC (Platform-Level Interrupt Controller) or APLIC (Advanced PLIC) to the attached hart. Three possible values are currently defined for `eidelivery`:

| 0 =          | Interrupt delivery is disabled                                |
| ------------ | ------------------------------------------------------------- |
| 1 =          | Interrupt delivery from the interrupt file is enabled         |
| 0x40000000 = | Interrupt delivery from a PLIC or APLIC is enabled (optional) |

If `eidelivery` supports value 0x40000000, then a specific PLIC or APLIC in the system may act as an alternate external interrupt controller for the attached hart at the same privilege level as this interrupt file. When `eidelivery` is 0x40000000, the interrupt file functions the same as though `eidelivery` is 0, and the PLIC or APLIC replaces the interrupt file in supplying pending external interrupts at this privilege level at the hart.

Guest interrupt files do not support value 0x40000000 for `eidelivery`.

Reset initializes `eidelivery` to 0x40000000 if that value is supported; otherwise, `eidelivery` has an UNSPECIFIED valid value (0 or 1) after reset.

| |  eidelivery value 0x40000000 supports system software that is oblivious to IMSICs and assumes instead that the external interrupt controller is a PLIC or APLIC. Such software may exist either because it predates the existence of IMSICs or because bypassing IMSICs is believed to reduce programming effort. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The `eidelivery` register affects only whether an external interrupt appears in a hart’s `*ip` register (MEI or SEI in `mip` or `sip`, or a bit in `hgeip`) and what the source of such an interrupt may be (either the interrupt file or a separate external interrupt controller such as an APLIC). It has no effect on other state within the interrupt file, or on any `*topei` CSR (`mtopei`, `stopei`, or `vstopei`).

#### [](#3-1-8-2-external-interrupt-enable-threshold-register-eithreshold)3.1.8.2\. External interrupt enable threshold register (`eithreshold`)

`eithreshold` is a **WLRL** register that determines the minimum interrupt priority (maximum interrupt identity number) allowing an interrupt to be signaled from this interrupt file to the attached hart. If  is the maximum implemented interrupt identity number for this interrupt file,`eithreshold` must be capable of holding all values between 0 and , inclusive.

When `eithreshold` is a nonzero value , interrupt identities  and higher do not contribute to signaling interrupts, as though those identities were not enabled, regardless of the settings of their corresponding interrupt-enable bits in the `eie` array. When `eithreshold` is zero, all enabled interrupt identities contribute to signaling interrupts from the interrupt file.

#### [](#3-1-8-3-external-interrupt-pending-registers-eip0-eip63)3.1.8.3\. External interrupt-pending registers (`eip0`\-`eip63`)

When the current XLEN = 32, register `eip`  contains the pending bits for interrupts with identity numbers  through . For an implemented interrupt identity  within that range, the pending bit for interrupt  is bit  of `eip` .

When the current XLEN = 64, the odd-numbered registers `eip1`, `eip3`, … `eip63` do not exist. In that case, if the `*iselect` CSR is an odd value in the range 0x81–0xBF, an attempt to access the matching `*ireg` CSR raises an illegal instruction exception, unless done in VS-mode, in which case it raises a virtual instruction exception. For even , register `eip`  contains the pending bits for interrupts with identity numbers  through . For an implemented interrupt identity  within that range, the pending bit for interrupt  is bit  of `eip` .

Bit positions in a valid `eip`  register that don’t correspond to a supported interrupt identity (such as bit 0 of `eip0`) are read-only zeros.

#### [](#3-1-8-4-external-interrupt-enable-registers-eie0-eie63)3.1.8.4\. External interrupt-enable registers (`eie0`\-`eie63`)

When the current XLEN = 32, register `eie`  contains the enable bits for interrupts with identity numbers through . For an implemented interrupt identity  within that range, the enable bit for interrupt  is bit ( ) of `eie` .

When the current XLEN = 64, the odd-numbered registers `eie1`, `eie3`, … `eie63` do not exist. In that case, if the `*iselect` CSR is an odd value in the range `0xC1`–`0xFF`, an attempt to access the matching `*ireg` CSR raises an illegal instruction exception, unless done in VS-mode, in which case it raises a virtual instruction exception. For even , register`eie`  contains the enable bits for interrupts with identity numbers  through . For an implemented interrupt identity  within that range, the enable bit for interrupt  is bit ( ) of `eie` .

Bit positions in a valid `eie`  register that don’t correspond to a supported interrupt identity (such as bit 0 of `eie0`) are read-only zeros.

### [](#3-1-9-top-external-interrupt-csrs-mtopei-stopei-vstopei)3.1.9\. Top external interrupt CSRs (`mtopei`, `stopei`, `vstopei`)

CSR `mtopei` interacts directly with an IMSIC’s machine-level interrupt file. If supervisor mode is implemented, CSR `stopei` interacts directly with the supervisor-level interrupt file. And if the H extension is implemented and field VGEIN of `hstatus` is the number of an implemented guest interrupt file, `vstopei` interacts with the chosen guest interrupt file.

The value of a `_*topei_` _CSR_ (`mtopei`, `stopei`, or `vstopei`) indicates the interrupt file’s current highest-priority pending-and-enabled interrupt that also exceeds the priority threshold specified by its `eithreshold` register if `eithreshold` is not zero. Interrupts with lower identity numbers have higher priorities.

A read of a `*topei` CSR returns zero either if no interrupt is both pending in the interrupt file’s `eip` array and enabled in its `eie` array, or if `eithreshold` is not zero and no pending-and-enabled interrupt has an identity number less than the value of `eithreshold`. Otherwise, the value returned from a read of `*topei` has this format:

| bits 26:16 | Interrupt identity                    |
| ---------- | ------------------------------------- |
| bits 10:0  | Interrupt priority (same as identity) |

All other bit positions are zeros.

The interrupt identity reported in a `*topei` CSR is the minor identity for an external interrupt at the hart.

| |  The redundancy in the value read from a \*topei CSR is consistent with the Advanced PLIC, which returns both an interrupt identity number and its priority in the same format as above, but with the two components being independent of one another. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The value of a `*topei` CSR is not affected by an interrupt file’s`eidelivery` register or by any of `mie`, `sie`, `hie`, `hgeie`, or `vsie`.

A write to a `*topei` CSR _claims_ the reported interrupt identity by clearing its pending bit in the interrupt file. The value written is ignored; rather, the current readable value of the register determines which interrupt-pending bit is cleared. Specifically, when a `*topei` CSR is written, if the register value has interrupt identity  in bits 26:16, then the interrupt file’s pending bit for interrupt  is cleared. When a `*topei` CSR’s value is zero, a write to the register has no effect.

If a read and write of a `*topei` CSR are done together by a single CSR instruction (CSRRW, CSRRS, or CSRRC), the value returned by the read indicates the pending bit that is cleared.

| |  It is almost always a mistake to write to a \*topei CSR without a simultaneous read to learn which interrupt was claimed. Note especially, if a read of a \*topei register and a subsequent write to the register are done by two separate CSR instructions, then a higher-priority interrupt may become newly pending-and-enabled in the interrupt file between the two instructions, causing the write to clear the pending bit of the new interrupt and not the one reported by the read. Once the pending bit of the new interrupt is cleared, the interrupt is lost. If it is necessary first to read a \*topei CSR and then subsequently claim the interrupt as a separate step, the claim can be safely done by clearing the pending bit in the eip array via \*siselect and \*sireg, instead of writing to \*topei. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#3-1-10-interrupt-delivery-and-handling)3.1.10\. Interrupt delivery and handling

An IMSIC’s interrupt files supply _external interrupt_ signals to the attached hart, one interrupt signal per interrupt file. The interrupt signal from a machine-level interrupt file appears as bit MEIP in CSR `mip`, and the interrupt signal from a supervisor-level interrupt file appears as bit SEIP in `mip` and `sip`. Interrupt signals from any guest interrupt files appear as the active bits in hypervisor CSR `hgeip`.

When interrupt delivery is disabled by an interrupt file’s `eidelivery` register (`eidelivery` \= 0), the interrupt signal from the interrupt file is held de-asserted (false). When interrupt delivery from an interrupt file is enabled (`eidelivery` \= 1), its interrupt signal is asserted if and only if the interrupt file has a pending-and-enabled interrupt that also exceeds the priority threshold specified by `eithreshold`, if not zero.

Changes to the state of an interrupt file are guaranteed to be reflected in the relevant interrupt-pending bit in CSR`mip` or `hgeip` eventually, but not necessarily immediately.

A trap handler solely for external interrupts via an IMSIC could be written roughly as follows:

| save processor registers                                                      |
| ----------------------------------------------------------------------------- |
| i\=read CSR mtopei or stopei, and write simultaneously to claim the interrupt |
| i\= i>>16                                                                     |
| call the interrupt handler for external interrupt i (minor identity)          |
| restore processor registers                                                   |
| return from trap                                                              |

The combined read and write of `mtopei` or `stopei` in the second step can be done by a single CSRRW machine instruction,

`csrrw` _rd_, `mtopei/stopei`, `x0`

where _rd_ is the destination register for value _i_.
