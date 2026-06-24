# 3.1. Capacity-controller QoS Register Interface

## [](#CC%5FQOS)3.1\. Capacity-controller QoS Register Interface

Controllers, such as cache controllers, that support capacity allocation and usage monitoring provide a memory-mapped capacity-controller QoS register interface.

The capacity controller allocates capacity in fixed multiples of _capacity units_. A group of these _capacity units_ is referred to as a _capacity block_. One or more _capacity blocks_ can be allocated to a workload. When a workload requests capacity allocation, the capacity is allocated by using _capacity units_situated within the _capacity blocks_ assigned to the workload. Capacity blocks can also be shared among one or more workloads. Optionally, the capacity controller might allow configuration of a limit on the maximum number of _capacity units_ that can be occupied in the _capacity blocks_ allocated to a specific workload.

| |  For example, a cache controller allocates capacity in multiples of cache blocks. In this context, a cache block serves as a _capacity unit_, and a group of cache blocks forms a _capacity block_. A cache controller supporting capacity allocation _by ways_ might define a _capacity block_ to be the cache blocks in one way of the cache. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The capacity allocation affects the decision regarding which _capacity blocks_to use when a new _capacity unit_ is requested by a workload, but usually does not affect other operations of the controller.

| |  For example, when a request is made to a cache controller, the request involves scanning the entire cache to determine if the requested data is present. If the data is located, then the request is fulfilled with this data, even if the cache block containing the data was initially allocated for a different workload. The data continues to reside in the same cache block. Consequently, the cache lookup function remains unaffected by the capacity allocation constraints set for the workload that initiated the request. Conversely, if the data is not found, a new cache block must be allocated. This allocation is executed by using the _capacity blocks_ assigned to the workload that made the request. Hence, a workload might only trigger evictions within _capacity blocks_ designated to it, but can access shared data in _capacity blocks_ allocated to other workloads. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

