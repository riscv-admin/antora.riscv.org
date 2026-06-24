# 11.1. Performance Monitoring Unit Extension (EID #0x504D55 "PMU")

## [](#11-1-performance-monitoring-unit-extension-eid-0x504d55-pmu)11.1\. Performance Monitoring Unit Extension (EID #0x504D55 "PMU")

The RISC-V hardware performance counters such as `mcycle`, `minstret`, and`mhpmcounterX` CSRs are accessible as read-only from supervisor-mode using`cycle`, `instret`, and `hpmcounterX` CSRs. The SBI performance monitoring unit (PMU) extension is an interface for supervisor-mode to configure and use the RISC-V hardware performance counters with assistance from the machine-mode (or hypervisor-mode). These hardware performance counters can only be started, stopped, or configured from machine-mode using`mcountinhibit` and `mhpmeventX` CSRs. Due to this, a machine-mode SBI implementation may choose to disallow SBI PMU extension if `mcountinhibit`CSR is not implemented by the RISC-V platform.

A RISC-V platform generally supports monitoring of various hardware events using a limited number of hardware performance counters which are up to 64 bits wide. In addition, a SBI implementation can also provide firmware performance counters which can monitor firmware events such as number of misaligned load/store instructions, number of RFENCEs, number of IPIs, etc. All firmware counters must have same number of bits and can be up to 64 bits wide.

The SBI PMU extension provides:

1. An interface for supervisor-mode software to discover and configure per-hart hardware/firmware counters
2. A typical Linux perf cite:\[perf\_linux\] compatible interface for hardware/firmware performance counters and events
3. Full access to microarchitecture’s raw event encodings

To define SBI PMU extension calls, we first define important entities`counter_idx`, `event_idx`, and `event_data`. The `counter_idx` is a logical number assigned to each hardware/firmware counter. The `event_idx`represents a hardware (or firmware) event whereas the `event_data` is 64 bits wide and represents additional configuration (or parameters) for a hardware (or firmware) event.

The event\_idx is a 20 bits wide number encoded as follows:

```C
    event_idx[19:16] = type
    event_idx[15:0] = code
```

The below table describes the different types of events supported in this specification.

__Table 1\. PMU Event Type__
| Event ID Type | Value | Description                                                           |
| ------------- | ----- | --------------------------------------------------------------------- |
| Type #0       | 0     | Hardware general events                                               |
| Type #1       | 1     | Hardware Cache events                                                 |
| Type #2       | 2     | Hardware raw events (deprecated) Bits allowed for mhpmeventX \[0:47\] |
| Type #3       | 3     | Hardware raw events v2 Bits allowed for mhpmeventX \[0:55\]           |
| Type #15      | 15    | Firmware events                                                       |

### [](#11-1-1-event-hardware-general-events-type-0)11.1.1\. Event: Hardware general events (Type #0)

