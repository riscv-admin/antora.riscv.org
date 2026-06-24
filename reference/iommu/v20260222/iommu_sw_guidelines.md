# Software guidelines

## [](#sw%5Fguidelines)Software guidelines

This section provides guidelines to software developers on the correct and expected sequence of using the IOMMU interfaces. The behavior of the IOMMU if these guidelines are not followed is implementation defined.

### [](#reading-and-writing-iommu-registers)Reading and writing IOMMU registers

Read or write access to IOMMU registers must follow the following rules:

* Address of the access must be aligned to the size of the access.
* The access must not span multiple registers.
* Registers that are 64-bit wide may be accessed using either a 32-bit or a 64-bit access.
* Registers that are 32-bit wide must only be accessed using a 32-bit access.

### [](#guidelines-for-initialization)Guidelines for initialization

The guidelines for initializing the IOMMU are as follows:

1. Read the `capabilities` register to discover the capabilities of the IOMMU.
2. Stop and report failure if `capabilities.version` is not supported.
3. Read the feature control register (`fctl`).
4. Stop and report failure if big-endian memory access is needed and the`capabilities.END` field is 0 (i.e. only one endianness) and `fctl.BE` is 0 (i.e. little endian).
5. If big-endian memory access is needed and the `capabilities.END` field is 1 (i.e. both endiannesses supported), set `fctl.BE` to 1 (i.e. big endian) if the field is not already 1.
6. Stop and report failure if wire-signaled-interrupts are needed for IOMMU initiated interrupts and `capabilities.IGS` is neither `WSI` nor `BOTH`.
7. If wire-signaled-interrupts are needed for IOMMU initiated interrupts and`capabilities.IGS` is `BOTH`, set `fctl.WSI` to 1 if the field is not already 1.
8. Stop and report failure if other required capabilities (e.g. virtual-addressing modes, MSI translation, etc.) are not supported.
9. The `icvec` register is used to program an interrupt vector for each interrupt cause. Determine the number of vectors supported by the IOMMU by writing 0xF to each field and reading back the number of writable bits. If the number of writable bits is `N` then the number of supported vectors is`2N`. For each cause `C` associate a vector `V` with the cause. `V` is a number between 0 and `(2N - 1)`.
10. If the IOMMU is configured to use wired interrupts, then each vector `V`corresponds to an interrupt wire connected to a platform level interrupt controller (e.g. APLIC). Determine the interrupt controller configuration register to be programmed for each such wire using configuration information provided by configuration mechanisms such as device tree and program the interrupt controller.
11. If the IOMMU is configured to use MSI, then each vector `V` is an index into the `msi_cfg_tbl`. For each vector `V`, allocate a MSI address `A` and an interrupt identity `D`. Configure the `msi_addr_V` register with value `A`,`msi_data_V` register with value `D`. Configure the interrupt mask `M` in`msi_vec_ctl_V` register appropriately.
12. To program the command queue, first determine the number of entries `N` needed in the command queue. The number of entries in the command queue must be a power of two. Allocate a `N` x 16-bytes sized memory buffer that is naturally aligned to the greater of 4-KiB or `N` x 16-bytes. Let `k=log2(N)` and `B`be the physical page number (PPN) of the allocated memory buffer. Program the command queue registers as follows:  
   * `temp_cqb_var.PPN = B`  
   * `temp_cqb_var.LOG2SZ-1 = (k - 1)`  
   * `cqb = temp_cqb_var`  
   * `cqt = 0`  
   * `cqcsr.cqen = 1`  
   * Poll on `cqcsr.cqon` until it reads 1
