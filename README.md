# Website

This website is built using Antora. This site is deployed via GitHub pages at https://riscv-admin.github.io/antora-dev.riscv.org/.

### Installation

Install / antora dependencies (Ubuntu)
```shell
sudo apt-get install ruby-full
gem install bundler
bundle install
npm install
```

### Local Development

To run the site with search run the following 2 commands:


### Build

Install / run antora
```shell
cd antora
npx antora --fetch antora-playbook.yml --stacktrace
```

This command generates static content into the `antora/build/` directory and can be served using any static contents hosting service.

URL behavior note:
- The playbook is configured for explicit version folders (for example, `/isa/v20260120/...`).
- Do not enable `urls.latest_version_segment` unless you intentionally want a symbolic latest path such as `/isa/current/...`.

### Deployment

This project deploys using GitHub pages for hosting.
