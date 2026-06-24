# 3.1. Hart Requirements

## [](#hart)3.1\. Hart Requirements

A compliant system includes a RISC-V application processor and the requirements in this section apply solely to harts in the application processors of a system.

The BRS specification is minimally prescriptive on the RISC-V hart requirements. It is anticipated that detailed requirements will be driven by target market segment and product/solution requirements.

| ID#                                                                                                                                                                                                                                                                                                                                                                           | Rule                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| HR\_010                                                                                                                                                                                                                                                                                                                                                                       | The RISC-V application processor harts MUST be compliant to RVA20S64 profile \[[6](bibliography.html#bib-profile)\]. |
| _The BRS governs the interactions between 64-bit OS supervisor-mode software and 64-bit firmware. These are minimum requirements allowing for the wide variety of existing and future hart implementations to be supported. It is expected that operating systems and hypervisors may impose additional profile/ISA requirements, depending on the use-case and application._ |                                                                                                                      |