13. To program the fault queue, first determine the number of entries N needed in the fault queue. The number of entries in the fault queue is always a power of two. Allocate a `N` x 32-bytes sized memory buffer that is naturally aligned to the greater of 4-KiB or `N` x 32-bytes. Let `k=log2(N)` and `B`be the PPN of the allocated memory buffer. Program the fault queue registers as follows:  
   * `temp_fqb_var.PPN = B`  
   * `temp_fqb_var.LOG2SZ-1 = (k - 1)`  
   * `fqb = temp_fqb_var`  
   * `fqh = 0`  
   * `fqcsr.fqen = 1`  
   * Poll on `fqcsr.fqon` until it reads 1
14. To program the page-request queue, first determine the number of entries `N`needed in the page-request queue. The number of entries in the page-request queue is always a power of two. Allocate a `N` x 16-bytes sized buffer that is naturally aligned to the greater of 4-KiB or `N` x 16-bytes. Let `k=log2(N)`and `B` be the PPN of the allocated memory buffer. Program the page-request queue registers as follows:  
   * `temp_pqb_var.PPN = B`  
   * `temp_pqb_var.LOG2SZ-1 = (k - 1)`  
   * `pqb = temp_pqb_var`  
   * `pqh = 0`  
   * `pqcsr.pqen = 1`  
   * Poll on `pqcsr.pqon` until it reads 1
15. To program the DDT pointer, first determine the supported `device_id` width `Dw`and the format of the device-context data structure. If `capabilities.MSI` is 0, then the IOMMU uses base-format device-contexts else extended-format device-contexts are used. Allocate a page (4 KiB) of memory to use as the root table of the DDT. Initialize the allocated memory to all 0\. Let `B` be the PPN of the allocated memory. Determine the mode `M` of the DDT based on `Dw`and the IOMMU device-contexts format as follows:  
   * Determine the values supported by `ddtp.iommu_mode` by writing legal values and reading it to see if the value was retained. Stop and report a failure if the supported modes do not support the required `Dw`.  
   * If extended-format device-contexts are used then  
         1. If `Dw` is less than or equal to 6-bits and `1LVL` is supported then `M = 1LVL`  
         2. If `Dw` is less than or equal to 15-bits and `2LVL` is supported then `M = 2LVL`  
         3. If `Dw` is less than or equal to 24-bits and `3LVL` is supported then `M = 3LVL`  
   * If base-format device-contexts are used then  
         1. If `Dw` is less than or equal to 7-bits and `1LVL` is supported then `M = 1LVL`  
         2. If `Dw` is less than or equal to 16-bits and `2LVL` is supported then `M = 2LVL`  
         3. If `Dw` is less than or equal to 24-bits and `3LVL` is supported then `M = 3LVL`  
   * Program the `ddtp` register as follows:  
         1. `temp_ddtp_var.iommu_mode = M`  
         2. `temp_ddtp_var.PPN = B`  
         3. `ddtp = temp_ddtp_var`

The IOMMU is initialized and may be now be configured with device-contexts for devices in scope of the IOMMU.

### [](#guidelines-for-invalidations)Guidelines for invalidations

This section provides guidelines to software on the invalidation commands to send to the IOMMU through the `CQ` when modifying the IOMMU in-memory data structures. Software must perform the invalidation after the update is globally visible. The ordering on stores provided by FENCE instructions and the acquire/ release bits on atomic instructions also orders the data structure updates associated with those stores as observed by IOMMU.

A `IOFENCE.C` command may be used by software to ensure that all previous commands fetched from the `CQ` have been completed and committed. The `PR`and/or `PW` bits may be set to 1 in the `IOFENCE.C` command to request that all previous read and/or write requests, that have already been processed by the IOMMU, be committed to a global ordering point as part of the `IOFENCE.C`command.

In subsequent sections, when an algorithm step tests values in the in-memory data structures to determine the type of invalidation operation to perform, the data values tested are the old values i.e. values before a change is made.

#### [](#DC%5FCHANGE)Changing device directory table entry

If software changes a leaf-level DDT entry (i.e, a device context (`DC`), of device with `device_id = D`) then the following invalidations must be performed:

