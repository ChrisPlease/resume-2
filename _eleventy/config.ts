import { Config } from '../types/eleventy'
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite'
import { create } from 'ts-node'
import { UserConfig } from 'vite'
import { daterange } from './shortcodes/daterange'
import { cssmin } from './filters/cssmin'

export default function (eleventyConfig: Config): Partial<Config> {
  eleventyConfig.addWatchTarget(__dirname)

  eleventyConfig.addExtension(['11ty.tsx', '11ty.ts'], {
    key: '11ty.js',
  })

  eleventyConfig.addDataExtension('ts', {
    parser: (fileContents: string, path: string) => {
      const compiler = create({
        files: true,
        swc: true,
        compilerOptions: {
          module: 'commonjs',
        },
      })

      const compiled = compiler.compile(fileContents, path)

      /* eslint-disable-next-line no-eval */
      return eval?.(`const exports = {}; ${compiled}`)
    },
  })

  eleventyConfig.addShortcode('daterange', daterange)

  eleventyConfig.addFilter('cssmin', cssmin)

  eleventyConfig.addCollection('resume', (collectionApi) => {
    return collectionApi.getFilteredByGlob(['src/content/collections/resume/**/*'])
      .sort(
        (a, b) => (a.data?.order ?? 1) - (b.data?.order ?? 0),
      )
  })

  eleventyConfig.addCollection('experience', (collectionApi) => {
    return collectionApi.getFilteredByGlob(['src/content/collections/experience/**/*'])
      .sort(
        (a, b) => ((a.data?.startDate?.getTime() ?? 1) - (b.data?.startDate?.getTime() ?? 0)),
      )
  })

  eleventyConfig.setServerPassthroughCopyBehavior('copy')
  eleventyConfig.addPassthroughCopy({
    'src/assets': 'assets',
    'public/': '/',
  })

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    serverOptions: {
      showAllHosts: true,
      domdiff: false,
    },
    viteOptions: <UserConfig>{
      clearScreen: false,
      server: {
        mode: 'development',
        middlewareMode: true,
      },
      optimizeDeps: {
        include: ['@fortawesome/fontawesome-pro'],
      },
      build: {
        assetsInlineLimit: 0,
        mode: 'production',
        rollupOptions: {
          external: ['@fortawesome/fontawesome-pro'],
          output: {
            manualChunks (id) {
              if (id.includes('fontawesome')) {
                return 'fonts'
              }
            },
            assetFileNames(chunkInfo) {
              const stringParts = chunkInfo.name?.split('.') || []
              let extType = stringParts.at(stringParts.length - 1) || ''

              if (/png|svg/i.test(extType)) {
                extType = 'img'
              }

              return `assets/${extType}/[name].[hash][extname]`
            },
            chunkFileNames: 'assets/scripts/[name].[hash].js',
            entryFileNames: 'assets/scripts/[name].[hash].js',
          },
        },
      },
    },
  })

  return {
    dir: {
      input: 'src/content',
      includes: '../_includes',
      layouts: '../_includes/layouts',
      output: 'dist',
    },
  }
}
