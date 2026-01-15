<template>
  <v-card class="rounded-xl pa-4">
    <v-card-title class="font-weight-bold">
      <v-icon left color="primary">mdi-plus-circle</v-icon>
      เพิ่มข้อมูลประเภทการจ้าง
    </v-card-title>

    <v-divider class="mb-4" />

    <v-card-text>
      <v-row>
        <!-- ประเภทพนักงาน -->

        <v-col cols="12">
          <label class="field-label">ชื่อการตั้งค่า*</label>
          <v-text-field v-model="form.name" placeholder="เช่น โอทีพนักงานรายวัน (จ-ศ)" outlined dense />
        </v-col>

        <v-col cols="12">
          <label class="field-label">ประเภทพนักงาน*</label>
          <v-text-field v-model="form.employeeTypeName"
            placeholder="พนักงานปกติ , พนักงานเข้ากะปกติ , พนักงานเข้ากะ12ชม , พนักงานรายชั่วโมง" outlined dense />
        </v-col>

        <!-- ประเภทวัน -->
        <v-col cols="12" md="6">
          <label class="field-label">ประเภทวัน*</label>
          <v-text-field v-model="form.Worknametype" placeholder="วันทำงาน , วันหยุด" outlined dense />
        </v-col>

        <!-- ช่วงเวลา -->
        <v-col cols="12" md="6">
          <label class="field-label">ช่วงเวลา ทำงาน*</label>
          <v-text-field v-model="form.otPeriod" placeholder="ทำงานในเวลา , ทำงานนอกเวลา" outlined dense />
        </v-col>

        <!--  โผล่เฉพาะทำงานนอกเวลา -->
        <v-col cols="12" md="6" v-if="form.otPeriod === 'ทำงานนอกเวลา'">
          <label class="field-label">ช่วง OT นอกเวลา*</label>
          <v-radio-group v-model="form.otContext" row>
            <v-radio label="หลังเลิกงาน" value="AFTER_WORK" />
            <v-radio label="ก่อนเริ่มงาน" value="BEFORE_WORK" />
          </v-radio-group>
        </v-col>

        <!-- ทำงานต่อเนื่อง -->
        <v-col cols="12" md="6">
          <label class="field-label">ทำงานต่อเนื่อง (ชม.)</label>
          <v-text-field v-model="form.min_continuousHours" outlined dense />

        </v-col>

        <!-- หักพัก -->
        <v-col cols="12" md="6">
          <label class="field-label">หักพัก (นาที)</label>
          <v-text-field v-model.number="form.break_minutes" type="number" Placeholder='' outlined dense />
        </v-col>

        <!-- ค่าล่วงเวลา -->
        <v-col cols="12" md="6">
          <label class="field-label">ค่าล่วงเวลา (เท่า)*</label>
          <v-text-field v-model.number="form.rate" type="number" min="1" max="3" step="0.5" outlined dense
            hint="ค่าที่แนะนำจากระบบ" persistent-hint />
        </v-col>

        <!-- ตัวอย่างกฎ -->
        <v-col cols="12" v-if="exampleRules.length">
          <label class="field-label">ตัวอย่างกฎการคำนวณ OT</label>
          <v-card outlined class="pa-3">
            <div v-for="(rule, index) in exampleRules" :key="index" class="rule-item">
              <v-icon small color="success" class="mr-2">
                mdi-check-circle
              </v-icon>
              <span>{{ rule }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions class="pb-4 px-6">

      <!-- 🔥 ปุ่มลบ (โผล่เฉพาะตอนแก้ไข) -->
      <v-btn v-if="form.id" color="error" text @click="deleteItem">
        <v-icon left>mdi-delete</v-icon>
        ลบข้อมูล
      </v-btn>

      <v-btn text @click="$emit('close')">
        ยกเลิก
      </v-btn>

      <v-spacer />

      <v-btn color="primary" depressed class="rounded-lg px-8" :loading="loading" @click="saveForm">
        บันทึกข้อมูล
      </v-btn>

    </v-card-actions>

  </v-card>
</template>

<script>
import api from '~/service/api'
import { getExampleRules } from '~/utils/overtimeconfig/otExampleRules'
import { suggestRate } from '~/utils/overtimeconfig/otRateHelper'
import { getEmployeeTypeId, getEmployeeTypeName } from '~/utils/overtimeconfig/otEmployeeHelper'
import { calculateBreak } from '~/utils/overtimeconfig/otBreakCalculator'

export default {
  name: 'OvertimeTypeForm',

  props: {
    editData: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      loading: false,
      exampleRules: [],
      form: {
        id: null,
        name: '',
        employeeTypeName: '',
        Worknametype: '',
        otPeriod: '',
        otContext: '',
        min_continuousHours: '',
        break_minutes: 0,
        rate: 1,
        start_time: null
      }
    }
  },

  watch: {
    // --------- ของเดิม ---------
    'form.employeeTypeName': 'applyRules',
    'form.Worknametype': 'applyRules',
    'form.otPeriod': 'applyRules',
    'form.otContext': 'applyAutoBreak',
    'form.min_continuousHours': 'applyAutoBreak',

    // --------- FIX BUG ตรงนี้ ---------
    editData: {
      immediate: true,
      handler(val) {

        if (!val) {
          this.resetForm()
          return
        }


        this.form.id = val.id

        this.form.name = val.name

        this.form.employeeTypeName =
          getEmployeeTypeName(val.employee_type_id)

        this.form.Worknametype =
          val.day_type === 'WORKDAY'
            ? 'วันทำงาน'
            : 'วันหยุด'

        this.form.otPeriod =
          val.ot_period === 'DURING_WORK'
            ? 'ทำงานในเวลา'
            : 'ทำงานนอกเวลา'

        this.form.rate = val.rate
        this.form.start_time = val.start_time
        this.form.min_continuousHours = val.min_continuous_hours
        this.form.break_minutes = val.break_minutes

        this.applyRules()
        this.applyAutoBreak()
      }
    }
  },

  methods: {
    // ===============================
    // RESET FORM (เพิ่มใหม่)
    // ===============================
    resetForm() {
      this.form = {
        id: null,
        name: '',
        employeeTypeName: '',
        Worknametype: '',
        otPeriod: '',
        otContext: '',
        min_continuousHours: '',
        break_minutes: 0,
        rate: 1,
        start_time: null
      }
      this.exampleRules = []
    },

    // ===============================
    // RULES (ของเดิม)
    // ===============================
    applyRules() {
      this.exampleRules = getExampleRules(this.form)
      this.form.rate = suggestRate(this.form)

      const empTypeId =
        getEmployeeTypeId(this.form.employeeTypeName)

      const isNormalEmployee = empTypeId === 1
      const isDuringWork =
        this.form.otPeriod === 'ทำงานในเวลา'

      if (isNormalEmployee && isDuringWork) {
        this.form.start_time = '08:30:00'
      } else {
        this.form.start_time = null
      }

      this.applyAutoBreak()
    },

    applyAutoBreak() {
      const empTypeId =
        getEmployeeTypeId(this.form.employeeTypeName)

      const { breakMinutes } = calculateBreak({
        employeeType: empTypeId,
        workedHours: this.form.min_continuousHours,
        otPeriod: this.form.otPeriod,
        otContext: this.form.otContext
      })

      this.form.break_minutes = breakMinutes
    },

    // ===============================
    // SAVE
    // ===============================
    async saveForm() {
      if (
        !this.form.employeeTypeName ||
        !this.form.Worknametype ||
        !this.form.otPeriod
      ) {
        this.$toast?.error('กรุณากรอกข้อมูลให้ครบ')
        return
      }

      if (
        this.form.otPeriod === 'ทำงานนอกเวลา' &&
        !this.form.otContext
      ) {
        this.$toast?.error('กรุณาเลือกช่วง OT นอกเวลา')
        return
      }

      const empTypeId =
        getEmployeeTypeId(this.form.employeeTypeName)

      let startCondition = null
      let startTime = null

      // ---- CORE LOGIC (ของคุณ ไม่แตะ) ----
      if (this.form.otPeriod === 'ทำงานในเวลา') {
        if (empTypeId === 1) {
          startCondition = 'FIXED_TIME'
          startTime = '08:30:00'
        } else {
          startCondition = null
          startTime = null
        }
      } else {
        startCondition =
          this.form.otContext === 'AFTER_WORK'
            ? 'AFTER_WORK'
            : 'BEFORE_WORK'
        startTime = null
      }

      const payload = {
        name: this.form.name,
        employee_type_id: empTypeId,
        day_type:
          this.form.Worknametype === 'วันทำงาน'
            ? 'WORKDAY'
            : 'HOLIDAY',
        ot_period:
          this.form.otPeriod === 'ทำงานในเวลา'
            ? 'DURING_WORK'
            : 'OUTSIDE_WORK',
        start_time: startTime,
        start_condition: startCondition,
        rate: this.form.rate,
        min_continuous_hours:
          this.form.min_continuousHours,
        break_minutes:
          this.form.break_minutes,
        require_break:
          this.form.break_minutes > 0 ? 1 : 0,
        description:
          `${this.form.employeeTypeName} - ${this.form.Worknametype} - ${this.form.otPeriod}`,
        is_active: 1
      }

      try {
        if (this.form.id) {
          await api.put(
            `/api/otconfig/${this.form.id}`,
            payload
          )
        } else {
          await api.post('/api/otconfig', payload)
        }

        this.$toast?.success('บันทึกข้อมูลเรียบร้อย')
        this.$emit('saved')
        this.$emit('close')

      } catch (e) {
        console.log('SAVE ERROR =', e.response?.data)
      }
    },

    // ===============================
    // DELETE
    // ===============================
    async deleteItem() {
      const ok = confirm('ยืนยันการลบรายการนี้?')
      if (!ok) return

      try {
        await api.delete(`/api/otconfig/${this.form.id}`)

        this.$toast?.success('ลบข้อมูลเรียบร้อย')

        this.$emit('saved')
        this.$emit('close')

      } catch (e) {
        console.log('DELETE ERROR =', e.response?.data)
        this.$toast?.error(
          e.response?.data?.message || 'ลบข้อมูลไม่สำเร็จ'
        )
      }
    }
  }
}
</script>


<style scoped>
.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  display: block;
}

.rule-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
  color: #475569;
}

.rule-item:not(:last-child) {
  border-bottom: 1px dashed #e2e8f0;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.rule-item span {
  white-space: pre-line;
  display: block;
  line-height: 1.6;
}
</style>