* `IODIR.INVAL_DDT` with `DV=1` and `DID=D`
* If `DC.iohgatp.MODE != Bare`  
   * `IOTINVAL.VMA` with `GV=1`, `AV=PSCV=0`, and `GSCID=DC.iohgatp.GSCID`  
   * `IOTINVAL.GVMA` with `GV=1`, `AV=0`, and `GSCID=DC.iohgatp.GSCID`
* else  
   * If `DC.tc.PDTV==1`  
         * `IOTINVAL.VMA` with `GV=AV=PSCV=0`  
   * else if `DC.fsc.MODE != Bare`  
         * `IOTINVAL.VMA` with `GV=AV=0` and `PSCV=1`, and `PSCID=DC.ta.PSCID`

If software changes a non-leaf-level DDT entry the following invalidations must be performed:

* `IODIR.INVAL_DDT` with `DV=0`

Between a change to the DDT entry and when an invalidation command to invalidate the cached entry is processed by the IOMMU, the IOMMU may use the old value or the new value of the entry.

#### [](#PC%5FCHANGE)Changing process directory table entry

If software changes a leaf-level PDT entry (i.e, a process context (`PC`), for`device_id=D` and `process_id=P`) then the following invalidations must be performed:

* `IODIR.INVAL_PDT` with `DV=1`, `DID=D` and `PID=P`
* If `DC.iohgatp.MODE != Bare`  
   * `IOTINVAL.VMA` with `GV=1`, `AV=0`, `PSCV=1`, `GSCID=DC.iohgatp.GSCID`, and `PSCID=PC.PSCID`
* else  
   * `IOTINVAL.VMA` with `GV=0`, `AV=0`, `PSCV=1`, and `PSCID=PC.PSCID`

If software changes a non-leaf-level PDT entry the following invalidations must be performed:

* `IODIR.INVAL_DDT` with `DV=1` and `DID=D`

Between a change to the PDT entry and when an invalidation command to invalidate the cached entry is processed by the IOMMU, the IOMMU may use the old value or the new value of the entry.

#### [](#MSI%5FPT%5FCHANGE)Changing MSI page table entry

If software changes a MSI page-table entry identified by interrupt file number `I` that corresponds to an untranslated MSI address `A` then the following invalidations must be performed:

* `IOTINVAL.GVMA` with `GV=AV=1`, `ADDR[63:12]=A[63:12]` and`GSCID=DC.iohgatp.GSCID`

To invalidate all cache entries from a MSI page table the following invalidations must be performed:

* `IOTINVAL.GVMA` with `GV=1`, `AV=0`, and `GSCID=DC.iohgatp.GSCID`

Between a change to the MSI PTE and when an invalidation command to invalidate the cached PTE is processed by the IOMMU, the IOMMU may use the old PTE value or the new PTE value. An `IOFENCE.C` command with `PW=1` may be used to to ensure that all previous writes, including MSI writes, that have been previously processed by the IOMMU are committed to a global ordering point such that they can be observed by all RISC-V harts and IOMMUs in the system.

#### [](#changing-second-stage-page-table-entry)Changing second-stage page table entry

If software changes a leaf second-stage page-table entry of a VM where the change affects translation for a guest-PPN `G` then the following invalidations must be performed:

* `IOTINVAL.GVMA` with `GV=AV=1`, `GSCID=DC.iohgatp.GSCID`, and `ADDR[63:12]=G`

If software changes a non-leaf second-stage page-table entry of a VM then the following invalidations must be performed:

* `IOTINVAL.GVMA` with `GV=1`, `AV=0`, `GSCID=DC.iohgatp.GSCID`

The `DC` has fields that hold a guest-PPN. An implementation may translate such fields to a supervisor-PPN as part of caching the `DC`. If the second-stage page table update affects translation of guest-PPN held in the `DC` then software must invalidate all such cached `DC` using `IODIR.INVAL_DDT` with `DV=1` and`DID` set to the corresponding `device_id`. Alternatively, an`IODIR.INVAL_DDT` with `DV=0` may be used to invalidate all cached `DC`.

