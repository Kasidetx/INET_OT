import colors from 'vuetify/es5/util/colors'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - RA-Frontend',
    title: 'RA-Frontend',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@100;200;300;400;500;600;700&display=swap' },
    ],
  },

  env: {
    EMP_ID: process.env.EMP_ID,
    HEAD_ID: process.env.HEAD_ID,
    HR_ID: process.env.HR_ID
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/vee-validate.js' },
    { src: '~/plugins/formatter-datetime.js' }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
  ],

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    treeShake: true,
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        },
        light: {
          primary: '#0863B6',
          secondary: '#E6EFF8',
          wait: '#E9A016',
          secWait: '#FDF6E8',
          approve: '#58A144',
          secApprove: '#EEF6EC',
          // accent: '#EDAFB8',
          reject: '#D1392B',
          secReject: '#FAEBEA',
          cancel: '#636363',
          secCancel: '#F2F2F2',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          thisYear: '#026191',
          nextYear: '#FF4874',
          totalColor: '#E0E0E0'
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: ['vee-validate/dist/rules'],
    extend (config, ctx) {
      config.module.rules.push({
        test: /\.pdf$/,
        loader: 'file-loader',
        options: {
          name: 'assets/files/[name].[hash:7].[ext]',
          // publicPath: '/timestamp/_nuxt/',
          esModule: false
        }
      })
    }
  }
}
