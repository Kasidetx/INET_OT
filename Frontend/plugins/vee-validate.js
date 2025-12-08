import Vue from 'vue'
import {
  ValidationObserver,
  ValidationProvider,
  extend
} from 'vee-validate'
import { required, email, mobile, grade, min, max, thaiID, thaiOnly, englishOnly } from 'vee-validate/dist/rules';

// Add the required rule
extend('required', {
  ...required,
  message: 'กรุณากรอกข้อมูล'
});

extend('thaiOnly', {
  validate: value => /^[ก-๙\s]+$/.test(value),
  message: "กรุณากรอกเฉพาะภาษาไทย"
});

extend('grade', {
  validate: value => parseFloat(value) <= 4,
  message: "ข้อมูลไม่ถูกต้อง"
});

extend('englishOnly', {
  validate: value => /^[A-Za-z\s]+$/.test(value),
  message: "กรุณากรอกเฉพาะภาษาอังกฤษ"
});

// Add the email rule
extend('email', {
  ...email,
  message: 'รูปแบบอีเมลไม่ถูกต้อง'
});

extend('min', {
  ...min,
  message: 'ต้องมีความยาวอย่างน้อย {length} ตัวอักษร'
})

extend('max', {
  ...max,
  message: 'ต้องมีความยาวไม่เกิน {length} ตัวอักษร'
})

extend('mobile', {
  validate: (value) => {
    value = value.replace(/\s/g, '')
    return /^0[0-9]{8,9}$/.test(value);
  },
  message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง",
});

extend('thaiID', {
  validate (value) {
    value = value.replace(/\s/g, '')
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseFloat(value.charAt(i)) * (13 - i)
    }
    if ((11 - sum % 11) % 10 !== parseFloat(value.charAt(12))) { return 'เลขบัตรประชาชนไม่ถูกต้อง' }
    return true
  }
})

Vue.component('ValidationProvider', ValidationProvider)
Vue.component('ValidationObserver', ValidationObserver)