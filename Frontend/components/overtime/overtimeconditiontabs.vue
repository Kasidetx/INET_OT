<template>
  <div class="mt-6" v-if="localConditions && localConditions.ot">
    <!-- แถบหัวข้อ -->
    <div class="section-strip section-strip--full">
      <div class="d-flex align-center">
        <div class="section-icon section-icon--blue">
          <v-icon size="20" color="#2563eb">mdi-cash-multiple</v-icon>
        </div>
        <span class="section-title">เงื่อนไขการคำนวณรายได้ / รายหัก</span>
      </div>
    </div>

    <div class="tabs-wrapper">
      <v-tabs v-model="tab" background-color="transparent" slider-color="#2563eb" slider-size="2"
        class="condition-tabs">
        <v-tab v-for="item in tabs" :key="item.value" class="tab-label">
          {{ item.label }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <!-- *********************** แท็บ: ล่วงเวลา *********************** -->
        <v-tab-item>
          <!-- สวิตช์ด้านบน -->
          <div class="switch-section">
            <div class="switch-row">
              <div class="switch-label-wrapper">
                <span class="switch-label">คำนวณค่าล่วงเวลาแบบเหมา</span>
                <!-- ช่องกรอกค่าล่วงเวลาต่อชั่วโมง (แสดงเมื่อ enabled = true) -->
                <div v-if="localConditions.ot.enabled" class="rate-input-inline">
                  <span class="rate-label">ค่าล่วงเวลาต่อชั่วโมง<span class="text-danger">*</span></span>
                  <v-text-field v-model.number="localConditions.ot.ratePerHour" placeholder="0.00" dense outlined
                    hide-details="auto" type="number" class="custom-textfield rate-textfield" />
                </div>
              </div>
              <v-switch v-model="localConditions.ot.enabled" inset hide-details class="custom-switch" />
            </div>

            <div class="switch-row">
              <span class="switch-label switch-label--secondary">กำหนดเงื่อนไขวันหยุดตามประเพณี</span>
              <v-switch v-model="localConditions.ot.holidayEnabled" inset hide-details class="custom-switch" />
            </div>
          </div>

          <!-- ตารางช่วงเวลาที่ทำงาน -->
          <div class="table-section">
            <table class="ot-table">
              <thead>
                <tr>
                  <th class="th-time">ช่วงเวลาที่ทำงาน</th>
                  <th class="th-code">รหัส</th>
                  <th class="th-multiplier">จำนวนเท่า</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in visibleHolidayRows" :key="index">
                  <td class="td-time">{{ row.label }}</td>
                  <td class="td-code">{{ row.code }}</td>
                  <td class="td-multiplier">
                    <input v-model.number="row.multiplier" type="number" class="multiplier-input"
                      :disabled="!isMultiplierEditable(row)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- =================== บล็อกภาษี =================== -->
          <div class="switch-section mt-2">
            <div class="switch-row">
              <span class="switch-label">นำส่งภาษีเงินได้</span>
              <v-switch v-model="localConditions.ot.taxIncluded" inset hide-details class="custom-switch" />
            </div>
          </div>

          <div v-if="localConditions.ot.taxIncluded" class="mt-4">
            <!-- แถบตั้งค่าประเภทเงินได้ -->
            <div class="tax-strip">
              <div class="d-flex align-center">
                <div class="tax-icon">
                  <v-icon size="20" color="#f59e0b">mdi-calendar-month</v-icon>
                </div>
                <span class="tax-title">ตั้งค่าประเภทเงินได้เฉพาะประเภทการจ้างนี้</span>
              </div>
              <v-switch v-model="localConditions.ot.taxCustomByEmploymentType" inset hide-details
                class="custom-switch" />
            </div>

            <!-- คำอธิบาย -->
            <div class="tax-description">
              ใช้สำหรับกรณีที่ต้องการกำหนดประเภทเงินได้ของพนักงานที่อยู่ในประเภทการจ้างนี้ให้แตกต่างจากที่กำหนดไว้ที่หน้าตั้งค่ารายได้รายหัก
              โดยจะสามารถกำหนดการคำนวณภาษีของรายได้ตามประเภทการจ้างได้ว่าจะนำรายได้ในคำนวณภาษีเงินได้ตามประเภทใด
              กรณีที่ไม่ได้กำหนด ระบบจะใช้เงื่อนไขการคำนวณจากหน้าตั้งค่ารายได้รายหักตามปกติ
            </div>

            <!-- ฟอร์มรายได้ -->
            <div v-if="showTaxFields" class="form-section">
              <div class="form-section-title">รายได้</div>
              <v-row dense>
                <v-col cols="12" md="4">
                  <div class="field-label">ชื่อรายได้</div>
                  <v-select v-model="localConditions.ot.taxIncome.incomeName" :items="incomeNameOptions" dense outlined
                    hide-details placeholder="เลือกชื่อรายได้" class="custom-select" />
                </v-col>
                <v-col cols="12" md="4">
                  <div class="field-label">ประเภทเงินได้</div>
                  <v-select v-model="localConditions.ot.taxIncome.incomeType" :items="incomeTypeOptions" dense outlined
                    hide-details placeholder="เลือกประเภทเงินได้" class="custom-select" />
                </v-col>
                <v-col cols="12" md="4">
                  <div class="field-label">หักภาษี ณ ที่จ่าย</div>
                  <v-text-field v-model="localConditions.ot.taxIncome.withholdingAtSource" dense outlined hide-details
                    placeholder="-" class="custom-textfield custom-textfield--dark" />
                </v-col>
              </v-row>
            </div>

            <!-- ฟอร์มรายหัก -->
            <div v-if="showTaxFields" class="form-section">
              <div class="form-section-title">รายหัก</div>
              <v-row dense>
                <v-col cols="12" md="4">
                  <div class="field-label">ชื่อรายหัก</div>
                  <v-select v-model="localConditions.ot.taxDeduction.deductionName" :items="deductionNameOptions" dense
                    outlined hide-details placeholder="เลือกชื่อรายหัก" class="custom-select" />
                </v-col>
                <v-col cols="12" md="4">
                  <div class="field-label">ประเภทเงินได้</div>
                  <v-select v-model="localConditions.ot.taxDeduction.deductionType" :items="incomeTypeOptions" dense
                    outlined hide-details placeholder="เลือกประเภทเงินได้" class="custom-select" />
                </v-col>
              </v-row>
            </div>
          </div>
        </v-tab-item>

        <!-- *********************** แท็บอื่น *********************** -->
        <!-- <v-tab-item v-for="item in tabs.slice(1)" :key="item.value">
          <v-card flat class="pa-4">
            <span class="grey--text text--darken-1">
              ยังไม่กำหนดรายละเอียด {{ item.label }} (placeholder)
            </span>
          </v-card>
        </v-tab-item> -->
      </v-tabs-items>
    </div>
  </div>
</template>

<script>
export default {
  name: 'overtimeconditiontabs',
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      tab: 0,
      tabs: [
        { label: 'ล่วงเวลา', value: 'ot' },
        // { label: 'สาย', value: 'late' },
        // { label: 'ขาดงาน', value: 'absent' },
        // { label: 'ลืมลงเวลา', value: 'missing' },
        // { label: 'กลับก่อน', value: 'early' },
        // { label: 'คำนวณสถานะช่วงพัก', value: 'break' }
      ],
      localConditions: {
        ot: {
          enabled: false,
          holidayEnabled: false,
          ratePerHour: null,
          taxIncluded: false,
          taxCustomByEmploymentType: false,
          taxIncome: {
            incomeName: null,
            incomeType: null,
            withholdingAtSource: null
          },
          taxDeduction: {
            deductionName: null,
            deductionType: null
          }
        }
      },
      holidayRows: [
        { label: 'ทำงานล่วงเวลาในทะวันหยุด', code: 'OT1', multiplier: 0 },
        { label: 'ทำงานล่วงเวลาในทะวันหยุดตามประเพณี', code: 'OT2', multiplier: 1 },
        { label: 'ทำงานล่วงเวลาวันทำงาน', code: 'OT3', multiplier: 0 },
        { label: 'ทำงานล่วงเวลาวันหยุด (รายวัน)', code: 'OT4', multiplier: 0 },
        { label: 'ทำงานล่วงเวลานอกทะวันหยุด', code: 'OT4', multiplier: 0, requiresHoliday: true},
        { label: 'ทำงานล่วงเวลานอกทะวันหยุดตามประเพณี', code: 'OT4', multiplier: 3 ,requiresHoliday: true}
      ],
      incomeNameOptions: [
        { text: 'เงินเดือน', value: 'salary' },
        { text: 'ค่าล่วงเวลา', value: 'overtime' },
        { text: 'โบนัส', value: 'bonus' },
        { text: 'ค่าคอมมิชชั่น', value: 'commission' }
      ],
      incomeTypeOptions: [
        { text: 'เงินได้พึงประเมินตาม 40(1)', value: 'type_40_1' },
        { text: 'เงินได้พึงประเมินตาม 40(2)', value: 'type_40_2' },
        { text: 'ไม่ต้องเสียภาษี', value: 'tax_exempt' }
      ],
      deductionNameOptions: [
        { text: 'ประกันสังคม', value: 'social_security' },
        { text: 'กองทุนสำรองเลี้ยงชีพ', value: 'provident_fund' },
        { text: 'อื่นๆ', value: 'other' }
      ]
    }
  },
  computed: {
    // แสดงฟิลด์ภาษีหรือไม่
    showTaxFields () {
      return (
        this.localConditions.ot.taxIncluded &&
        this.localConditions.ot.taxCustomByEmploymentType
      )
    },
    visibleHolidayRows () {
    // ถ้ายังไม่กด "กำหนดเงื่อนไขวันหยุดตามประเพณี"
    // ให้ซ่อน OT5, OT6 ออกไปก่อน
    if (!this.localConditions.ot.holidayEnabled) {
      return this.holidayRows.filter(row => !row.requiresHoliday)
    }

    // ถ้ากดแล้ว แสดงทุกแถวตาม holidayRows
    return this.holidayRows
  }
  },
  created () {
    if (this.value && this.value.ot) {
      this.localConditions.ot = {
        ...this.localConditions.ot,
        ...this.value.ot
      }
    }
  },
  methods: {
    // เช็คว่าช่องจำนวนเท่าแก้ได้ไหม
    isMultiplierEditable (row) {
      // ถ้าเปิดคำนวณค่าล่วงเวลาแบบเหมา -> ห้ามแก้ทุกตัว
      if (this.localConditions.ot.enabled) {
        return false
      }

      // ถ้าไม่กดเงื่อนไขวันหยุดตามประเพณี -> OT1 ห้ามแก้
      if (!this.localConditions.ot.holidayEnabled && row.code === 'OT1') {
        return false
      }

      // กรณีอื่น ๆ แก้ได้
      return true
    },

    // เมื่อเปิด/ปิดการคำนวณแบบเหมา
    handleOTEnabledChange (value) {
      this.localConditions.ot.enabled = value
      if (value) {
        console.log('เปิดการคำนวณแบบเหมา - ใช้ค่าต่อชั่วโมง')
      }
    },

    // เมื่อเปิด/ปิดเงื่อนไขวันหยุด
    handleHolidayEnabledChange (value) {
      this.localConditions.ot.holidayEnabled = value
      // ไม่ reset multiplier เพื่อให้ค่าที่กรอกไว้ยังอยู่
    },

    // เมื่อเปิด/ปิดนำส่งภาษี
    handleTaxIncludedChange (value) {
      this.localConditions.ot.taxIncluded = value

      if (!value) {
        this.localConditions.ot.taxCustomByEmploymentType = false
        this.resetTaxFields()
      }
    },

    // เมื่อเปิด/ปิดการตั้งค่าภาษีแบบ custom
    handleTaxCustomChange (value) {
      this.localConditions.ot.taxCustomByEmploymentType = value

      if (!value) {
        this.resetTaxFields()
      }
    },

    // Reset ฟิลด์ภาษีทั้งหมด
    resetTaxFields () {
      this.localConditions.ot.taxIncome = {
        incomeName: null,
        incomeType: null,
        withholdingAtSource: null
      }
      this.localConditions.ot.taxDeduction = {
        deductionName: null,
        deductionType: null
      }
    },

    // Validate ข้อมูลก่อน save
    validateOTConditions () {
      const ot = this.localConditions.ot

      // ถ้าเปิดการคำนวณแบบเหมา ต้องใส่ค่าต่อชั่วโมง
      if (ot.enabled && (!ot.ratePerHour || ot.ratePerHour <= 0)) {
        return {
          valid: false,
          message: 'กรุณากรอกค่าล่วงเวลาต่อชั่วโมง'
        }
      }

      // ถ้าเปิดการตั้งค่าภาษีแบบ custom ต้องเลือกข้อมูลให้ครบ
      if (ot.taxIncluded && ot.taxCustomByEmploymentType) {
        if (!ot.taxIncome.incomeName || !ot.taxIncome.incomeType) {
          return {
            valid: false,
            message: 'กรุณาเลือกข้อมูลรายได้ให้ครบถ้วน'
          }
        }

        if (!ot.taxDeduction.deductionName || !ot.taxDeduction.deductionType) {
          return {
            valid: false,
            message: 'กรุณาเลือกข้อมูลรายหักให้ครบถ้วน'
          }
        }
      }

      return { valid: true }
    },

    // บันทึกข้อมูล
    saveConditions () {
      const validation = this.validateOTConditions()

      if (!validation.valid) {
        alert(validation.message)
        return
      }

      const dataToSave = {
        ...this.localConditions,
        ot: {
          ...this.localConditions.ot,
          holidayMultipliers: this.holidayRows
        }
      }

      this.$emit('save', dataToSave)
      console.log('บันทึกเงื่อนไขสำเร็จ:', dataToSave)
      // this.$emit('show-success', 'บันทึกเงื่อนไขสำเร็จ')
    }
  },
  watch: {
    // เมื่อ enabled เปลี่ยน
    'localConditions.ot.enabled' (newVal) {
      this.handleOTEnabledChange(newVal)
    },

    // เมื่อ holidayEnabled เปลี่ยน
    'localConditions.ot.holidayEnabled' (newVal) {
      this.handleHolidayEnabledChange(newVal)
    },

    // เมื่อ taxIncluded เปลี่ยน
    'localConditions.ot.taxIncluded' (newVal) {
      this.handleTaxIncludedChange(newVal)
    },

    // เมื่อ taxCustomByEmploymentType เปลี่ยน
    'localConditions.ot.taxCustomByEmploymentType' (newVal) {
      this.handleTaxCustomChange(newVal)
    },

    // sync localConditions -> v-model
    localConditions: {
      handler (val) {
        this.$emit('input', val)
      },
      deep: true
    },

    // sync value (prop) -> localConditions เมื่อ parent เปลี่ยน
    value: {
      handler (val) {
        if (val && val.ot) {
          this.localConditions.ot = {
            ...this.localConditions.ot,
            ...val.ot
          }
        }
      },
      deep: true
    }
  }
}
</script>


