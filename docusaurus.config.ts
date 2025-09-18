import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'RISC-V Developer Portal',
  tagline: 'RISC-V: The Open Standard ISA',
  favicon: 'img/favicon.ico',
  staticDirectories: ['antora/build/', 'static'],

  // Set the production url of your site here
  url: 'https://developer.riscv.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/antora.riscv.org/',
  //baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jjscheel', // Usually your GitHub org/user name.
  projectName: 'docs.riscv.org', // Usually your repo name.
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  customFields:{
    description: "Developer resources for the RISC-V ecosystem.",
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        debug:true,
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        googleTagManager: {
          containerId: 'GTM-NXLCGZF4',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      logo: {
        alt: 'RISC-V Logo',
        src: 'img/logo.svg',
        href: 'https://riscv.org',
      },
      items: [
        {to: '/', label: 'Home', position: 'left'},
        {
          label:'Specifications',
          position:'left',
          to:"/docs/spec/reference",
        },
        // {
        //   label:'Developers',
        //   position:'left',
        //   items:[
        //     {
        //       type: 'doc',
        //       docId: 'spec/reference',
        //       label: 'Specification Developers',
        //       // docsPluginId: 'tool1',
        //       to:"/docs/spec/reference",
        //     },
        //     {
        //       type: 'doc',
        //       docId: 'hardware/overview',
        //       label: 'Hardware Developers',
        //       // docsPluginId: 'tool1',
        //       to:"/docs/hardware/overview",
        //     },
        //     {
        //       type: 'doc',
        //       docId: 'software/overview',
        //       label: 'Software Developers',
        //       // docsPluginId: 'tool1',
        //       to:"/docs/software/overview",
        //     },
        //   ]
        // },
        // {
        //   label: 'Blog',
        //   to: '/blog',  
        //   position: 'left'
        // },
        {
          label: 'Events', 
          href: 'https://riscv.org/community/calendar/', 
          position: 'left'
        },
        // {
        //   type: 'search',
        //   position:'right',
        // },

      ],
    },
    docs:{
      sidebar:{
        hideable: true,
      },
    },
    announcementBar: {
      id: 'announcement-bar',
      backgroundColor: '#fdb515',
      isCloseable: true,
      content:'Congratulations, you found the RISC-V Developer Portal! 🎉 . This site is under active development and not meant for public consumption yet.',
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Specifications',
              href: '/docs/spec/reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              href: 'https://slack.riscv.org',
            },
            {
              label: 'YouTube',
              href: 'https://www.youtube.com/channel/UC5gLmcFuvdGbajs4VL-WU3g',
            },
            // {
            //   label: 'X',
            //   href: 'https://twitter.com/risc_v',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/riscv/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RISC-V International`,
    },

    // plugins: [
    //   [
    //     "@cmfcmf/docusaurus-search-local",
    //     {
    //       // Options here
    //       indexDocs: true,
    //       indexBlog: true,
    //       indexPages: true,

    //     },
    //   ],
    // ],
    // themes: [
    //   [
    //     require.resolve("@easyops-cn/docusaurus-search-local"),
    //     /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
    //     ({
    //       indexDocs: true,
    //       indexBlog: false,
    //       indexPages: true,
    //       docsRouteBasePath: ["knowledge", "contributing"],
    //       hashed: true,
    //       docsDir: ["docs", "contributing"],
    //       highlightSearchTermsOnTargetPage: true,
    //     }),
    //   ],
    // ],
    // algolia: {
    //   // The application ID provided by Algolia
    //   appId: 'MGVPU7BN22',

    //   // Public API key: it is safe to commit it
    //   apiKey: 'ef9c7ba70e519af1a95f10289726cd53',

    //   indexName: 'crawler_all',

    //   // Optional: see doc section below
    //   contextualSearch: false,

    //   // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
    //   externalUrlRegex: 'riscv\\.org|lf-riscv\\.atlassian\\.net',

    //   // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
    //   replaceSearchResultPathname: {
    //     from: '/docs/', // or as RegExp: /\/docs\//
    //     to: '/',
    //   },

    //   // Optional: Algolia search parameters
    //   searchParameters: {
    //     facetFilters:[],
    //     facets:[],
    //   },

    //   // Optional: path for search page that enabled by default (`false` to disable it)
    //   searchPagePath: 'search',

    //   // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
    //   insights: true,

    //   //... other Algolia params
    // },
    prism: {
      theme: prismThemes.github,
      // darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
