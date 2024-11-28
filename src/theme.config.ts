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
    { label: 'Tags', href: '/tags' },
    // {
    //   label: 'Other pages',
    //   children: [
    //     { label: 'Landing page', href: '/' },
    //     { label: '404 page', href: '/404' },
    //     { label: 'Author: Patrick Piedad', href: '/authors/PatrickPiedad' },
    //     { label: 'Tag: posts', href: '/tags/posts' }
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
    }
  ],

  // optional settings
  locale: 'en',
  mode: 'dark',
  modeToggle: true,
  colorScheme: 'scheme-nord',
  openGraphImage: undefined,
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