<style scoped>
.tabs-wrapper {
  margin-top: 16px;
}

/* ===== Tabs ===== */
.condition-tabs {
  border-bottom: 1px solid #e5e7eb;
}

::v-deep .condition-tabs .v-tabs-bar {
  height: 44px;
}

.tab-label {
  text-transform: none;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: 0;
  min-width: auto;
  padding: 0 20px;
}

.tab-label.v-tab--active {
  color: #2563eb;
  font-weight: 500;
}

/* ===== Section Strip ===== */
.section-strip {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 999px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
}

.section-strip--full {
  width: 100%;
}

.section-icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.section-icon--blue {
  background: #dbeafe;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #2563eb;
}

/* ===== Switch Section ===== */
.switch-section {
  padding: 12px 0;
}

.switch-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 0;
  gap: 16px;
}

.switch-label-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-label {
  font-size: 14px;
  color: #374151;
}

.switch-label--secondary {
  color: #9ca3af;
}

/* Rate Input Inline */
.rate-input-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.rate-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.rate-textfield {
  max-width: 200px;
}

::v-deep .rate-textfield .v-input__slot {
  min-height: 40px !important;
  height: 40px !important;
}

/* Custom Switch */
.custom-switch {
  margin: 0 !important;
  padding: 0 !important;
}

