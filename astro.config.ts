import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import codeHeadersPlugin from './src/plugins/codeHeadersPlugin'
import readingTimePlugin from './src/plugins/readingTimePlugin'
import config from './src/theme.config'

import netlify from '@astrojs/netlify'

import react from '@astrojs/react'

export default defineConfig({
  site: config.site,
  integrations: [tailwind(), mdx(), sitemap(), react()],

  markdown: {
    shikiConfig: {
      themes: config.shikiThemes,
      wrap: true,
      transformers: [codeHeadersPlugin]
    },
    remarkPlugins: [readingTimePlugin]
  },

  output: 'static',
  adapter: netlify({
    edgeMiddleware: true
  })
})
