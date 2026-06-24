# 2.1. Recipes

## [](#recipes)2.1\. Recipes

In this context, a recipe is a collection of firmware specification requirements that hardware, firmware, and software providers can implement to increase the likelihood that software written to the recipe will run predictably on all conforming devices.

The BRS specification defines two recipes: BRS-I (for "Interoperable") and BRS-B (for "Bespoke").

### [](#2-1-1-brs-i-recipe)2.1.1\. BRS-I Recipe

The BRS-I recipe aims to simplify end-user experiences, software compatibility and OS distribution, by defining a common specification for boot and runtime interfaces. BRS-I is expected to be used by general-purpose compute devices such as servers, desktops, laptops and other devices with industry expectations on silicon vendor, OS and software ecosystem interoperability. BRS-I enables operating system providers to build a single **generic** operating system image that can be**successfully booted** on compliant systems. **Generic** means not requiring system-specific customizations - only an implementation of BRS-I requirements. **Successfully boot** means basic system configuration, sufficient for detecting the need for system-specific drivers and loading such drivers.

It is understood that systems will deliver features beyond those covered by BRS-I. However, software written against a specific version of BRS-I must run, unaltered, without **anomalous and unexpected behavior** on systems that include such features and that are compliant to that specific version of BRS-I. Such behavior, caused by factors entirely unknown to a generic OS, is hard to diagnose and always results in a terrible user experience that negatively affects the value of the whole RISC-V standards-based ecosystem. **Anomalous and unexpected behavior** is taken to mean system instability and worst-case behavior for non-specialized workloads, but does not include suboptimal/unoptimized behavior or missing I/O or accelerator drivers. Any additional firmware features that cause anomalous and unexpected behavior must be disabled by default, and only enabled by opt-in. [See additional guidance](#recipe-brs-i-guidance).

__Table 1\. BRS-I Recipe Overview__
| Profile      | UEFI     | ACPI    | DT                | SBI     | SMBIOS    |
| ------------ | -------- | ------- | ----------------- | ------- | --------- |
| \>= RVA20S64 | \>= 2.10 | \>= 6.6 | optional, >= v0.3 | \>= 2.0 | \>= 3.7.0 |

### [](#2-1-2-brs-b-recipe)2.1.2\. BRS-B Recipe

BRS-B is intended for cases where only a minimal level of firmware interaction is mandated, focusing primarily on the boot process. The BRS-B recipe is the simpler of the two BRS recipes. It is expected to be used by software that is tailored to specific devices. Examples include many types of mobile devices, devices with real time response requirements, or embedded devices running rich operating systems with custom distributions.

__Table 2\. BRS-B Recipe Overview__
| Profile      | UEFI                                               | ACPI             | DT                | SBI     | SMBIOS             |
| ------------ | -------------------------------------------------- | ---------------- | ----------------- | ------- | ------------------ |
| \>= RVA20S64 | EBBR, >= 2.1.0 \[[5](bibliography.html#bib-ebbr)\] | optional, >= 6.6 | optional, >= v0.3 | \>= 2.0 | optional, >= 3.7.0 |

Either ACPI or DT may be used to describe hardware to the OS, but never both at the same time.