::v-deep .custom-switch .v-input--switch__track {
  height: 26px;
  width: 48px;
  border-radius: 13px;
  background: #e5e7eb;
  opacity: 1;
}

::v-deep .custom-switch.v-input--is-label-active .v-input--switch__track,
::v-deep .custom-switch.v-input--is-dirty .v-input--switch__track {
  background: #22c55e !important;
}

::v-deep .custom-switch .v-input--switch__thumb {
  height: 22px;
  width: 22px;
  top: calc(50% - 11px);
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

::v-deep .custom-switch .v-input--selection-controls__ripple {
  display: none;
}

/* ===== Table ===== */
.table-section {
  margin: 16px 0;
  border-top: 1px solid #e5e7eb;
}

.ot-table {
  width: 100%;
  border-collapse: collapse;
}

.ot-table thead th {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 16px 12px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.th-time {
  width: 55%;
}

.th-code {
  width: 20%;
}

.th-multiplier {
  width: 25%;
}

.ot-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.ot-table tbody tr:last-child {
  border-bottom: none;
}

.ot-table tbody td {
  padding: 14px 12px;
  font-size: 14px;
  color: #374151;
}

.td-time {
  text-align: center;
}

.td-code {
  text-align: center;
  color: #6b7280;
}

.td-multiplier {
  text-align: center;
}

/* Multiplier Input */
.multiplier-input {
  width: 100%;
  max-width: 120px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 14px;
  color: #374151;
  text-align: center;
  outline: none;
  transition: all 0.2s;
}

.multiplier-input:focus {
  border-color: #3b82f6;
  background: #ffffff;
}

.multiplier-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

/* ===== Tax Section ===== */
.tax-strip {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 999px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tax-icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.tax-title {
  font-size: 15px;
  font-weight: 600;
  color: #2563eb;
}

.tax-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin-top: 12px;
  padding: 0 4px;
}

/* ===== Form Section ===== */
.form-section {
  margin-top: 24px;
}

.form-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.field-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

/* Custom Select & TextField */
::v-deep .custom-select .v-input__slot,
::v-deep .custom-textfield .v-input__slot {
  min-height: 44px !important;
  height: 44px !important;
  border-radius: 10px !important;
  border: 1px solid #e5e7eb !important;
  background: #ffffff !important;
}

::v-deep .custom-select.v-input--is-focused .v-input__slot,
::v-deep .custom-textfield.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
}

::v-deep .custom-textfield--dark .v-input__slot {
  background: #4b5563 !important;
  border-color: #4b5563 !important;
}

::v-deep .custom-textfield--dark input {
  color: #ffffff !important;
}

::v-deep .custom-textfield--dark input::placeholder {
  color: #9ca3af !important;
}

::v-deep .custom-select .v-select__selection,
::v-deep .custom-textfield input {
  font-size: 14px;
}

::v-deep .custom-select .v-input__append-inner {
  margin-top: 10px !important;
}

.text-danger {
  color: #ef4444;
}
</style>