The `event_idx.type` (i.e. **event type**) should be `0x0` for all hardware general events and each hardware general event is identified by an unique`event_idx.code` (i.e. **event code**) described in the[Table 2](#table%5Fpmu%5Fhardware%5Fevents) below.

__Table 2\. PMU Hardware Events__
| General Event Name                      | Code | Description                                             |
| --------------------------------------- | ---- | ------------------------------------------------------- |
| SBI\_PMU\_HW\_NO\_EVENT                 | 0    | Unused event becauseevent\_idx cannot be zero           |
| SBI\_PMU\_HW\_CPU\_CYCLES               | 1    | Event for each CPU cycle                                |
| SBI\_PMU\_HW\_INSTRUCTIONS              | 2    | Event for each completed instruction                    |
| SBI\_PMU\_HW\_CACHE\_REFERENCES         | 3    | Event for cache hit                                     |
| SBI\_PMU\_HW\_CACHE\_MISSES             | 4    | Event for cache miss                                    |
| SBI\_PMU\_HW\_BRANCH\_INSTRUCTIONS      | 5    | Event for a branch instruction                          |
| SBI\_PMU\_HW\_BRANCH\_MISSES            | 6    | Event for a branch misprediction                        |
| SBI\_PMU\_HW\_BUS\_CYCLES               | 7    | Event for each BUS cycle                                |
| SBI\_PMU\_HW\_STALLED\_CYCLES\_FRONTEND | 8    | Event for a stalled cycle in microarchitecture frontend |
| SBI\_PMU\_HW\_STALLED\_CYCLES\_BACKEND  | 9    | Event for a stalled cycle in microarchitecture backend  |
| SBI\_PMU\_HW\_REF\_CPU\_CYCLES          | 10   | Event for each reference CPU cycle                      |

The `event_data` (i.e. **event data**) is unused for hardware general events and all non-zero values of `event_data` are reserved for future use.

| |  A RISC-V platform might halt the CPU clock when it enters WAIT state using the WFI instruction or enters platform specific SUSPEND state using the SBI HSM hart suspend call. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  The **SBI\_PMU\_HW\_CPU\_CYCLES** event counts CPU clock cycles as counted by the cycle CSR. These may be variable frequency cycles, and are not counted when the CPU clock is halted. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  The **SBI\_PMU\_HW\_REF\_CPU\_CYCLES** counts fixed-frequency clock cycles while the CPU clock is not halted. The fixed-frequency of counting might, for example, be the same frequency at which the time CSR counts. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| |  The **SBI\_PMU\_HW\_BUS\_CYCLES** counts fixed-frequency clock cycles. The fixed-frequency of counting might be the same frequency at which thetime CSR counts, or may be the frequency of the clock at the boundary between the hart (and it’s private caches) and the rest of the system. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#11-1-2-event-hardware-cache-events-type-1)11.1.2\. Event: Hardware cache events (Type #1)

The `event_idx.type` (i.e. **event type**) should be `0x1` for all hardware cache events and each hardware cache event is identified by an unique`event_idx.code` (i.e. **event code**) which is encoded as follows:

```C
    event_idx.code[15:3] = cache_id
    event_idx.code[2:1] = op_id
    event_idx.code[0:0] = result_id
```

Below tables show possible values of: `event_idx.code.cache_id` (i.e.**cache event id**), `event_idx.code.op_id` (i.e. **cache operation id**) and `event_idx.code.result_id` (i.e. **cache result id**).

__Table 3\. PMU Cache Event ID__
| Cache Event Name          | Event ID | Description                    |
| ------------------------- | -------- | ------------------------------ |
| SBI\_PMU\_HW\_CACHE\_L1D  | 0        | Level1 data cache event        |
| SBI\_PMU\_HW\_CACHE\_L1I  | 1        | Level1 instruction cache event |
| SBI\_PMU\_HW\_CACHE\_LL   | 2        | Last level cache event         |
| SBI\_PMU\_HW\_CACHE\_DTLB | 3        | Data TLB event                 |
| SBI\_PMU\_HW\_CACHE\_ITLB | 4        | Instruction TLB event          |
| SBI\_PMU\_HW\_CACHE\_BPU  | 5        | Branch predictor unit event    |
| SBI\_PMU\_HW\_CACHE\_NODE | 6        | NUMA node cache event          |

__Table 4\. PMU Cache Operation ID__
| Cache Operation Name              | Operation ID | Description         |
| --------------------------------- | ------------ | ------------------- |
| SBI\_PMU\_HW\_CACHE\_OP\_READ     | 0            | Read cache line     |
| SBI\_PMU\_HW\_CACHE\_OP\_WRITE    | 1            | Write cache line    |
| SBI\_PMU\_HW\_CACHE\_OP\_PREFETCH | 2            | Prefetch cache line |

__Table 5\. PMU Cache Operation Result ID__
| Cache Result Name                   | Result ID | Description  |
| ----------------------------------- | --------- | ------------ |
| SBI\_PMU\_HW\_CACHE\_RESULT\_ACCESS | 0         | Cache access |
| SBI\_PMU\_HW\_CACHE\_RESULT\_MISS   | 1         | Cache miss   |

The `event_data` (i.e. **event data**) is unused for hardware cache events and all non-zero values of `event_data` are reserved for future use.

### [](#11-1-3-event-hardware-raw-events-type-2)11.1.3\. Event: Hardware raw events (Type #2)

The `event_idx.type` (i.e. **event type**) should be `0x2` for all hardware raw events and `event_idx.code` (i.e. **event code**) should be zero.

On RISC-V platforms with 32 bits wide `mhpmeventX` CSRs, the `event_data`configuration (or parameter) should have the 32-bit value to to be programmed in the `mhpmeventX` CSR.

On RISC-V platforms with 64 bits wide `mhpmeventX` CSRs, the `event_data`configuration (or parameter) should have the 48-bit value to be programmed in the lower 48-bits of `mhpmeventX` CSR and the SBI implementation shall determine the value to be programmed in the upper 16 bits of `mhpmeventX`CSR.

| |  This event type is deprecated in favor of raw events v2. |
| ----------------------------------------------------------- |

### [](#11-1-4-event-hardware-raw-events-v2-type-3)11.1.4\. Event: Hardware raw events v2 (Type #3)

The `event_idx.type` (i.e. **event type**) should be `0x3` for all hardware raw events and `event_idx.code` (i.e. **event code**) should be zero.

On RISC-V platforms with 32 bits wide `mhpmeventX` CSRs, the `event_data`configuration (or parameter) should have the 32-bit value to to be programmed in the `mhpmeventX` CSR.

On RISC-V platforms with 64 bits wide `mhpmeventX` CSRs, the `event_data`configuration (or parameter) should have the 56-bit value be programmed in the lower 56-bits of `mhpmeventX` CSR and the SBI implementation shall determine the value to be programmed in the upper 8 bits of `mhpmeventX`CSR based on privilege specification definition.

| |  The RISC-V platform hardware implementation may choose to define the expected value to be written to mhpmeventX CSR for a hardware event. In case of hardware general/cache events, the RISC-V platform hardware implementation may use the zero-extended event\_idx as the expected value for simplicity. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#11-1-5-event-firmware-events-type-15)11.1.5\. Event: Firmware events (Type #15)

The `event_idx.type` (i.e. **event type**) should be `0xf` for all firmware events and each firmware event is identified by an unique `event_idx.code`(i.e. **event code**) described in the [Table 6](#table%5Fpmu%5Ffirmware%5Fevents) below.

__Table 6\. PMU Firmware Events__
| Firmware Event Name                        | Code        | Description                                                                                                              |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| SBI\_PMU\_FW\_MISALIGNED\_LOAD             | 0           | Misaligned load trap event                                                                                               |
| SBI\_PMU\_FW\_MISALIGNED\_STORE            | 1           | Misaligned store trap event                                                                                              |
| SBI\_PMU\_FW\_ACCESS\_LOAD                 | 2           | Load access trap event                                                                                                   |
| SBI\_PMU\_FW\_ACCESS\_STORE                | 3           | Store access trap event                                                                                                  |
| SBI\_PMU\_FW\_ILLEGAL\_INSN                | 4           | Illegal instruction trap event                                                                                           |
| SBI\_PMU\_FW\_SET\_TIMER                   | 5           | Set timer event                                                                                                          |
| SBI\_PMU\_FW\_IPI\_SENT                    | 6           | Sent IPI to other hart event                                                                                             |
| SBI\_PMU\_FW\_IPI\_RECEIVED                | 7           | Received IPI from other hart event                                                                                       |
| SBI\_PMU\_FW\_FENCE\_I\_SENT               | 8           | Sent FENCE.I request to other hart event                                                                                 |
| SBI\_PMU\_FW\_FENCE\_I\_RECEIVED           | 9           | Received FENCE.I request from other hart event                                                                           |
| SBI\_PMU\_FW\_SFENCE\_VMA\_SENT            | 10          | Sent SFENCE.VMA request to other hart event                                                                              |
| SBI\_PMU\_FW\_SFENCE\_VMA\_RECEIVED        | 11          | Received SFENCE.VMA request from other hart event                                                                        |
| SBI\_PMU\_FW\_SFENCE\_VMA\_ASID\_SENT      | 12          | Sent SFENCE.VMA with ASID request to other hart event                                                                    |
| SBI\_PMU\_FW\_SFENCE\_VMA\_ASID\_RECEIVED  | 13          | Received SFENCE.VMA with ASID request from other hart event                                                              |
| SBI\_PMU\_FW\_HFENCE\_GVMA\_SENT           | 14          | Sent HFENCE.GVMA request to other hart event                                                                             |
| SBI\_PMU\_FW\_HFENCE\_GVMA\_RECEIVED       | 15          | Received HFENCE.GVMA request from other hart event                                                                       |
| SBI\_PMU\_FW\_HFENCE\_GVMA\_VMID\_SENT     | 16          | Sent HFENCE.GVMA with VMID request to other hart event                                                                   |
| SBI\_PMU\_FW\_HFENCE\_GVMA\_VMID\_RECEIVED | 17          | Received HFENCE.GVMA with VMID request from other hart event                                                             |
| SBI\_PMU\_FW\_HFENCE\_VVMA\_SENT           | 18          | Sent HFENCE.VVMA request to other hart event                                                                             |
| SBI\_PMU\_FW\_HFENCE\_VVMA\_RECEIVED       | 19          | Received HFENCE.VVMA request from other hart event                                                                       |
| SBI\_PMU\_FW\_HFENCE\_VVMA\_ASID\_SENT     | 20          | Sent HFENCE.VVMA with ASID request to other hart event                                                                   |
| SBI\_PMU\_FW\_HFENCE\_VVMA\_ASID\_RECEIVED | 21          | Received HFENCE.VVMA with ASID request from other hart event                                                             |
| Reserved                                   | 22 - 255    | Reserved for future use                                                                                                  |
| Implementation specific events             | 256 - 65534 | SBI implementation specific firmware events                                                                              |
| SBI\_PMU\_FW\_PLATFORM                     | 65535       | RISC-V platform specific firmware events, where theevent\_data configuration (or parameter) contains the event encoding. |

For all firmware events except SBI\_PMU\_FW\_PLATFORM, the `event_data`configuration (or parameter) is unused and all non-zero values of`event_data` are reserved for future use.

### [](#11-1-6-function-get-number-of-counters-fid-0)11.1.6\. Function: Get number of counters (FID #0)

```C
struct sbiret sbi_pmu_num_counters()
```

**Returns** the number of counters (both hardware and firmware) in`sbiret.value` and always returns `SBI_SUCCESS` in sbiret.error.

### [](#11-1-7-function-get-details-of-a-counter-fid-1)11.1.7\. Function: Get details of a counter (FID #1)

```C
struct sbiret sbi_pmu_counter_get_info(unsigned long counter_idx)
```

Get details about the specified counter such as underlying CSR number, width of the counter, type of counter hardware/firmware, etc.

The `counter_info` returned by this SBI call is encoded as follows:

```C
    counter_info[11:0] = CSR (12bit CSR number)
    counter_info[17:12] = Width (One less than number of bits in CSR)
    counter_info[XLEN-2:18] = Reserved for future use
    counter_info[XLEN-1] = Type (0 = hardware and 1 = firmware)
```

If `counter_info.type == 1` then `counter_info.csr` and `counter_info.width`should be ignored.

**Returns** the `counter_info` described above in `sbiret.value`.

The possible error codes returned in `sbiret.error` are shown in the[Table 7](#table%5Fpmu%5Fcounter%5Fget%5Finfo%5Ferrors) below.

__Table 7\. PMU Counter Get Info Errors__
| Error code               | Description                                |
| ------------------------ | ------------------------------------------ |
| SBI\_SUCCESS             | counter\_info read successfully.           |
| SBI\_ERR\_INVALID\_PARAM | counter\_idx points to an invalid counter. |

### [](#11-1-8-function-find-and-configure-a-matching-counter-fid-2)11.1.8\. Function: Find and configure a matching counter (FID #2)

```C
struct sbiret sbi_pmu_counter_config_matching(unsigned long counter_idx_base,
                                              unsigned long counter_idx_mask,
                                              unsigned long config_flags,
                                              unsigned long event_idx,
                                              uint64_t event_data)
```

Find and configure a counter from a set of counters which is not started (or enabled) and can monitor the specified event. The `counter_idx_base`and `counter_idx_mask` parameters represent the set of counters whereas`event_idx` represents the event to be monitored and `event_data`represents any additional event configuration.

The `config_flags` parameter represents additional counter configuration and filter flags. The bit definitions of the `config_flags` parameter are shown in the [Table 8](#table%5Fpmu%5Fcounter%5Fcfg%5Fmatch%5Fflags) below.

__Table 8\. PMU Counter Config Match Flags__
| Flag Name                         | Bits       | Description                                                |
| --------------------------------- | ---------- | ---------------------------------------------------------- |
| SBI\_PMU\_CFG\_FLAG\_SKIP\_MATCH  | 0:0        | Skip the counter matching                                  |
| SBI\_PMU\_CFG\_FLAG\_CLEAR\_VALUE | 1:1        | Clear (or zero) the counter value in counter configuration |
| SBI\_PMU\_CFG\_FLAG\_AUTO\_START  | 2:2        | Start the counter after configuring a matching counter     |
| SBI\_PMU\_CFG\_FLAG\_SET\_VUINH   | 3:3        | Event counting inhibited in VU-mode                        |
| SBI\_PMU\_CFG\_FLAG\_SET\_VSINH   | 4:4        | Event counting inhibited in VS-mode                        |
| SBI\_PMU\_CFG\_FLAG\_SET\_UINH    | 5:5        | Event counting inhibited in U-mode                         |
| SBI\_PMU\_CFG\_FLAG\_SET\_SINH    | 6:6        | Event counting inhibited in S-mode                         |
| SBI\_PMU\_CFG\_FLAG\_SET\_MINH    | 7:7        | Event counting inhibited in M-mode                         |
| **RESERVED**                      | 8:(XLEN-1) | Reserved for future use and must be zero.                  |

| |  When **SBI\_PMU\_CFG\_FLAG\_SKIP\_MATCH** is set in config\_flags, the SBI implementation will unconditionally select the first counter from the set of counters specified by the counter\_idx\_base and counter\_idx\_mask. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  The **SBI\_PMU\_CFG\_FLAG\_AUTO\_START** flag in config\_flags has no impact on the counter value. |
| ----------------------------------------------------------------------------------------------------- |

| |  The config\_flags\[3:7\] bits are event filtering hints so these can be ignored or overridden by the SBI implementation for security concerns or due to lack of event filtering support in the underlying RISC-V platform. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Returns** the `counter_idx` in `sbiret.value` upon success.

In case of failure, the possible error codes returned in `sbiret.error` are shown in the [Table 9](#table%5Fpmu%5Fcounter%5Fcfg%5Fmatch%5Ferrors) below.

__Table 9\. PMU Counter Config Match Errors__
| Error code               | Description                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | counter found and configured successfully.                                                           |
| SBI\_ERR\_INVALID\_PARAM | set of counters has at least one invalid counter or the given flag parameter has a reserved bit set. |
| SBI\_ERR\_NOT\_SUPPORTED | none of the counters can monitor the specified event.                                                |

### [](#11-1-9-function-start-a-set-of-counters-fid-3)11.1.9\. Function: Start a set of counters (FID #3)

```C
struct sbiret sbi_pmu_counter_start(unsigned long counter_idx_base,
                                    unsigned long counter_idx_mask,
                                    unsigned long start_flags,
                                    uint64_t initial_value)
```

Start or enable a set of counters on the calling hart with the specified initial value. The `counter_idx_base` and `counter_idx_mask` parameters represent the set of counters whereas the `initial_value` parameter specifies the initial value of the counter.

The bit definitions of the `start_flags` parameter are shown in the[Table 10](#table%5Fpmu%5Fcounter%5Fstart%5Fflags) below.

__Table 10\. PMU Counter Start Flags__
| Flag Name                             | Bits       | Description                                                     |
| ------------------------------------- | ---------- | --------------------------------------------------------------- |
| SBI\_PMU\_START\_SET\_INIT\_VALUE     | 0:0        | Set the value of counters based on the initial\_value parameter |
| SBI\_PMU\_START\_FLAG\_INIT\_SNAPSHOT | 1:1        | Initialize the given counters from shared memory if available.  |
| **RESERVED**                          | 2:(XLEN-1) | Reserved for future use and must be zero.                       |

| |  When SBI\_PMU\_START\_SET\_INIT\_VALUE or SBI\_PMU\_START\_FLAG\_INIT\_SNAPSHOTis not set in start\_flags, the counter value will not be modified and the event counting will start from the current counter value. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The shared memory address must be set during boot via`sbi_pmu_snapshot_set_shmem` before the `SBI_PMU_START_FLAG_INIT_SNAPSHOT`flag may be used. The SBI implementation must initialize all the given valid counters (to be started) from the value set in the shared snapshot memory.

| |  SBI\_PMU\_START\_SET\_INIT\_VALUE and SBI\_PMU\_START\_FLAG\_INIT\_SNAPSHOT are mutually exclusive as the former is only valid for a single counter. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- |

The possible error codes returned in `sbiret.error` are shown in the[Table 11](#table%5Fpmu%5Fcounter%5Fstart%5Ferrors) below.

__Table 11\. PMU Counter Start Errors__
| Error code                 | Description                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | counter started successfully.                                                                             |
| SBI\_ERR\_INVALID\_PARAM   | set of counters has at least one invalid counter or the given flag parameter has a reserved bit set.      |
| SBI\_ERR\_ALREADY\_STARTED | set of counters includes at least one counter which is already started.                                   |
| SBI\_ERR\_NO\_SHMEM        | the snapshot shared memory is not available andSBI\_PMU\_START\_FLAG\_INIT\_SNAPSHOT is set in the flags. |

### [](#11-1-10-function-stop-a-set-of-counters-fid-4)11.1.10\. Function: Stop a set of counters (FID #4)

```C
struct sbiret sbi_pmu_counter_stop(unsigned long counter_idx_base,
                                   unsigned long counter_idx_mask,
                                   unsigned long stop_flags)
```

Stop or disable a set of counters on the calling hart. The `counter_idx_base`and `counter_idx_mask` parameters represent the set of counters. The bit definitions of the `stop_flags` parameter are shown in the[Table 12](#table%5Fpmu%5Fcounter%5Fstop%5Fflags) below.

__Table 12\. PMU Counter Stop Flags__
| Flag Name                            | Bits       | Description                                                                      |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------- |
| SBI\_PMU\_STOP\_FLAG\_RESET          | 0:0        | Reset the counter to event mapping.                                              |
| SBI\_PMU\_STOP\_FLAG\_TAKE\_SNAPSHOT | 1:1        | Save a snapshot of the given counter’s values in the shared memory if available. |
| **RESERVED**                         | 2:(XLEN-1) | Reserved for future use and must be zero.                                        |

The shared memory address must be set during boot via`sbi_pmu_snapshot_set_shmem` before the `SBI_PMU_STOP_FLAG_TAKE_SNAPSHOT` flag may be used. The SBI implementation must save the current value of all the stopped counters in the shared memory if `SBI_PMU_STOP_FLAG_TAKE_SNAPSHOT` is set. The values corresponding to all other counters must not be modified. The SBI implementation must additionally update the overflown counter bitmap in the shared memory.

The possible error codes returned in `sbiret.error` are shown in the[Table 13](#table%5Fpmu%5Fcounter%5Fstop%5Ferrors) below.

__Table 13\. PMU Counter Stop Errors__
| Error code                 | Description                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | counter stopped successfully.                                                                            |
| SBI\_ERR\_INVALID\_PARAM   | set of counters has at least one invalid counter or the given flag parameter has a reserved bit set.     |
| SBI\_ERR\_ALREADY\_STOPPED | set of counters includes at least one counter which is already stopped.                                  |
| SBI\_ERR\_NO\_SHMEM        | the snapshot shared memory is not available andSBI\_PMU\_STOP\_FLAG\_TAKE\_SNAPSHOT is set in the flags. |

### [](#11-1-11-function-read-a-firmware-counter-fid-5)11.1.11\. Function: Read a firmware counter (FID #5)

```C
struct sbiret sbi_pmu_counter_fw_read(unsigned long counter_idx)
```

Provide the current firmware counter value in `sbiret.value`. On RV32 systems, the `sbiret.value` will only contain the lower 32 bits of the current firmware counter value.

The possible error codes returned in `sbiret.error` are shown in the[Table 14](#table%5Fpmu%5Fcounter%5Ffw%5Fread%5Ferrors) below.

__Table 14\. PMU Counter Firmware Read Errors__
| Error code               | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| SBI\_SUCCESS             | firmware counter read successfully.                              |
| SBI\_ERR\_INVALID\_PARAM | counter\_idx points to a hardware counter or an invalid counter. |

### [](#11-1-12-function-read-a-firmware-counter-high-bits-fid-6)11.1.12\. Function: Read a firmware counter high bits (FID #6)

```C
struct sbiret sbi_pmu_counter_fw_read_hi(unsigned long counter_idx)
```

Provide the upper 32 bits of the current firmware counter value in`sbiret.value`. This function always returns zero in `sbiret.value`for RV64 (or higher) systems.

The possible error codes returned in `sbiret.error` are shown in[Table 15](#table%5Fpmu%5Fcounter%5Ffw%5Fread%5Fhi%5Ferrors) below.

__Table 15\. PMU Counter Firmware Read High Errors__
| Error code               | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| SBI\_SUCCESS             | Firmware counter read successfully.                              |
| SBI\_ERR\_INVALID\_PARAM | counter\_idx points to a hardware counter or an invalid counter. |

### [](#11-1-13-function-set-pmu-snapshot-shared-memory-fid-7)11.1.13\. Function: Set PMU snapshot shared memory (FID #7)

```C
struct sbiret sbi_pmu_snapshot_set_shmem(unsigned long shmem_phys_lo,
                                         unsigned long shmem_phys_hi,
                                         unsigned long flags)
```

Set and enable the PMU snapshot shared memory on the calling hart.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are not all-ones bitwise then `shmem_phys_lo` specifies the lower XLEN bits and `shmem_phys_hi`specifies the upper XLEN bits of the snapshot shared memory physical base address. The `shmem_phys_lo` MUST be 4096 bytes (i.e. page) aligned and the size of the snapshot shared memory must be 4096 bytes. The layout of the snapshot shared memory is described in [Table 16](#table%5Fsnapshot%5Fshmem%5Flayout).

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are all-ones bitwise then the PMU snapshot shared memory is cleared and disabled.

The `flags` parameter is reserved for future use and must be zero.

This is an optional function and the SBI implementation may choose not to implement it.

__Table 16\. SBI PMU Snapshot shared memory layout__
| Name                      | Offset | Size | Description                                                                                                                                                              |
| ------------------------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| counter\_overflow\_bitmap | 0x0000 | 8    | A bitmap of all logical overflown counters relative to thecounter\_idx\_base. This is valid only if the Sscofpmf ISA extension is available. Otherwise, it must be zero. |
| counter\_values           | 0x0008 | 512  | An array of 64-bit logical counters where each index represents the value of each logical counter associated with hardware/firmware relative to thecounter\_idx\_base.   |
| Reserved                  | 0x0208 | 3576 | Reserved for future use                                                                                                                                                  |

Any future revisions to this structure should be made in a backward compatible manner and will be associated with an SBI version.

The logical counter indices in the `counter_overflow_bitmap` and `counter_values`array are relative w.r.t to `counter_idx_base` argument present in the`sbi_pmu_counter_stop` and `sbi_pmu_counter_start` functions. This allows the users to use snapshot feature for more than XLEN counters if required.

This function should be invoked only once per hart at boot time. Once configured, the SBI implementation has read/write access to the shared memory when `sbi_pmu_counter_stop` is invoked with the`SBI_PMU_STOP_FLAG_TAKE_SNAPSHOT` flag set. The SBI implementation has read only access when `sbi_pmu_counter_start` is invoked with the`SBI_PMU_START_FLAG_INIT_SNAPSHOT` flag set. The SBI implementation must not access this memory any other time.

The possible error codes returned in `sbiret.error` are shown in[Table 17](#table%5Fpmu%5Fsnapshot%5Fset%5Fshmem%5Ferrors) below.

__Table 17\. PMU Setup Snapshot Area Errors__
| Error code                 | Description                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | Shared memory was set or cleared successfully.                                                                                                                                                                                                                         |
| SBI\_ERR\_NOT\_SUPPORTED   | The SBI PMU snapshot functionality is not available in the SBI implementation.                                                                                                                                                                                         |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter is not zero or theshmem\_phys\_lo parameter is not 4096 bytes aligned.                                                                                                                                                                             |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hi parameters is not writable or does not satisfy other requirements of[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                                                                                           |

### [](#11-1-14-function-get-pmu-event-info-fid-8)11.1.14\. Function: Get PMU Event info (FID #8)

```C
struct sbiret sbi_pmu_event_get_info(unsigned long shmem_phys_lo,
                                     unsigned long shmem_phys_hi,
                                     unsigned long num_entries,
                                     unsigned long flags)
```

Get details about any PMU event via shared memory. The supervisor software can get event specific information for multiple events in one shot by writing an entry for each event in the shared memory. Each entry in the shared memory must be encoded as follows:

__Table 18\. Event info entry format__
| Word | Name        | ACCESS(SBI Implementation) | Encoding                                                                                                                                                                                                                                                                   |
| ---- | ----------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | event\_idx  | RO                         | BIT\[0:19\] - Describes the event\_idx BIT\[20:31\] - Reserved for the future purpose. Must be zero.                                                                                                                                                                       |
| 1    | output      | RW                         | BIT\[0\] - Boolean value to indicate event\_idx is supported or not. The SBI implementation MUST update this entire 32-bit word if validevent\_idx and event\_data (if applicable) are specified in the entry. BIT\[1:31\] - Reserved for the future purpose. Must be zero |
| 2-3  | event\_data | RO                         | BIT\[0:63\] - Valid when event\_idx.type is either 0x2, 0x3 or 0xf. It describes theevent\_data for the specific event specified inevent\_idx if applicable.                                                                                                               |

The caller must initialize the shared memory and add `num_entries` of each event for which it wishes to discover information about. The `shmem_phys_lo` MUST be 16-byte aligned and the size of the share memory must be (16 \* `num_entries`) bytes.

The `flags` parameter is reserved for future use and MUST be zero.

The SBI implementation MUST NOT touch the shared memory once this call returns as supervisor software may free the memory at any time.

The possible error codes returned in `sbiret.error` are shown in[Table 19](#table%5Fpmu%5Fevent%5Fget%5Finfo%5Ferrors) below.

__Table 19\. PMU Get Event Info Errors__
| Error code                 | Description                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | The output field is updated for each event.                                                                                                                                                                                                                            |
| SBI\_ERR\_NOT\_SUPPORTED   | The SBI PMU event info retrieval function is not available in the SBI implementation.                                                                                                                                                                                  |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter is not zero or theshmem\_phys\_lo parameter is not 16-bytes aligned or any reserved bit in an event\_idx word is set.                                                                                                                              |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hi parameters is not writable or does not satisfy other requirements of[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | The write failed for unspecified or unknown other reasons.                                                                                                                                                                                                             |

### [](#11-1-15-function-listing)11.1.15\. Function Listing

__Table 20\. PMU Function List__
| Function Name                       | SBI Version | FID | EID      |
| ----------------------------------- | ----------- | --- | -------- |
| sbi\_pmu\_num\_counters             | 0.3         | 0   | 0x504D55 |
| sbi\_pmu\_counter\_get\_info        | 0.3         | 1   | 0x504D55 |
| sbi\_pmu\_counter\_config\_matching | 0.3         | 2   | 0x504D55 |
| sbi\_pmu\_counter\_start            | 0.3         | 3   | 0x504D55 |
| sbi\_pmu\_counter\_stop             | 0.3         | 4   | 0x504D55 |
| sbi\_pmu\_counter\_fw\_read         | 0.3         | 5   | 0x504D55 |
| sbi\_pmu\_counter\_fw\_read\_hi     | 2.0         | 6   | 0x504D55 |
| sbi\_pmu\_snapshot\_set\_shmem      | 2.0         | 7   | 0x504D55 |
| sbi\_pmu\_event\_get\_info          | 3.0         | 8   | 0x504D55 |
