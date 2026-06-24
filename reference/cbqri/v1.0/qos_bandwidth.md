# 4.1. Bandwidth-controller QoS Register Interface

## [](#BC%5FQOS)4.1\. Bandwidth-controller QoS Register Interface

Controllers, such as memory controllers, that support bandwidth allocation and bandwidth usage monitoring provide a memory-mapped bandwidth-controller QoS register interface.

__Table 1\. Bandwidth-controller QoS Register Layout (size and offset are in bytes)__
| Offset | Name              | Size | Description                                 | Optional? |
| ------ | ----------------- | ---- | ------------------------------------------- | --------- |
| 0      | bc\_capabilities  | 8    | [Capabilities](#BC%5FCAP)                   | No        |
| 8      | bc\_mon\_ctl      | 8    | [Usage monitoring control](#BC%5FMCTL)      | Yes       |
| 16     | bc\_mon\_ctr\_val | 8    | [Monitoring counter value](#BC%5FMCTR)      | Yes       |
| 24     | bc\_alloc\_ctl    | 8    | [Bandwidth allocation control](#BC%5FALLOC) | Yes       |
| 32     | bc\_bw\_alloc     | 8    | [Bandwidth allocation](#BC%5FBMASK)         | Yes       |

The reset value is 0 for the following register fields.

* `bc_mon_ctl.BUSY` field
* `bc_alloc_ctl.BUSY` field

The reset value is `UNSPECIFIED` for all other register fields.

The bandwidth controllers at reset must allocate all available bandwidth to`RCID` value of 0\. When the bandwidth controller supports bandwidth allocation per access-type, the access-type value of 0 of `RCID=0` is allocated all available bandwidth, while all other access-types associated with that `RCID`share the bandwidth allocation with `AT=0`. The bandwidth allocation for all other `RCID` values is `UNSPECIFIED`. The bandwidth controller behavior in handling a request with a non-zero `RCID` value before configuring the bandwidth controller with bandwidth allocation for that `RCID` is also `UNSPECIFIED`.

### [](#BC%5FCAP)4.1.1\. Bandwidth-controller Capabilities

The `bc_capabilities` register is a read-only register that holds the bandwidth-controller capabilities.

![Bandwidth-controller Capabilities Register](_images/diag-a4a69ee6f09305554dc691b79852eb20e7cc61ee.svg) 

Figure 1\. Bandwidth-controller Capabilities Register

The `VER` field holds the version of the specification implemented by the bandwidth controller. The low nibble is used to hold the minor version of the specification and the upper nibble is used to hold the major version of the specification. For example, an implementation that supports version 1.0 of the specification reports `0x10`.

The `NBWBLKS` field holds the total number of available bandwidth blocks in the controller. The bandwidth represented by each bandwidth block is`UNSPECIFIED`. The bandwidth controller supports reserving bandwidth in multiples of a bandwidth block, which enables proportional allocation of bandwidth.

Bandwidth controllers can limit the maximum bandwidth that can be reserved to a value smaller than the `NBWBLKS` value. The `MRBWB` field reports the maximum number of bandwidth blocks that can be reserved.

| |  The bandwidth controller meters the bandwidth usage by a workload to determine if it is exceeding its allocations and, if necessary, take measures to throttle the workload’s bandwidth usage. Therefore, the instantaneous bandwidth used by a workload either exceeds or falls short of the configured allocation. QoS capabilities are statistical in nature and are typically designed to enforce the configured bandwidth over larger time windows. By not allowing all available bandwidth blocks to be reserved for allocation, the bandwidth controller can handle such transient inaccuracies. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

When the `RCID`\-prefixed mode (`RPFX`) is 1, the controller operates in `RPFX`mode. The parameter `P` (prefixed bits) indicates the number of least significant bits of the `MCID` carried in the request that should be prefixed by the RCID. The controller uses `RCID` in the requests along with `P` number of least significant bits of the `MCID` to compute an effective `MCID` ([\[EMCID\]](#EMCID)). This `MCID` is used to identify the monitoring counter. Legal values of `P` range from 0 to 12.

If `RPFX` is 0, `P` is set to 0, and the effective `MCID` is the same as the `MCID`in the request.

### [](#BC%5FMCTL)4.1.2\. Bandwidth Usage Monitoring Control

The `bc_mon_ctl` register controls the monitoring of bandwidth usage by a`MCID`. When the controller does not support bandwidth usage monitoring, the`bc_mon_ctl` register is read-only zero.

![Bandwidth Usage Monitoring Control Register (`bc_mon_ctl`)](_images/diag-162d092e66bc48cb21fbd7a767a4dfd60241b10e.svg) 

Figure 2\. Bandwidth Usage Monitoring Control Register (`bc_mon_ctl`)

Bandwidth controllers that support bandwidth usage monitoring implement a usage monitoring counter for each supported `MCID`. The usage monitoring counter might be configured to count a monitoring event. When an event matching the event configured for the `MCID` occurs, then the monitoring counter is updated. The event matching can optionally be filtered by the access-type. The monitoring counter for bandwidth usage counts the number of bytes transferred by requests matching the monitoring event as the requests go past the monitoring point.

The `OP`, `AT`, `MCID`, and `EVT_ID` fields of the register are WARL fields.

The `OP` field is used to instruct the controller to perform an operation listed in [Table 2](#BC%5FMON%5FOP).

__Table 2\. Bandwidth Usage Monitoring Operations (OP)__
| Operation     | Encoding | Description                                                                                                                                                |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —             | 0        | Reserved for future standard use.                                                                                                                          |
| CONFIG\_EVENT | 1        | Configure the counter selected by MCID to count the event selected by EVT\_ID, AT, and ATV. The EVT\_ID encodings are listed in [Table 3](#BC%5FEVT%5FID). |
| READ\_COUNTER | 2        | Snapshot the value of the counter selected byMCID into bc\_mon\_ctr\_val register. TheEVT\_ID, AT, and ATV fields are not used by this operation.          |
| —             | 3-23     | Reserved for future standard use.                                                                                                                          |
| —             | 24-31    | Designated for custom use.                                                                                                                                 |

The `CONFIG_EVENT` operation uses the `EVT_ID` operand to program the identifier of the event to count in the monitoring counter, selected by `MCID`. The `AT` field is used to program the access-type to count, and its validity is indicated by the `ATV` field. When `ATV` is 0, the counter counts requests with all access-types, and the `AT` value is ignored.

__Table 3\. Bandwidth Monitoring Event ID (EVT\_ID)__
| Event ID                        | Encoding | Description                                                                                                                        |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| None                            | 0        | Counter does not count.                                                                                                            |
| Total Read and Write byte count | 1        | Counter is incremented by the number of bytes transferred by a matching read or write request as the requests go past the monitor. |
| Total Read byte count           | 2        | Counter is incremented by the number of bytes transferred by a matching read request as the requests go past the monitor.          |
| Total Write byte count          | 3        | Counter is incremented by the number of bytes transferred by a matching write request as the requests go past the monitor.         |
| —                               | 4-127    | Reserved for future standard use.                                                                                                  |
| —                               | 128-256  | Designated for custom use.                                                                                                         |

When the `EVT_ID` for a `MCID` is programmed with a non-zero and legal value, the counter is reset to 0 and starts counting matching events for requests with the matching `MCID` and `AT` (if `ATV` is 1). However, if the `EVT_ID` is configured as 0, the counter stops counting.

A controller that does not support monitoring by access-type can hardwire the`ATV` and the `AT` fields to 0, indicating that the counter counts requests with all access-types.

When the `bc_mon_ctl` register is written, the controller may need to perform several actions that may not complete synchronously with the write. A write to the `bc_mon_ctl` register sets the read-only `BUSY` bit to 1, indicating that the controller is performing the requested operation. When the `BUSY` bit reads 0, the operation is complete, and the read-only `STATUS` field provides a status value (see [Table 4](#BC%5FMON%5FSTS) for details). Written values to the `BUSY` and the `STATUS`fields are ignored. An implementation that can complete the operation synchronously with the write may hardwire the `BUSY` bit to 0\. The state of the`BUSY` bit, when not hardwired to 0, shall only change in response to a write to the register. The `STATUS` field remains valid until a subsequent write to the`bc_mon_ctl` register.

__Table 4\. bc\_mon\_ctl.STATUS Field Encodings__
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

When the `BUSY` bit is set to 1, the behavior of writes to the `bc_mon_ctl` is`UNSPECIFIED`. Some implementations may ignore the second write, while others may perform the operation determined by the second write. To ensure proper operation, software must first verify that the `BUSY` bit is 0 before writing the `bc_mon_ctl` register.

### [](#BC%5FMCTR)4.1.3\. Bandwidth Monitoring Counter Value

The `bc_mon_ctr_val` is a read-only register that holds a snapshot of the counter selected by a `READ_COUNTER` operation. When the controller does not support bandwidth usage monitoring, the `bc_mon_ctr_val` register always reads as zero.

![Bandwidth Monitoring Counter Value Register (`bc_mon_ctr_val`)](_images/diag-ec48b38e971c869e86b7a87095690d44bef9849c.svg) 

Figure 3\. Bandwidth Monitoring Counter Value Register (`bc_mon_ctr_val`)

The counter is valid if the `INV` field is 0\. The counter may be marked`INV` if, for `UNSPECIFIED` reasons, the controller determines the count to be not valid. Such counters may become valid in the future. Additionally, if an unsigned integer overflow of the counter occurs, then the `OVF` bit is set to 1.

| |  A counter may be marked as INV if the controller has not been able to establish an accurate counter value for the monitored event. |
| ------------------------------------------------------------------------------------------------------------------------------------- |

The counter provides the number of bytes transferred by requests matching the`EVT_ID` as they go past the monitoring point. A bandwidth value may be determined by reading the byte count value at two instances of time `T1` and`T2`. If the value of the counter at time `T1` was `B1`, and at time `T2` is`B2`, then the bandwidth can be calculated using [equation (1)](#eq-3). The frequency of the time source is represented by .

The width of the counter is `UNSPECIFIED` but the unimplemented bits must be read-only zero.

| |  While the width of the counter is UNSPECIFIED, it is recommended to be wide enough to prevent more than one overflow per sample when the sampling frequency is 1 Hz. If an overflow was detected then software may discard that sample and reset the counter and overflow indication by reprogramming the event using CONFIG\_EVENToperation. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#BC%5FALLOC)4.1.4\. Bandwidth Allocation Control

The `bc_alloc_ctl` register is used to control the allocation of bandwidth to an`RCID` per `AT`. If a controller does not support bandwidth allocation, then the register is read-only zero. If the controller does not support bandwidth allocation per access-type, then the `AT` field is read-only zero.

![Bandwidth Allocation Control Register (`bc_alloc_ctl`)](_images/diag-1c4adea840207d816fcbe59d0dc7abfe92f9c651.svg) 

Figure 4\. Bandwidth Allocation Control Register (`bc_alloc_ctl`)

The `OP` field instructs the bandwidth controller to perform an operation listed in [Table 5](#BC%5FALLOC%5FOP). The `bc_alloc_ctl` register is used in conjunction with the`bc_bw_alloc` register to perform bandwidth allocation operations. If the requested operation uses the operands configured in `bc_bw_alloc`, software must first program the `bc_bw_alloc` register with the operands for the operation before requesting the operation.

__Table 5\. Bandwidth Allocation Operations (OP)__
| Operation     | Encoding | Description                                                                                                                                                                                         |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —             | 0        | Reserved for future standard use.                                                                                                                                                                   |
| CONFIG\_LIMIT | 1        | Establishes reserved bandwidth allocation for requests by RCID and of access-type AT. The bandwidth allocation is specified in bc\_bw\_alloc.                                                       |
| READ\_LIMIT   | 2        | Reads back the previously configured bandwidth allocation for requests by RCID and of access-type AT. The current configured allocation is written to bc\_bw\_alloc on completion of the operation. |
| —             | 3-23     | Reserved for future standard use.                                                                                                                                                                   |
| —             | 24-31    | Designated for custom use.                                                                                                                                                                          |

A bandwidth allocation must be configured for each access-type supported by the controller. When differentiated bandwidth allocation based on access-type is not required, one of the access-types may be designated to hold a default bandwidth allocation, and the other access-types can be configured to share the allocation with the default access-type. If bandwidth is not allocated for each access-type supported by the controller, the behavior is `UNSPECIFIED`.

When the `bc_alloc_ctl` register is written, the controller may need to perform several actions that may not complete synchronously with the write. A write to the `bc_alloc_ctl` sets the read-only `BUSY` bit to 1 indicating the controller is performing the requested operation. When the `BUSY` bit reads 0, the operation is complete, and the read-only `STATUS` field provides a status value (see[Table 6](#BC%5FALLOC%5FSTS) for details). Written values to the `BUSY` and the `STATUS`fields are ignored. An implementation that can complete the operation synchronously with the write may hardwire the `BUSY` bit to 0\. The state of the`BUSY` bit, when not hardwired to 0, shall only change in response to a write to the register. The `STATUS` field remains valid until a subsequent write to the`bc_alloc_ctl` register.

__Table 6\. bc\_alloc\_ctl.STATUS Field Encodings__
| STATUS | Description                                                       |
| ------ | ----------------------------------------------------------------- |
| 0      | Reserved                                                          |
| 1      | The operation was successfully completed.                         |
| 2      | An invalid operation (OP) was requested.                          |
| 3      | An operation was requested for an invalid RCID.                   |
| 4      | An operation was requested for an invalid AT.                     |
| 5      | An invalid or unsupported reserved bandwidth block was requested. |
| 6-63   | Reserved for future standard use.                                 |
| 64-127 | Designated for custom use.                                        |

### [](#BC%5FBMASK)4.1.5\. Bandwidth Allocation Configuration

The `bc_bw_alloc` is used to program reserved bandwidth blocks (`Rbwb`) for an`RCID` for requests of access-type `AT` using the `CONFIG_LIMIT` operation. If a controller does not support bandwidth allocation, then the `bc_bw_alloc` register is read-only zero.

The `bc_bw_alloc` holds the previously configured reserved bandwidth blocks for an `RCID` and `AT` on successful completion of the `READ_LIMIT` operation.

Bandwidth is allocated in multiples of bandwidth blocks, and the value in `Rbwb`must be at least 1 and must not exceed `MRBWB` value. Otherwise, the `CONFIG_LIMIT`operation fails with `STATUS=5`. Additionally, the sum of `Rbwb` allocated across all `RCIDs` must not exceed `MRBWB` value, or the `CONFIG_LIMIT` operation fails with `STATUS=5`.

![Bandwidth Allocation Configuration Register (`bc_bw_alloc`)](_images/diag-61cb4dd05825edaa1f75b64ac51838378fed6b8a.svg) 

Figure 5\. Bandwidth Allocation Configuration Register (`bc_bw_alloc`)

The `Rbwb`, `Mweight`, `sharedAT`, and `useShared` are all WARL fields.

Bandwidth allocation is typically enforced by the bandwidth controller over finite accounting windows. The process involves measuring the bandwidth consumption over an accounting window and determining if an `RCID` is exceeding its bandwidth allocations for each access-types. The specifics of how the accounting window is implemented are `UNSPECIFIED`, but is expected to provide a statistically accurate control of the bandwidth usage over a few accounting intervals.

The `Rbwb` field represents the bandwidth that is made available to an `RCID` for requests that match `AT`, even when all other `RCID` are using their full allocation of bandwidth. The bandwidth allocation scales linearly with the number of bandwidth blocks programmed into `Rbwb`.

If there is non-reserved or unused bandwidth available in an accounting interval, `RCIDs` may compete for additional bandwidth. The non-reserved or unused bandwidth is proportionately shared among the competing `RCIDs` by using the configured `Mweight` parameter, which is a number between 0 and 255\. A larger weight implies a greater fraction of the bandwidth. A weight of 0 implies that the configured limit is a hard limit, and the use of unused or non-reserved bandwidth is not allowed.

Sharing of non-reserved bandwidth is not differentiated by access-type identifier. Therefore, the `Mweight` parameter must be programmed identically for all access-type identifiers. If this parameter is programmed differently for each access-type identifier, then the controller can use the parameter configured for any of the identifiers, but the behavior is otherwise well defined.

When the `Mweight` parameter is not set to 0, the amount of unused bandwidth allocated to `RCID=x` during contention with another `RCID` that is also permitted to use unused bandwidth is determined by dividing the `Mweight` of`RCID=x` by the sum of the `Mweight` of all other contending `RCIDs`. This ratio `P` is determined by [equation (2)](#eq-4).

| |  The bandwidth enforcement is typically work-conserving, allowing unused bandwidth to be used by requestors that are enabled to use it, even if they have consumed their Rbwb allotment. When contending for unused bandwidth, the weighted share is typically computed among the RCIDs that are actively generating requests in that accounting interval and have a non-zero weight programmed. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If unique bandwidth allocation is not required for an access-type identifier, then the`useShared` parameter can be set to 1 for a `CONFIG_LIMIT` operation. When`useShared` is set to 1, the `sharedAT` field specifies the access-type identifer with which the bandwidth allocation is shared by the access-type identifier in`bc_alloc_ctl.AT`. In this case, the `Rbwb` and `Mweight` fields are ignored, and the configurations of the access-type identifier in `sharedAT` are applied. If the access-type identifier specified by `sharedAT` does not have unique bandwidth allocation, meaning that it has not been configured with `useShared=0`, then the behavior is `UNSPECIFIED`.

The `useShared` and `sharedAT` fields are read-only zero if the bandwidth controller does not support bandwidth allocation per access-type identifier.

| |  When unique bandwidth allocation for an access-type identifier is not required, then one or more identifiers might be configured with a shared bandwidth allocation. For example, consider a bandwidth controller that supports 3 access-type identifers. The access-type identifier 0 and 1 of RCID 3 are configured with unique bandwidth allocations and the access-type identifier 2 is configured to share bandwidth allocation with identifier 1\. The example configuration is illustrated in the following table: Rbwb Mweight useShared sharedAT RCID=3, AT=0 100 16 0 N/A RCID=3, AT=1 50 16 0 N/A RCID=3, AT=2 N/A N/A 1 1 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
