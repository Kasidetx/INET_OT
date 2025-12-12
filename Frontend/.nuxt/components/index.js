export { default as DialogReject } from '../../components/dialog/reject.vue'
export { default as DialogSuccess } from '../../components/dialog/success.vue'
export { default as OvertimeOvertimeconditiontabs } from '../../components/overtime/overtimeconditiontabs.vue'
export { default as OvertimeOvertimetypeform } from '../../components/overtime/overtimetypeform.vue'
export { default as TimeattendanceDialogOvertimeConfirm } from '../../components/timeattendance/DialogOvertimeConfirm.vue'
export { default as TimeattendanceDialogOvertimeForm } from '../../components/timeattendance/DialogOvertimeForm.vue'
export { default as TimeattendanceDialogOvertimeSuccess } from '../../components/timeattendance/DialogOvertimeSuccess.vue'
export { default as TemplateAvatarUpload } from '../../components/template/AvatarUpload.vue'
export { default as PositionDialogAddPosition } from '../../components/position/DialogAddPosition.vue'
export { default as PositionDialogAddPositionLevel } from '../../components/position/DialogAddPositionLevel.vue'
export { default as PositionDialogEditPosition } from '../../components/position/DialogEditPosition.vue'
export { default as PositionDialogEditPositionLevel } from '../../components/position/DialogEditPositionLevel.vue'
export { default as PositionSecPosition } from '../../components/position/SecPosition.vue'
export { default as PositionSecPositionLevel } from '../../components/position/SecPositionLevel.vue'

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
