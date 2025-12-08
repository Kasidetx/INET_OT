import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _efb10bc8 = () => interopDefault(import('../pages/login.vue' /* webpackChunkName: "pages/login" */))
const _5c66f12e = () => interopDefault(import('../pages/manageposition/index.vue' /* webpackChunkName: "pages/manageposition/index" */))
const _4bc26141 = () => interopDefault(import('../pages/overtime/index.vue' /* webpackChunkName: "pages/overtime/index" */))
const _e7f1bbf8 = () => interopDefault(import('../pages/overtimerequest/index.vue' /* webpackChunkName: "pages/overtimerequest/index" */))
const _2769f1d4 = () => interopDefault(import('../pages/timeattendance/index.vue' /* webpackChunkName: "pages/timeattendance/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/login",
    component: _efb10bc8,
    name: "login"
  }, {
    path: "/manageposition",
    component: _5c66f12e,
    name: "manageposition"
  }, {
    path: "/overtime",
    component: _4bc26141,
    name: "overtime"
  }, {
    path: "/overtimerequest",
    component: _e7f1bbf8,
    name: "overtimerequest"
  }, {
    path: "/timeattendance",
    component: _2769f1d4,
    name: "timeattendance"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
