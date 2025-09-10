# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator. This site is deployed at https://developer.riscv.org/.

### Installation

Install Docusaurus 
```shell
yarn
```

Install / run antora
```shell
cd antora
npx antora --fetch antora-playbook.yml
```

### Local Development


To run the site with search run the following 2 commands:

```shell
npm run docusaurus build
npm run docusaurus serve
```

NOTE: if you do not do this and instead just use `npm start` then the search bards will not build. 



```shell
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
