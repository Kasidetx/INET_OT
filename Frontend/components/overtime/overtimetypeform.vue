<template>
  <v-card class="irecruit-card" flat>
    <div class="irecruit-inner">
      <!-- แถวหัวการ์ดแบบรูปซ้าย -->
      <div class="card-header-row">
        <div class="card-header-left">
          <div class="card-header-icon">
            <v-icon size="24" color="#f59e0b">
              mdi-briefcase-outline
            </v-icon>
          </div>
          <span class="card-header-title">
            ประเภทการจ้าง
          </span>
        </div>
      </div>

      <!-- แถว dropdown + ปุ่มเพิ่ม -->
      <v-row class="mt-4 align-center">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedType"
            :items="typeOptions"
            dense
            outlined
            hide-details="auto"
            placeholder="ประเภทการจ้าง"
            class="irecruit-select"
          />
        </v-col>
        <v-col cols="12" md="6" class="d-flex justify-end">
          <v-btn class="add-type-btn" depressed>
            <v-icon left size="20" color="white">mdi-plus-circle-outline</v-icon>
            <span class="add-btn-text">เพิ่มประเภทการจ้าง</span>
          </v-btn>
        </v-col>
      </v-row>

      <!-- แถบหัวข้อสีฟ้าอ่อน + icon : "ประเภทการจ้าง" -->
      <div class="employment-section mt-6">
        <!-- แถบหัวข้อสีฟ้าอ่อน + ไอคอน -->
        <div class="section-strip section-strip--full">
          <div class="d-flex align-center">
            <div class="section-icon section-icon--orange">
              <v-icon size="20" color="#f59e0b">mdi-briefcase-outline</v-icon>
            </div>
            <span class="section-title">
              ประเภทการจ้าง
            </span>
          </div>
        </div>

        <!-- ฟอร์มรายละเอียด -->
        <v-row class="mt-5">
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">ชื่อประเภทการจ้าง<span class="required">*</span></label>
              <v-text-field
                v-model="form.nameTh"
                dense
                outlined
                hide-details="auto"
                required
                class="irecruit-textfield"
              />
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">ชื่อประเภทการจ้าง (อังกฤษ)</label>
              <v-text-field
                v-model="form.nameEn"
                dense
                outlined
                hide-details="auto"
                class="irecruit-textfield"
              />
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">ประเภทการจ่าย<span class="required">*</span></label>
              <v-select
                v-model="form.payType"
                :items="payTypeOptions"
                dense
                outlined
                hide-details="auto"
                class="irecruit-textfield"
              />
            </div>
          </v-col>
        </v-row>

        <!-- Checkbox section -->
        <div class="checkbox-section mt-4">
          <v-checkbox
            v-model="form.isHolidayIncluded"
            hide-details
            dense
            class="irecruit-checkbox"
          >
            <template #label>
              <span class="checkbox-label">ได้รับค่าแรงวันหยุดตามประเพณี</span>
            </template>
          </v-checkbox>
          <v-checkbox
            v-model="form.isHourly"
            hide-details
            dense
            class="irecruit-checkbox"
          >
            <template #label>
              <span class="checkbox-label">จ่ายเป็นรายชั่วโมง</span>
            </template>
          </v-checkbox>
        </div>
      </div>

      <!-- เงื่อนไขการคำนวณ (หัวข้อ + tabs อยู่ใน component ข้างล่าง) -->
      <OvertimeConditionTabs v-model="form.conditions" />

      <!-- ปุ่มล่าง -->
      <v-divider class="mt-8 mb-4" />
    </div>
  </v-card>
</template>

<script>
import OvertimeConditionTabs from '~/components/overtime/overtimeconditiontabs.vue'

export default {
  name: 'overtimetypeform',
  components: {
    OvertimeConditionTabs
  },
  data () {
    return {
      selectedType: null,
      typeOptions: [
        { text: 'รายวัน', value: 'ot1' },
        { text: 'ฝึกงาน', value: 'ot2' },
        { text: 'รายเดือน', value: 'ot3' }
      ],
      payTypeOptions: [
        { text: 'รายวัน', value: 'daily' },
        { text: 'รายเดือน', value: 'monthly' }
      ],
      form: this.getEmptyForm()
    }
  },
  methods: {
    getEmptyForm () {
      return {
        nameTh: 'รายวัน',
        nameEn: 'Daily Payment',
        payType: 'daily',
        isHolidayIncluded: true,
        isHourly: false,
        conditions: {}
      }
    },
    onReset () {
      this.form = this.getEmptyForm()
      this.selectedType = null
    },
    onSave () {
      this.$emit('saved', this.form)
    }
  }
}
</script>

<style scoped>
/* การ์ดใหญ่ให้ฟีล iRecruit */
.irecruit-card {
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.05);
  border: none;
}

.irecruit-inner {
  padding: 28px 32px 24px;
}

/* แถวหัวการ์ดบนสุด */
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-left {
  display: flex;
  align-items: center;
}

.card-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #fff1d6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.card-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

/* ปุ่ม "เพิ่มประเภทการจ้าง" */
.add-type-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border-radius: 999px;
  text-transform: none;
  padding: 10px 24px !important;
  height: 44px !important;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25) !important;
}

.add-type-btn:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35) !important;
}

.add-btn-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* แถบหัวข้อถัดลงมา (ประเภทการจ้าง) */
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
  margin-right: 10px;
}

.section-icon--orange {
  background: #fef3c7;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #2563eb;
}

/* ================== Field Groups ================== */
.field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.field-label .required {
  color: #ef4444;
  margin-left: 2px;
}

/* ================== ฟิลด์ + Checkbox ================== */

/* ใช้กับ v-text-field & v-select */
.irecruit-textfield {
  margin-bottom: 0;
}

.irecruit-select {
  margin-bottom: 0;
}

/* ปรับ slot ของ input ให้โค้ง/สูงเหมือนต้นฉบับ */
::v-deep .irecruit-textfield .v-input__slot,
::v-deep .irecruit-select .v-input__slot {
  min-height: 48px !important;
  height: 48px !important;
  margin-bottom: 0 !important;
  border-radius: 12px !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: none !important;
  background: #ffffff !important;
}

::v-deep .irecruit-textfield .v-input__slot:hover,
::v-deep .irecruit-select .v-input__slot:hover {
  border-color: #d1d5db !important;
}

/* เวลา focus ขอบฟ้า */
::v-deep .irecruit-textfield.v-input--is-focused .v-input__slot,
::v-deep .irecruit-select.v-input--is-focused .v-input__slot {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Input text style */
::v-deep .irecruit-textfield input,
::v-deep .irecruit-select .v-select__selection {
  font-size: 14px;
  color: #111827;
}

/* Placeholder style */
::v-deep .irecruit-select .v-input__slot input::placeholder {
  color: #9ca3af !important;
}

/* ===== Checkbox Section ===== */
.checkbox-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.irecruit-checkbox {
  margin-top: 0;
  padding-top: 0;
}

::v-deep .irecruit-checkbox .v-input--selection-controls__input {
  margin-right: 8px;
}

::v-deep .irecruit-checkbox .v-icon {
  color: #3b82f6 !important;
}

.checkbox-label {
  color: #4b5563;
  font-size: 14px;
}

/* Checkbox checked state */
::v-deep .irecruit-checkbox.v-input--is-label-active .v-icon {
  color: #3b82f6 !important;
}
</style>