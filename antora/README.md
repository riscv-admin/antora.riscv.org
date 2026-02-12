# RISC-V Antora Playbook Files

This directory contains individual playbook files for each RISC-V specification content source, plus a master playbook that combines them all.

## File Structure

### Individual Playbooks (Content Sources Only)
Each of these files contains just the content source configuration for a single specification:

- `aia-playbook.yml` - Advanced Interrupt Architecture
- `iommu-playbook.yml` - IOMMU specification
- `plic-playbook.yml` - Platform-Level Interrupt Controller
- `server-soc-playbook.yml` - Server SoC specification
- `isa-manual-playbook.yml` - ISA Manual (multiple branches)
- `trace-spec-playbook.yml` - Trace specification
- `cbqri-playbook.yml` - Capacity & Bandwidth QoS
- `ras-eri-playbook.yml` - RAS Error Record Information
- `e-trace-encap-playbook.yml` - E-Trace Encapsulation
- `nexus-trace-playbook.yml` - Nexus Trace (ntrace, connectors, tci modules)
- `semihosting-playbook.yml` - Semihosting
- `brs-playbook.yml` - Boot and Runtime Services
- `acpi-rimt-playbook.yml` - ACPI RIMT
- `rpmi-playbook.yml` - RISC-V Platform Management Interface
- `sbi-doc-playbook.yml` - Supervisor Binary Interface
- `uefi-playbook.yml` - UEFI specification
- `elf-psabi-playbook.yml` - ELF psABI
- `rvv-intrinsic-playbook.yml` - RISC-V Vector Intrinsics

### Master Playbook
- `master-playbook.yml` - Complete playbook with all content sources and shared configuration

## Building the Complete Site

To build the entire RISC-V specification site with all content sources, use the master playbook:

```bash
antora master-playbook.yml
```

This single command will:
1. Fetch all content sources from their respective repositories
2. Apply all extensions (nav numbering, section numbering, copy files, include rewriter, etc.)
3. Generate the complete site with all specifications
4. Output to `./build/reference`

## Building Individual Specifications

If you want to build just one specification (useful for testing or development), you can use the individual playbooks. However, note that these only contain the content source configuration. You'll need to combine them with the necessary site, asciidoc, runtime, antora, and ui configuration.

Example of building a single spec (you would need to add the shared configuration):

```bash
# This won't work as-is because individual playbooks are incomplete
# antora aia-playbook.yml

# Instead, you could create a test playbook that includes the content source
# from an individual playbook plus all the shared configuration
```

## Recommended Workflow

1. **Development/Testing**: Use the master playbook for complete builds
2. **Production**: Use the master playbook with appropriate runtime.fetch settings
3. **Individual Testing**: If you need to test a single spec, copy the content source from the individual playbook into a complete playbook template

## Configuration Notes

- The master playbook includes all extensions and their configurations
- Kroki server is set to `http://localhost:9870` (for GitHub Actions)
- For local builds, you may want to change to `http://localhost:8000`
- All specifications use the `antora-refactor` branch except the ISA Manual which uses `v20250508` and `v20240411`

## Extensions Used

1. **@antora/lunr-extension** - Search functionality
2. **asam-antora_extension.js** - Bibliography support
3. **antora_copy_files_extension.js** - Copies files from ISA Manual submodules
4. **antora_include_rewriter.js** - Rewrites include paths for ISA Manual
5. **nav_numbering_extension.js** - Adds chapter/appendix numbering to navigation
6. **section_numbering_extension.js** - Adds chapter/appendix numbering to sections

## Build Output

The site is built to: `./build/reference`

The output includes:
- All specification HTML pages
- Search index
- UI bundle
- Static redirects to the ISA specification