__Table 1\. Capacity-controller QoS Register Layout (size and offset are in bytes)__
| Offset | Name              | Size  | Description                                 | Optional? |
| ------ | ----------------- | ----- | ------------------------------------------- | --------- |
| 0      | cc\_capabilities  | 8     | [Capabilities ](#CC%5FCAP)                  | No        |
| 8      | cc\_mon\_ctl      | 8     | [Usage monitoring control](#CC%5FMCTL)      | Yes       |
| 16     | cc\_mon\_ctr\_val | 8     | [Monitoring counter value](#CC%5FMCTR)      | Yes       |
| 24     | cc\_alloc\_ctl    | 8     | [Capacity allocation control ](#CC%5FALLOC) | Yes       |
| 32     | cc\_block\_mask   | BMW/8 | [Capacity block mask ](#CC%5FBMASK)         | Yes       |
| N      | cc\_cunits        | 8     | [Capacity units count](#CC%5FCUNITS)        | Yes       |

The size of the `cc_block_mask` register is determined by the `NCBLKS` field of the `cc_capabilities` register but is always a multiple of 8 bytes. The formula for determination of `BMW` is defined in [3.1.5\. Capacity Block Mask (cc\_block\_mask)](#CC%5FBMASK). The offset `N` is determined as `32 + BMW/8`.

The reset value is 0 for the following register fields.

* `cc_mon_ctl.BUSY` field
* `cc_alloc_ctl.BUSY` field

The reset value is `UNSPECIFIED` for all other registers fields.

The capacity controllers at reset must allocate all available capacity to `RCID`value of 0\. When the capacity controller supports capacity allocation per access-type, then all available capacity is shared by all the access-type for`RCID=0`. The capacity allocation for all other `RCID` values is `UNSPECIFIED`. The capacity controller behavior for handling a request with a non-zero `RCID`value before configuring the capacity controller with capacity allocation for that `RCID` is `UNSPECIFIED`.

### [](#CC%5FCAP)3.1.1\. Capacity-controller Capabilities

The `cc_capabilities` register is a read-only register that holds the capacity-controller capabilities.

![Capacity-controller Capabilities Register](_images/diag-ab2459cfbc6d51417953349d85dff96813659f68.svg) 

Figure 1\. Capacity-controller Capabilities Register

The `VER` field holds the version of the specification implemented by the capacity controller. The low nibble is used to hold the minor version of the specification and the upper nibble is used to hold the major version of the specification. For example, an implementation that supports version 1.0 of the specification reports 0x10.

The `NCBLKS` field holds the total number of allocatable _capacity blocks_ in the controller. The capacity represented by an allocatable _capacity block_ is`UNSPECIFIED`. The capacity controllers support allocating capacity in fixed multiples of an allocatable _capacity block_.

| |  For example, a cache controller that defines a way of the cache as a _capacity block_ may report the number of ways as the number of allocatable _capacity blocks_. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If `CUNITS` is 1, the controller supports specifying a limit on the _capacity units_ that can be occupied by an `RCID` in _capacity blocks_ allocated to it.

If `FRCID` is 1, the controller supports an operation to flush and deallocate the _capacity blocks_ occupied by an `RCID`.

When the `RCID`\-prefixed mode (`RPFX`) is 1, the controller operates in `RPFX`mode. The parameter `P` (prefixed bits) indicates the number of least significant bits of the `MCID` carried in the request that should be prefixed by the RCID. The controller uses `RCID` in the requests along with `P` number of least significant bits of the `MCID` to compute an effective `MCID` ([\[EMCID\]](#EMCID)). This `MCID` is used to identify the monitoring counter. Legal values of `P` range from 0 to 12.

If `RPFX` is 0, `P` is set to 0, and the effective `MCID` is the same as the `MCID`in the request.

### [](#CC%5FMCTL)3.1.2\. Capacity Usage Monitoring Control

The `cc_mon_ctl` register is used to control monitoring of capacity usage by a`MCID`. When the controller does not support capacity usage monitoring the`cc_mon_ctl` register is read-only zero.

![Capacity Usage Monitoring Control Register (`cc_mon_ctl`)](_images/diag-162d092e66bc48cb21fbd7a767a4dfd60241b10e.svg) 

Figure 2\. Capacity Usage Monitoring Control Register (`cc_mon_ctl`)

Capacity controllers that support capacity usage monitoring implement a usage monitoring counter for each supported `MCID`. The usage monitoring counter can be configured to count a monitoring event. When an event matching the event configured for the `MCID` occurs, then the monitoring counter is updated. The event matching might optionally be filtered by the access-type identifier.

The `OP`, `AT`, `ATV`, `MCID`, and `EVT_ID` fields of the register are WARL fields.

The `OP` field is used to instruct the controller to perform an operation listed in [Table 2](#CC%5FMON%5FOP).

__Table 2\. Capacity Usage Monitoring Operations (OP)__
| Operation     | Encoding | Description                                                                                                                                                |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —             | 0        | Reserved for future standard use.                                                                                                                          |
| CONFIG\_EVENT | 1        | Configure the counter selected by MCID to count the event selected by EVT\_ID, AT, and ATV. The EVT\_ID encodings are listed in [Table 3](#CC%5FEVT%5FID). |
| READ\_COUNTER | 2        | Snapshot the value of the counter selected byMCID into cc\_mon\_ctr\_val register. TheEVT\_ID, AT, and ATV fields are not used by this operation.          |
| —             | 3-23     | Reserved for future standard use.                                                                                                                          |
| —             | 24-31    | Designated for custom use.                                                                                                                                 |

The `EVT_ID` field is used to program the identifier of the event to count in the monitoring counter selected by `MCID`. The `AT` field (See [\[AT\_ENC\]](#AT%5FENC)) is used to program the access-type identifier to count, and its validity is indicated by the`ATV` field. When `ATV` is 0, the counter counts requests with all access-type identifiers, and the `AT` value is ignored.

__Table 3\. Capacity Usage Monitoring Event ID (EVT\_ID)__
| Event ID  | Encoding | Description                                                                                                                                                                   |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| None      | 0        | Counter does not count.                                                                                                                                                       |
| Occupancy | 1        | Counter is incremented by 1 when a request with a matching MCID and AT allocates a unit of capacity. The counter is decremented by 1 when a unit of capacity is de-allocated. |
| —         | 2-127    | Reserved for future standard use.                                                                                                                                             |
| —         | 128-256  | Designated for custom use.                                                                                                                                                    |

When the `EVT_ID` for a `MCID` is programmed with a non-zero and legal value by using the `CONFIG_EVENT` operation, the counter is reset to 0 and starts counting matching events for requests with the matching `MCID` and `AT` (if `ATV` is 1). However, if the `EVT_ID` is programmed to 0, the counter stops counting.

A controller that does not support monitoring by access-type identifier can hardwire the`ATV` and the `AT` fields to 0, indicating that the counter counts requests with all access-types identifiers.

When the `cc_mon_ctl` register is written, the controller can perform several actions that might not complete synchronously with the write. A write to the `cc_mon_ctl` sets the read-only `BUSY` bit to 1, indicating the controller is performing the requested operation. When the `BUSY` bit reads 0, the operation is complete, and the read-only `STATUS` field provides a status value (see[Table 4](#CC%5FMON%5FSTS) for details). Written values to the `BUSY` and the `STATUS`fields are ignored. An implementation that can complete the operation synchronously with the write may hardwire the `BUSY` bit to 0\. The state of the`BUSY` bit, when not hardwired to 0, shall only change in response to a write to the register. The `STATUS` field remains valid until a subsequent write to the`cc_mon_ctl` register.

__Table 4\. cc\_mon\_ctl.STATUS Field Encodings__
| STATUS | Description                                        |
| ------ | -------------------------------------------------- |
| 0      | Reserved                                           |
| 1      | The operation was successfully completed.          |
| 2      | An invalid operation (OP) was requested.           |
| 3      | An operation was requested for an invalid MCID.    |
| 4      | An operation was requested for an invalid EVT\_ID. |
| 5      | An operation was requested for an invalid AT.      |
| 6-63   | Reserved for future standard use.                  |
| 64-127 | Designated for custom use.                         |

When the `BUSY` bit is set to 1, the behavior of writes to the `cc_mon_ctl` is`UNSPECIFIED`. Some implementations ignore the second write, while others might perform the operation determined by the second write. To ensure proper operation, software must first verify that the `BUSY` bit is 0 before writing the `cc_mon_ctl` register.

### [](#CC%5FMCTR)3.1.3\. Capacity Usage Monitoring Counter Value

The `cc_mon_ctr_val` is a read-only register that holds a snapshot of the counter that is selected by the `READ_COUNTER` operation. When the controller does not support capacity usage monitoring, the `cc_mon_ctr_val` register always reads as zero.

![Capacity Usage Monitoring Counter Value Register (`cc_mon_ctr_val`)](_images/diag-0f774051a3dcdd794ba4449388a8cd44a92bcb87.svg) 

Figure 3\. Capacity Usage Monitoring Counter Value Register (`cc_mon_ctr_val`)

The counter is valid if the `INV` field is 0\. The counter is marked `INV` if the controller determines the count to be not valid for `UNSPECIFIED` reasons. The counters marked `INV` can become valid in future.

The counter shall not decrement below zero. If an event occur that would otherwise result in a negative value, the counter continues to hold a value of 0.

| |  Following a reset of the counter to zero, a capacity de-allocation attempts to drive its value below zero. This scenario occurs when the MCID is reassigned to a new workload, yet the capacity controller continues to hold capacity that was initially allocated by the previous workload. In such cases, the counter shall not decrement below zero and shall remain at zero. After a brief period of execution for the new workload post-counter reset, the counter value is expected to stabilize to reflect the capacity usage of this new workload. Some implementations might not store the MCID of the request that caused the capacity to be allocated with every unit of capacity in the controller to optimize for the storage overheads. Such controllers, in turn, rely on statistical sampling to report the capacity usage by tagging only a subset of the capacity units. Set-sampling is a technique commonly used in caches to estimate the cache occupancy with a relatively small sample size. The basic idea behind set-sampling is to select a subset of the cache sets and monitor only those sets. By keeping track of the hits and misses in the monitored sets, it is possible to estimate the overall cache occupancy with a high degree of accuracy. The size of the subset needed to obtain accurate estimates depends on various factors, such as the size of the cache, the cache access patterns, and the desired accuracy level. Research \[[6](qos%5Fbiblio.html#bib-ssample)\] shows that set-sampling can provide statistically accurate estimates with a relatively small sample size, such as 10% or less, depending on the cache properties and sampling technique used. When the controller has not observed enough samples to provide an accurate value in the monitoring counter, it might report the counter as being INVuntil more accurate measurements are available. This state helps to prevent inaccurate or misleading data from being used in capacity planning or other decision-making processes. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#CC%5FALLOC)3.1.4\. Capacity Allocation Control

The `cc_alloc_ctl` register is used to configure allocation of capacity to an`RCID` per access type (`AT`). The `OP`, `RCID` and `AT` fields in this register are WARL. If a controller does not support capacity allocation, then this register is read-only zero. If the controller does not support capacity allocation per access type, then the `AT` field is read-only zero.

![Capacity Allocation Control Register (`cc_alloc_ctl`)](_images/diag-1c4adea840207d816fcbe59d0dc7abfe92f9c651.svg) 

Figure 4\. Capacity Allocation Control Register (`cc_alloc_ctl`)

The `OP` field is used to instruct the capacity controller to perform an operation listed in [Table 5](#CC%5FALLOC%5FOP). Some operations necessitate the specification of the _capacity blocks_ to act upon. For such operations, the targeted _capacity blocks_ are designated in the form of a bitmask in the`cc_block_mask` register. Additionally, certain operations require the _capacity unit_ limit to be defined in the `cc_cunits` register. To execute operations that require a capacity block mask and/or a capacity unit limit, software must first program the `cc_block_mask` and/or the `cc_cunits` register, followed by initiating the operation with the `cc_alloc_ctl` register.

__Table 5\. Capacity Allocation Operations (OP)__
| Operation     | Encoding | Description                                                                                                                                                                                                                                                                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —             | 0        | Reserved for future standard use.                                                                                                                                                                                                                                                                                                        |
| CONFIG\_LIMIT | 1        | Configure a capacity allocation for requests byRCID and of access type AT. The _capacity blocks_ allocation is specified in thecc\_block\_mask register, and a limit on capacity units is specified in the cc\_cunits register.                                                                                                          |
| READ\_LIMIT   | 2        | Read back the previously configured capacity allocation for requests by RCID and of access-type AT. The configured _capacity block_ allocation is returned as a bit-mask in thecc\_block\_mask register, and the configured limit on _capacity units_ is available in the cc\_cunits register on successful completion of the operation. |
| FLUSH\_RCID   | 3        | Flushes the _capacity units_ used by the specifiedRCID and access-type AT. This operation is supported if the capabilities.FRCID bit is 1\.  The cc\_block\_mask and cc\_cunits registers are not used for this operation.  The configured _capacity block_ allocation or the_capacity unit_ limit is not changed by this operation.     |
| —             | 4-23     | Reserved for future standard use.                                                                                                                                                                                                                                                                                                        |
| —             | 24-31    | Designated for custom use.                                                                                                                                                                                                                                                                                                               |

Capacity controllers enumerate the allocatable _capacity blocks_ in the `NCBLKS`field of the `cc_capabilities` register. The `cc_block_mask` register is programmed with a bit-mask value, where each bit represents a _capacity block_ for the operation. If configuring _capacity unit_ limits is supported (for example,`cc_capabilities.CUNIT=1`), then a limit on the _capacity unit_ that can be occupied in the allocated capacity blocks can be programmed in the `cc_cunits`register. If configuring limits is not supported, then the controller allows the use of all _capacity units_ in the allocated _capacity blocks_. A value of zero programmed into `cc_cunits` indicates that no limits shall be enforced on_capacity unit_ allocation.

A capacity allocation must be configured for each supported access type by the controller. An implementation that does not support capacity allocation per access type can hardwire the `AT` field to 0 and associate the same capacity allocation configuration for requests with all access types. When capacity allocation per access type is supported, identical limits can be configured for two or more access types, if different capacity allocation per access type is not required. If capacity is not allocated for each access type supported by the controller, the behavior is `UNSPECIFIED`.

| |  A cache controller that supports capacity allocation indicates the number of allocatable _capacity blocks_ in cc\_capabilities.NCBLKS field. For example, consider a cache with NCBLKS=8. In this example, the RCID=5 is allocated _capacity blocks_ numbered 0 and 1 for requests with access type AT=0, and _capacity blocks_ numbered 2 for requests with access typeAT=1. The RCID=3 in this example is allocated _capacity blocks_numbered 3 and 4 for both AT=0 and AT=1 access types as separate capacity allocation by access type is not required for this workload. Further in this example, the RCID=6 has been configured with the same _capacity block_allocations as RCID=3. This configuration implies that they share a common capacity allocation in this cache, but might be associated with different RCID to allow differentiated treatment in another capacity and/or bandwidth controller. 7 6 5 4 3 2 1 0 RCID=3, AT=0 0 0 0 1 1 0 0 0 RCID=3, AT=1 0 0 0 1 1 0 0 0 RCID=5, AT=0 0 0 0 0 0 0 1 1 RCID=5, AT=1 0 0 0 0 0 1 0 0 RCID=6, AT=0 0 0 0 1 1 0 0 0 RCID=6, AT=1 0 0 0 1 1 0 0 0 Some controllers allow setting a limit on _capacity units_ in allocated capacity blocks. In exclusive allocations, like for RCID=5, the limit can be the capacity block’s maximum capacity. For shared allocations, such as betweenRCID=3 and RCID=6, individual limits can be set. For example, if two capacity blocks represent 100 units and RCID=3 has a 30-unit limit whileRCID=6 has a 70-unit limit, they can use 30% and 70% of the shared capacity blocks, respectively. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The `FLUSH_RCID` operation can incur a long latency to complete. However, the`RCID` can submit new requests to the controller while it is being flushed. Additionally, the controller is allowed to deallocate capacity that was allocated after the operation was initiated.

| |  For cache controllers, the FLUSH\_RCID operation perfoms an operation similar to that performed by the RISC-V CBO.FLUSH instruction on each cache block that is part of the allocation configured for the RCID. The FLUSH\_RCID operation can be used as part of reclaiming a previously allocated RCID and associating it with a new workload. When such a reallocation is performed, the capacity controllers might have capacity allocated by the old workload and thus for a short warm-up duration, the capacity controller might be enforcing capacity allocation limits that reflect the usage by the old workload. Such warm-up durations are typically not statistically significant, but if that is not desired, then the FLUSH\_RCID operation can be used to flush and evict capacity allocated by the old workload. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

When the `cc_alloc_ctl` register is written, the controller might perform several actions that might not complete synchronously with the write. A write to the `cc_alloc_ctl` sets the read-only `BUSY` bit to 1, indicating the controller is performing the requested operation. When the `BUSY` bit reads 0, the operation is complete, and the read-only `STATUS` field provides a status value ([Table 6](#CC%5FALLOC%5FSTS)) of the requested operation. Values that are written to the `BUSY` and the `STATUS` fields are always ignored. An implementation that can complete the operation synchronously with the write might hardwire the `BUSY` bit to 0\. The state of the `BUSY` bit, when not hardwired to 0, shall change only in response to a write to the register. The `STATUS` field remains valid until a subsequent write to the `cc_alloc_ctl` register.

__Table 6\. cc\_alloc\_ctl.STATUS Field Encodings__
| STATUS | Description                                         |
| ------ | --------------------------------------------------- |
| 0      | Reserved                                            |
| 1      | The operation was successfully completed.           |
| 2      | An invalid or unsupported operation (OP) requested. |
| 3      | An operation was requested for an invalid RCID.     |
| 4      | An operation was requested for an invalid AT.       |
| 5      | An invalid _capacity block_ mask was specified.     |
| 6-63   | Reserved for future standard use.                   |
| 64-127 | Designated for custom use.                          |

When the `BUSY` bit is set to 1, the behavior of writes to the `cc_alloc_ctl`register, `cc_cunits` register, or to the `cc_block_mask` register is`UNSPECIFIED`. Some implementations might ignore the second write and others might perform the operation determined by the second write. To ensure proper operation, software must verify that `BUSY` bit is 0 before writing any of these registers.

### [](#CC%5FBMASK)3.1.5\. Capacity Block Mask (`cc_block_mask`)

The `cc_block_mask` is a WARL register. If the controller does not support capacity allocation, for example, `NCBLKS` is 0, then this register is read-only 0.

The register has `NCBLKS` bits, each corresponding to one allocatable_capacity block_ in the controller. The width of this register is variable, but always a multiple of 64 bits. The bitmap width in bits (`BMW`) is determined by the following equation. The division operation in this equation is an integer division.

Bits `NCBLKS-1:0` are read-write, and the bits `BMW-1:NCBLKS` are read-only zero.

The process of configuring capacity allocation for an `RCID` and `AT` begins by programming the `cc_block_mask` register with a bit-mask value that identifies the_capacity blocks_ to be allocated and, if supported, by programming the`cc_cunits` register with a limit on the capacity units that might be occupied in those capacity blocks. Next, the `cc_alloc_ctl register` is written to request a`CONFIG_LIMIT` operation for the `RCID` and `AT`. After a capacity allocation limit is established, a request can be allocated capacity in the _capacity blocks_ allocated to the `RCID` and `AT` associated with the request. It is important to note that some implementations might require at least one _capacity block_ to be allocated by using `cc_block_mask` when allocating capacity; otherwise, the operation fails with `STATUS=5`. Overlapping _capacity block_masks among `RCID` and/or `AT` are allowed to be configured.

| |  A multiway set-associative cache controller that supports capacity allocation _by ways_ can advertise NCBLKS as the number of ways per set in the cache. To allocate capacity in such a cache for an RCID and AT, a subset of ways must be selected and a mask of the selected ways must be programmed in cc\_block\_mask field when the CONFIG\_LIMIT operation is requested. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

To read the _capacity block_ allocation for an `RCID` and `AT`, the controller provides the `READ_LIMIT` operation, which can be requested by writing to the`cc_alloc_ctl` register. When the operation completes successfully, the`cc_block_mask` register holds the configured _capacity block_ allocation.

### [](#CC%5FCUNITS)3.1.6\. Capacity Units

The `cc_cunits` register is a read-write WARL register. If the controller does not support capacity allocation (for example, `NCBLKS` is set to 0), this register shall be read-only zero.

If the controller does not support configuring limits on _capacity units_ that may be occupied in the allocated _capacity blocks_ (for example,`cc_capabilities.CUNITS=0`), then this register shall be read-only zero. In such cases, the controller allows the utilization of all available _capacity units_ by an `RCID` within the _capacity blocks_ allocated to it.

If the controller supports configuring limits on _capacity units_ that might be occupied in the allocated _capacity blocks_ (for example, `cc_capabilities.CUNITS=1`) then this register sets an upper limit on the number of _capacity units_ that can be occupied by an `RCID` in the _capacity blocks_ allocated for an `AT`. A value of zero specified in the `cc_cunits` register indicates that no limit is configured.

The sum of the `cc_cunits` configured for the `RCID` sharing a _capacity block_allocation may exceed the _capacity units_ represented by that _capacity block_allocation.

| |  When multiple RCID instances share a _capacity block_ allocation, thecc\_cunits register can be employed to set an upper limit on the number of_capacity units_ each RCID can occupy. For instance, consider a group of four RCID instances configured to share a set of _capacity blocks_, representing a total of 100 capacity units. EachRCID can be configured with a limit of 30 capacity units, ensuring that no individual RCID exceeds 30% of the total shared _capacity units_. The capacity controller might enforce these limits through various techniques. Examples include: Refraining from allocating new capacity units to an RCID that reached its limit. Evicting previously allocated capacity units when a new allocation is required. These methods are not exhaustive and can be applied either individually or in combination to maintain _capacity unit_ limits. When the limit on the _capacity units_ is reached or is about to be reached, the capacity controller can initiate additional operations. These could include throttling certain activities (for example, prefetches) of the corresponding workload requests. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

To read the _capacity unit_ limit for an `RCID` and `AT`, the controller provides the `READ_LIMIT` operation that can be requested by writing to the`cc_alloc_ctl` register. When the operation completes successfully, the`cc_cunits` register holds the configured _capacity unit_ allocation limit.
