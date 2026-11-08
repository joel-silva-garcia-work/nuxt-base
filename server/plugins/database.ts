import { defineNitroPlugin } from 'nitropack/runtime'
import { closeDataSource } from '../composition/persistence'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', closeDataSource)
})
