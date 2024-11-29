import { defineThemeConfig } from './types'

export default defineThemeConfig({
  site: 'https://patrickpiedad.me',
  title: 'Pats Ecke',
  description: 'My minimalistic corner of the internet',
  author: 'Patrick Piedad',
  navbarItems: [
    { label: 'Blog', href: '/posts' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' },
    { label: 'Tags', href: '/tags' }
    // {
    //   label: 'Other Pages',
    //   children: [
    //     { label: 'Landing Page', href: '/' },
    //   ]
    // }
  ],
  footerItems: [
    {
      icon: 'tabler--brand-github',
      href: 'https://github.com/patrickpiedad',
      label: 'GitHub'
    },
    {
      icon: 'tabler--brand-linkedin',
      href: 'https://www.linkedin.com/in/patrick-piedad/',
      label: 'LinkedIn'
    },
    {
      icon: 'tabler--rss',
      href: '/feed.xml',
      label: 'RSS feed'
    }
  ],

  // optional settings
  locale: 'en',
  mode: 'dark',
  modeToggle: true,
  colorScheme: 'scheme-nord',
  openGraphImage: 'https://patrickpiedad.me/favicon.svg',
  postsPerPage: 5,
  projectsPerPage: 3,
  scrollProgress: false,
  scrollToTop: true,
  tagIcons: {
    tailwindcss: 'tabler--brand-tailwind',
    astro: 'tabler--brand-astro',
    documentation: 'tabler--book'
  },
  shikiThemes: {
    light: 'vitesse-light',
    dark: 'vitesse-black'
  }
})