Between a change to the second-stage PTE and when an invalidation command to invalidate the cached PTE is processed by the IOMMU, the IOMMU may use the old PTE value or the new PTE value.

#### [](#changing-first-stage-page-table-entry)Changing first-stage page table entry

A `DC` may be configured with a first-stage page table (when `DC.tc.PDTV=0`) or a directory of first-stage page tables selected using `process_id` from a process-directory-table (when `DC.tc.PDTV=1`).

When a change is made to a first-stage page table, and the second-stage is Bare, then software must perform invalidations using `IOTINVAL.VMA` with`GV=0` and `AV` and `PSCV` operands appropriate for the modification as specified in [iommu\_in\_memory\_queues.adoc#IVMA](iommu%5Fin%5Fmemory%5Fqueues.html#IVMA).

When a change is made to a first-stage page table, and the second-stage is not Bare, then software must perform invalidations using `IOTINVAL.VMA` with`GV=1`, `GSCID=DC.iohgatp.GSCID` and `AV` and `PSCV` operands appropriate for the modification as specified in [iommu\_in\_memory\_queues.adoc#IVMA](iommu%5Fin%5Fmemory%5Fqueues.html#IVMA).

Between a change to the first-stage PTE and when an invalidation command to invalidate the cached PTE is processed by the IOMMU, the IOMMU may use the old PTE value or the new PTE value.

#### [](#accessed-adirty-d-bit-updates-and-page-promotions)Accessed (A)/Dirty (D) bit updates and page promotions

When IOMMU supports hardware-managed A and D bit updates, if software clears the A and/or D bit in the first-stage and/or second-stage PTEs then software must invalidate corresponding PTE entries that may be cached by the IOMMU. If such invalidations are not performed, then the IOMMU may not set these bits when processing subsequent transactions that use such entries.

When software upgrades a page in a first-stage PT and/or a second-stage PT to a superpage without first clearing the original non-leaf PTE’s valid bit and invalidating cached translations in the IOMMU then it is possible for the IOMMU to cache multiple entries that match a single address. The IOMMU may use either the old non-leaf PTE or the new non-leaf PTE but the behavior is otherwise well defined.

When promoting and/or demoting page sizes, software must ensure that the original and new PTEs have identical permission and memory type attributes and the physical address that is determined as a result of translation using either the original or the new PTE is otherwise identical for any given input. The only PTE update supported by the IOMMU without first clearing the V bit in the original PTE and executing a appropriate `IOTINVAL` command is to do a page size promotion or demotion. The behavior of the IOMMU if other attributes are changed in this fashion is implementation defined.

#### [](#device-address-translation-cache-invalidations)Device Address Translation Cache invalidations

When first-stage and/or second-stage page tables are modified, invalidations may be needed to the DevATC in the devices that may have cached translations from the modified page tables. Invalidation of such page tables requires generating ATS invalidations using `ATS.INVAL` command. Software must specify the `PAYLOAD`following the rules defined in PCIe ATS specifications \[[5](bibliography.html#bib-pci)\].

If software generates ATS invalidate requests at a rate that exceeds the average DevATC service rate then flow control mechanisms may be triggered by the device to throttle the rate. A side effect of this is congestion spreading to other channels and links which could lead to performance degradation. An ATS capable device publishes the maximum number of invalidations it can buffer before causing back-pressure through the Queue Depth field of the ATS capability structure. When the device is virtualized using PCIe SR-IOV, this queue depth is shared among all the VFs of the device. Software must limit the number of outstanding ATS invalidations queued to the device advertised limit.

The `RID` field is used to specify the routing ID of the ATS invalidation request message destination. A PASID specific invalidation may be performed by setting `PV=1` and specifying the PASID in `PID`. When the IOMMU supports multiple segments then the `RID` must be qualified by the destination segment number by setting `DSV=1` with the segment number provided in `DSEG`.

When ATS protocol is enabled for a device, the IOMMU may still cache translations in its IOATC in addition to providing translations to the DevATC. Software must not skip IOMMU translation cache invalidations even when ATS is enabled in the device context of the device. Since a translation request from the DevATC may be satisfied by the IOMMU from the IOATC, to ensure correct operation software must first invalidate the IOATC before sending invalidations to the DevATC.

#### [](#caching-invalid-entries)Caching invalid entries

This specification does not allow the caching of first/second-stage PTEs whose`V` (valid) bit is clear, non-leaf DDT entries whose `V` (valid) bit is clear, Device-context whose `V` (valid) bit is clear, non-leaf PDT entries whose `V`(valid) bit is clear, Process-context whose `V` (valid) bit is clear, or MSI PTEs whose `V` bit is clear. Software need not perform invalidations when changing the `V` bit in these entries from 0 to 1.

#### [](#guidelines-for-emulating-an-iommu)Guidelines for emulating an IOMMU

Certain uses may involve emulating a RISC-V IOMMU. In such cases, the emulator may require the IOMMU driver to notify the emulator for efficient operation when updates are made to in-memory data structure entries, including when making such entries valid. Queueing an appropriate invalidation command when making such updates is a common way to provide notifications to the emulator. While usually an invalidation is not required when marking an invalid entry as valid, the emulator may indicate the need to invoke such invalidation commands for emulation efficiency purposes through a suitable flag in the device tree or ACPI table describing such emulated IOMMU instances.

### [](#reconfiguring-pmas)Reconfiguring PMAs

Where platforms support dynamic reconfiguration of PMAs, a machine-mode driver is usually provided that can correctly configure the platform. In some platforms that might involve platform-specific operations and if the IOMMU must participate in these operations then platform-specific operations in the IOMMU are used by the machine-mode driver to perform such reconfiguration.

### [](#guidelines-for-handling-interrupts-from-iommu)Guidelines for handling interrupts from IOMMU

IOMMU may generate an interrupt from the `CQ`, the `FQ`, the `PQ`, or the HPM. Each interrupt source may be configured with a unique vector or a vector may be shared among one or more interrupt sources. The interrupt may be delivered as a MSI or a wire-signaled-interrupt. The interrupt handler may perform the following actions:

1. Read the `ipsr` register to determine the source of the pending interrupts
2. If the `ipsr.cip` bit is set then an interrupt is pending from the `CQ`.  
   1. Read the `cqcsr` register.  
   2. Determine if an error caused the interrupt and if so, the cause of the error by examining the state of the `cmd_to`, `cmd_ill`, and `cqmf` bits. If any of these bits are set then the `CQ` encountered an error and command processing is temporarily disabled.  
   3. If errors have occurred, correct the cause of the error and clear the bits corresponding to the corrected errors in `cqcsr` by writing 1 to the bits.  
         1. Clearing all error indication bits in `cqcsr` re-enables command processing.  
   4. An IOMMU that supports wired-interrupts may be requested to generate an interrupt from the command queue on completion of a `IOFENCE.C` command. This cause is indicated by the `fence_w_ip` bit. Note that command processing does not stop when `fence_w_ip` is set to 1\. Software handler may re-enable interrupts from `CQ` on `IOFENCE.C` completions by clearing this bit by writing 1 to it.  
   5. Clear `ipsr.cip` by writing 1 to the bit.
3. If the `ipsr.fip` bit is set then an interrupt is pending from the `FQ`.  
   1. Read the `fqcsr` register.  
   2. Determine if an error caused the interrupt and if so, the cause of the error by examining the state of the `fqmf` and `fqof` bits. If either of these bits are set then the `FQ` encountered an error and fault/event reporting is temporarily disabled.  
   3. If errors have occurred, correct the cause of the error and clear the bits corresponding to the corrected errors in `fqcsr` by writing 1 to the bits.  
         1. Clearing all error indication bits in `fqcsr` re-enables fault/event reporting.  
   4. Clear `ipsr.fip` by writing 1 to the bit.  
   5. Read the `fqt` and `fqh` registers.  
   6. If value of `fqt` is not equal to value of `fqh` then the `FQ` is not empty and contains fault/event reports that need processing.  
   7. Process pending fault/event reports that need processing and remove them from the `FQ` by advancing the `fqh` by the number of records processed.
4. If the `ipsr.pip` bit is set then an interrupt is pending from the `PQ`.  
   1. Read the `pqcsr` register.  
   2. Determine if an error caused the interrupt and if so, the cause of the error by examining the state of the `pqmf` and `pqof` bits. If either of these bits are set then the `PQ` encountered an error and "Page Request" reporting is temporarily disabled.  
   3. If errors have occurred, correct the cause of the error and clear the bits corresponding to the corrected errors in `pqcsr` by writing 1 to the bits.  
         1. Clearing all error indication bits in `pqcsr` re-enables "Page Request" reporting.  
   4. Clear `ipsr.pip` by writing 1 to the bit.  
   5. Read the `pqt` and `pqh` registers.  
   6. If value of `pqt` is not equal to the value of `pqh` then the `PQ` is not empty and contains "Page Request" messages that need processing.  
   7. Process pending "Page Request" messages that need processing and remove them from the `PQ` by advancing the `pqh` by the number of records processed.  
         1. When a `PQ` overflow condition occurs, software may observe incomplete page-request groups due to the "Page Request" messages being dropped. The IOMMU might have automatically responded (see [iommu\_data\_structures.adoc#ATS\_PRI](iommu%5Fdata%5Fstructures.html#ATS%5FPRI)) to a dropped "Page Request" in such groups if the "Last Request in PRG" flag was set to 1 in the message. Software should ignore and not service the such incomplete groups.  
         2. The automatic response to the "Page Request" with "Last request in PRG" set to 1 on a `PQ` overflow is expected to cause the device to retry the ATS translation request. However, since the IOMMU generated response was without actually resolving the condition that caused the "Page Request" to be originally sent by the device, this will likely lead to the device sending the "Page Request" messages again. These retried messages may now be stored in the `PQ` if the overflow condition has been corrected by creating space in the `PQ`.
5. If `ipsr.pmip` bit is set then an interrupt is pending from the HPM.  
   1. Clear `ipsr.pmip` by writing 1 to the bit.  
   2. Process the performance monitoring counter overflows.

### [](#guidelines-for-enabling-and-disabling-ats-andor-pri)Guidelines for enabling and disabling ATS and/or PRI

To enable ATS and/or PRI:

1. Place the device in an idle state such that no transactions are generated by the device.
2. If the device-context for the device is already valid then first mark the device-context as invalid and queue commands to the IOMMU to invalidate all cached first/second-stage page table entries, DDT entries, MSI PT entries (if required), and PDT entries (if required).
3. Program the device-context with `EN_ATS` set to 1 and if required the `T2GPA`field set to 1\. Set `EN_PRI` to 1 if required. If `EN_PRI` is set to 1 then set `PRPR` to 1 if required.
4. Mark the device-context as valid.
5. Enable device to use ATS and if required enable the PRI.

To disable ATS and/or PRI:

1. Place the device in an idle state such that no transactions are generated by the device.
2. Disable ATS and/or PRI at the device
3. Set `EN_ATS` and/or `EN_PRI` to 0 in the device-context. If `EN_ATS` is set to 0 then set `EN_PRI` and `T2GPA` to 0\. If `EN_PRI` is set to 0 then set `PRPR`to 0.
4. Queue commands to the IOMMU to invalidate all cached first/second-stage page table entries, DDT entries, MSI PT entries (if required), and PDT entries (if required).
5. Queue commands to the IOMMU to invalidate DevATC by generating Invalidation Request messages.
6. Enable DMA operations in the device.
