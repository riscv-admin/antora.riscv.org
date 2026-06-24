# 6.1. Hardware Guidelines

## [](#QOS%5FHW%5FGUIDE)6.1\. Hardware Guidelines

### [](#QOS%5FSIZING)6.1.1\. Sizing QoS Identifiers

In a typical implementation, the number of `RCID` bits implemented (for example, to support 10s of `RCIDs`) might be smaller than the number of `MCID` bits implemented (for example, to support 100s of `MCIDs`).

It is a typical usage to associate a group of applications/VMs with a common`RCID` and thus sharing a common pool of resource allocations. The resource allocations for the `RCID` is established to meet the SLA objectives of all members of the group. If SLA objectives of one or more members of the group stop being met, the resource usage of one or more members of the group might be monitored by associating them with a unique `MCID` and this iterative analysis process used to determine the optimal strategy - increasing resources allocated to the `RCID`, moving some members to a different `RCID`, migrating some members away to another machine, and so on - for restoring the SLA. Having a sufficiently large pool of `MCID` speeds up this analysis.

| |  To maximize flexibility in the allocation of QoS IDs to workloads, it is recommended that all resource controllers in the system support an identical number of RCID and MCID, as well as a uniform mode of operation — either direct or RCID-prefixed — for determining the effective MCID. Uniformity ensures that software is not constrained by the lowest common denominator of ID support when requests are processed by multiple controllers, such as caches, fabrics, and memory controllers. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#6-1-2-sizing-monitoring-counters)6.1.2\. Sizing Monitoring Counters

Typically software samples the monitoring counters periodically to monitor capacity and bandwidth usage. The width of the monitoring counters is recommended to be wide enough to not cause more than one overflow per sample when sampled at a frequency of 1 Hz.
