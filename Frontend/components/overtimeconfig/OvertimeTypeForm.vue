<template>
  <v-card class="rounded-xl pa-4">
    <v-card-title class="font-weight-bold">
      <v-icon left color="primary">mdi-plus-circle</v-icon>
      เพิ่มข้อมูลประเภทการจ้าง
    </v-card-title>

    <v-divider class="mb-4" />
    <v-card-text>
      <v-row dense>
        <!-- ชื่อ config -->
        <v-col cols="12" md="6">
          <label class="field-label">ชื่อการตั้งค่า <span style="color: red;">*</span> </label>
          <v-text-field v-model="form.name" placeholder="เช่น โอทีพนักงานรายวัน (จ-ศ)" outlined dense />
        </v-col>

        <!-- ประเภทพนักงาน -->
        <v-col cols="12" md="6">
          <label class="field-label">ประเภทพนักงาน <span style="color: red;">*</span> </label>
          <v-select v-model="form.employeeTypeName" :items="employeeTypes" outlined dense @change="onUserChange" />
        </v-col>

        <!-- ประเภทวัน -->
        <v-col cols="12" md="6">
          <label class="field-label">ประเภทวัน <span style="color: red;">*</span> </label>
          <v-select v-model="form.Worknametype" :items="dayTypes" outlined dense @change="onUserChange" />
        </v-col>

        <!-- ช่วงเวลา -->
        <v-col cols="12" md="6">
          <label class="field-label">ช่วงเวลาทำงาน <span style="color: red;">*</span> </label>
          <v-select v-model="form.otPeriod" :items="periodTypes" outlined dense @change="onUserChange" />
        </v-col>


        <!-- ชั่วโมง -->
        <v-col cols="12" md="6">
          <label class="field-label">ทำงานต่อเนื่อง (ชม.)</label>
          <v-text-field v-model="form.min_continuousHours" outlined dense @change="onUserChange" />
        </v-col>

        <!-- break -->
        <v-col cols="12" md="6">
          <label class="field-label">หักพัก (นาที)</label>
          <v-text-field v-model.number="form.break_minutes" type="number" outlined dense />
        </v-col>

        <!-- rate -->
        <v-col cols="12" md="6">
          <label class="field-label">ค่าล่วงเวลา (เท่า) <span style="color: red;">*</span> </label>
          <v-text-field v-model.number="form.rate" type="number" min="1" max="3" step="0.5" outlined dense
            hint="ค่าที่แนะนำจากระบบ" persistent-hint />
        </v-col>

        <!-- Example -->
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
import {
  getEmployeeTypeId,
  getEmployeeTypeName
} from '~/utils/overtimeconfig/otEmployeeHelper'
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

      /* dropdown source*/
      employeeTypes: [
        'พนักงานปกติ',
        'พนักงานเข้ากะปกติ',
        'พนักงานเข้ากะ12ชม',
        'พนักงานรายชั่วโมง'
      ],

      dayTypes: ['วันทำงาน', 'วันหยุด'],

      periodTypes: [
        'ในเวลางาน',
        'ก่อนเวลางาน (เช้า)',  // <--- เพิ่ม
        'หลังเลิกงาน (เย็น)'   // <--- เพิ่ม
      ],

      /*  ---- form ---- */
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
    editData: {
      immediate: true,
      handler(val) {
        if (!val) return this.resetForm()
        this.mapEditData(val)
      }
    }
  },

  methods: {
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
    mapStartCondition(empId) {
      switch (Number(empId)) {
        case 1: return 'FIXED_TIME'
        case 2: return 'SHIFT'
        case 3: return 'SHIFT'
        case 4: return 'NO_TIME'
        default: return 'NO_TIME'
      }
    },

    mapOtPeriod(period) {
      if (period.includes('ก่อน')) return 'BEFORE_WORK'; // <--- Map ให้ตรง DB
      if (period.includes('หลัง')) return 'AFTER_WORK';  // <--- Map ให้ตรง DB
      return 'DURING_WORK';
    },
    /*  edit */
    mapEditData(val) {
      // map ข้อมูลลง form
      let periodLabel = 'ในเวลางาน';
      if (val.ot_period === 'BEFORE_WORK') periodLabel = 'ก่อนเวลางาน (เช้า)';
      else if (val.ot_period === 'AFTER_WORK') periodLabel = 'หลังเลิกงาน (เย็น)';
      this.form = {
        ...this.form,
        id: val.id,
        name: val.name,
        employeeTypeName: getEmployeeTypeName(val.employee_type_id),
        Worknametype: val.day_type === 'WORKDAY' ? 'วันทำงาน' : 'วันหยุด',
        otPeriod: periodLabel,
        min_continuousHours: val.min_continuous_hours,
        break_minutes: val.break_minutes,
        rate: val.rate,
        start_time: val.start_time
      }

      // ✅ เรียก update แค่ text กฎ แต่ *ห้าม* คำนวณ rate/break ใหม่ทับข้อมูลเดิม
      this.updateRulesDisplayOnly()
    },

    onUserChange() {
      // 1. คำนวณ Break อัตโนมัติ
      this.applyAutoBreak()
      // 2. แนะนำ Rate อัตโนมัติ
      this.form.rate = suggestRate(this.form)
      // 3. อัปเดต text กฎ
      this.updateRulesDisplayOnly()
    },

    /* Break */
    updateRulesDisplayOnly() {
      this.exampleRules = getExampleRules(this.form)
    },

    applyAutoBreak() {
      const empTypeId = getEmployeeTypeId(this.form.employeeTypeName)
      const { breakMinutes } = calculateBreak({
        employeeType: empTypeId,
        workedHours: this.form.min_continuousHours,
        otPeriod: this.form.otPeriod
      })
      this.form.break_minutes = breakMinutes
    },


    /* saveform */
    async saveForm() {
      if (
        !this.form.employeeTypeName ||
        !this.form.Worknametype ||
        !this.form.otPeriod
      ) {
        this.$toast?.error('กรุณากรอกข้อมูลให้ครบ')
        return
      }

      const empTypeId = getEmployeeTypeId(this.form.employeeTypeName)

      // ===== คำนวณ start_time ตามเงื่อนไขใหม่ =====
      let startTime = null

      if (empTypeId === 1) {
        // พนักงานปกติ
        const periodEnum = this.mapOtPeriod(this.form.otPeriod);

        if (periodEnum === 'DURING_WORK') {
          startTime = '08:30:00';
        } else {
          // ถ้าเป็น BEFORE หรือ AFTER ให้เป็น NULL (ตาม SQL ใหม่)
          startTime = null;
        }
      }

      const payload = {
        name: this.form.name,
        employee_type_id: empTypeId,

        day_type:
          this.form.Worknametype === 'วันทำงาน'
            ? 'WORKDAY'
            : 'HOLIDAY',

        ot_period: this.mapOtPeriod(this.form.otPeriod),

        // ทุก type ยังใช้ map เดิม
        start_condition: this.mapStartCondition(empTypeId),

        // ✅ ตรง requirement ใหม่
        start_time: startTime,

        rate: this.form.rate,

        min_continuous_hours: this.form.min_continuousHours,

        break_minutes: this.form.break_minutes,

        require_break:
          this.form.break_minutes > 0 ? 1 : 0,

        description:
          `${this.form.employeeTypeName} - ${this.form.Worknametype} - ${this.form.otPeriod}`,

        is_active: 1
      }

      try {
        if (this.form.id) {
          await api.put(`/api/otconfig/${this.form.id}`, payload)
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


    async deleteItem() {
      const ok = confirm('ยืนยันการลบรายการนี้?')
      if (!ok) return

      try {
        await api.delete(`/api/otconfig/${this.form.id}`)

        this.$toast?.success('ลบข้อมูลเรียบร้อย')

        this.$emit('saved')
        this.$emit('close')

      } catch (e) {
        this.$toast?.error('ลบข้อมูลไม่สำเร็จ')
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
}

.rule-item:not(:last-child) {
  border-bottom: 1px dashed #e2e8f0;
}
</style>
