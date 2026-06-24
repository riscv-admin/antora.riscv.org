# 7.1. Software Guidelines

## [](#QOS%5FSW%5FGUIDE)7.1\. Software Guidelines

### [](#7-1-1-reporting-capacity-and-bandwidth-controllers)7.1.1\. Reporting Capacity and Bandwidth Controllers

The capability and bandwidth controllers that are present in the system should be reported to operating systems using methods such as ACPI and/or device tree. For each capacity and bandwidth controller, the following information should be reported using these methods:

* Type of controller (for example, cache, interconnect, memory, and so on)
* Location of the register programming interface for the controller
* Placement and topology describing the hart and IO bridges that share the resources controlled by the controller
* The number of QoS identifiers supported by the controller
* For memory bandwidth controllers, the controlled memory regions. These regions might be described in the form of NUMA domains or proximity domains.
* If a controller is part of a set of controllers that collectively control a shared resource such as memory bandwidth of a memory region, then information to identify all members of the set should be reported.
* Constraints imposed by the controllers, such as the minimum number of capacity or bandwidth blocks per RCID.

### [](#7-1-2-context-switching-qos-identifiers)7.1.2\. Context Switching QoS Identifiers

Typically, the contents of the `srmcfg` CSR are updated with a new `RCID`and/or `MCID` by the HS/S-mode scheduler if the `RCID` and/or `MCID` of the new workload (a process or a VM) is not same as that of the previous workload.

A context switch usually involves saving the context associated with the workload being switched away from and restoring the context of the workload being switched to. Such a context switch might be invoked in response to an explicit call from the workload (for example, as a function of an `ECALL` invocation) or can be done asynchronously (for example, in response to a timer interrupt). In such cases the scheduler might want to execute with the `srmcfg` configuration of the workload being switched away from such that this execution is attributed to the workload being switched away from and then prior to restoring the new workloads context, first switch to the `srmcfg` configuration appropriate for the workload being switched to such that all of that execution is attributed to the new workload. Further in this context switch process, if the scheduler intends some of its execution to be attributed to neither the outgoing workload nor the incoming workload, then the scheduler might switch to a new`srmcfg` configuration that is different from that of either of the workloads for the duration of such execution.

### [](#7-1-3-qos-configurations-for-virtual-machines)7.1.3\. QoS Configurations for Virtual Machines

Usually for virtual machines the resource allocations are configured by the hypervisor. Usually the Guest OS in a virtual machine does not participate in the QoS flows as the Guest OS does not know the physical capabilities of the platform or the resource allocations for other virtual machines in the system.

If a use case requires it, a hypervisor might virtualize the QoS capability to a VM by virtualizing the memory-mapped CBQRI register interface and virtualizing the virtual-instruction exception on access to `srmcfg` CSR by the Guest OS.

| |  If the use of directly selecting among a set of RCID and/or MCID by a VM becomes more prevalent and the overhead of virtualizing the srmcfg CSR using the virtual instruction exception is not acceptable then a future extension can be introduced where the RCID/MCID attempted to be written by VS mode are used as a selector for a set of RCID/MCID that the hypervisor configures in a set of HS mode CSRs. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#7-1-4-qos-identifiers-for-supervisor-and-machine-mode)7.1.4\. QoS Identifiers for Supervisor and Machine Mode

The `RCID` and `MCID` configured in `srmcfg` also apply to execution in S/HS-mode, but this is typically not an issue. Usually, S/HS-mode execution occurs to provide services, such as through an ABI, to software executing at lower privilege. Because the S/HS-mode invocation provides a service for the lower privilege mode, the S/HS-mode software might not opt to modify the`srmcfg` CSR.

Similarly, The `RCID` and `MCID` configured in `srmcfg` also apply to execution in M-mode, but this is typically not an issue either. Usually, M-mode execution occurs to provide services, such as through the SBI interface, to software executing at lower privilege. Because the M-mode invocation provides a service for the lower privilege mode, the M-mode software might not opt to modify the `srmcfg` CSR.

If separate `RCID` and/or `MCID` are needed during software execution in M/S/HS-mode, then the M/S/HS-mode software might update the `srmcfg` CSR and restore it before returning to lower privilege mode execution. The statistical nature of QoS capabilities means that the brief duration, such as the few instructions in the M/S/HS-mode trap handler entry point, during which the trap handler might execute with the `RCID` and/or `MCID` established for lower privilege mode operation might not have a significant statistical impact.
