
<template>
  <v-dialog v-model="show" max-width="680px" persistent>
    <v-card :style="styles.card">
      <!-- Header -->
      <v-card-title class="d-flex justify-center align-center" :style="styles.header">
        <span class="font-weight-bold text-center" :style="styles.headerTitle">
          {{ headerText }}
        </span>

        <v-btn icon @click="close" :style="styles.closeBtn">
          <v-icon color="#0863B6">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Body -->
      <v-card-text :style="styles.body">
        <div style="background-color: #fff3e0; padding: 10px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed orange;">
            <div style="color: orange; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
                🔧 DEV MODE: จำลองเป็นพนักงาน
            </div>
            <v-row dense>
                <v-col cols="12">
                    <v-text-field
                        v-model="mockEmpId"
                        label="รหัสพนักงาน (emp_id)"
                        placeholder="เช่น 61301, 61302"
                        dense
                        outlined
                        hide-details
                        prepend-inner-icon="mdi-account-cowboy-hat"
                    ></v-text-field>
                </v-col>
            </v-row>
        </div>
        <v-select
            v-model="selectedType"
            :items="employeeTypes"
            item-text="name"
            item-value="id" 
            label="ประเภทพนักงาน"
            outlined
         ></v-select>

        <!-- วัน-เวลาเข้างาน -->
        <v-row class="mb-4" no-gutters align="center">
          <v-col cols="12" sm="4" class="pr-3">
            <span :style="styles.fieldLabel">วัน-เวลาเข้างาน :</span>
          </v-col>
          <v-col cols="12" sm="8">
            <v-text-field v-model="checkInDisplay" outlined dense readonly hide-details placeholder="เลือกวันและเวลา"
              @click="openPicker('checkIn')" style="cursor:pointer;">
              <template #append>
                <v-icon color="#6aa1d3">mdi-calendar</v-icon>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- วัน-เวลาออกงาน -->
        <v-row class="mb-4" no-gutters align="center">
          <v-col cols="12" sm="4" class="pr-3">
            <span :style="styles.fieldLabel">วัน-เวลาออกงาน :</span>
          </v-col>
          <v-col cols="12" sm="8">
            <v-text-field v-model="checkOutDisplay" outlined dense readonly hide-details placeholder="เลือกวันและเวลา"
              @click="openPicker('checkOut')" style="cursor:pointer;">
              <template #append>
                <v-icon color="#6aa1d3">mdi-calendar</v-icon>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- รายละเอียด -->
        <v-row class="mb-4" no-gutters align="start">
          <v-col cols="12" sm="4" class="pr-3">
            <span :style="styles.fieldLabel">รายละเอียด :</span>
          </v-col>
          <v-col cols="12" sm="8">
            <v-textarea v-model="description" outlined rows="4" counter="300" maxlength="300"
              placeholder="กรอกรายละเอียด" hide-details="auto" />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions style="gap: 10px;" class="pb-8 pt-0">
        <v-row no-gutters justify="end" @click="close">
          <v-btn outlined color="#0863B6" rounded min-width="100px" @click="close">
            ยกเลิก
          </v-btn>
        </v-row>
        <v-row no-gutters justify="start">
          <v-btn min-width="100px" rounded color="#0863B6" class="white--text" @click="submit"
            :loading="saving">
            {{ saveButtonText }}
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>

    <!-- Date Picker Dialog -->
    <v-dialog v-model="showDatePicker" max-width="400px">
      <v-card style="border-radius:12px;">
        <v-card-title class="d-flex justify-center" :style="styles.dateHeader">
          พ.ศ. {{ buddhistYear }}
        </v-card-title>
        <v-card-text style="padding:24px;">
          <v-date-picker v-model="selectedDate" locale="th" full-width no-title color="primary"
            @input="onDateSelected" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Time Picker Dialog -->
    <v-dialog v-model="showTimePicker" max-width="380px">
      <div :style="styles.timeWrapper">
        <div :style="styles.timeTopBar">
          <v-icon color="white" size="28">mdi-clock-outline</v-icon>
        </div>

        <div :style="styles.timeBody">
          <vue-timepicker v-model="tempTime" format="HH:mm" :minute-interval="1" hide-clear-button placeholder="HH:mm"
            class="custom-timepicker" />
        </div>

        <div :style="styles.timeFooter">
          <v-btn outlined color="primary" @click="showTimePicker = false" :style="styles.timeBtn">
            ยกเลิก
          </v-btn>
          <v-btn color="primary" @click="confirmTime" :style="styles.timeBtn">
            บันทึก
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </v-dialog>
</template>

<script>
import VueTimepicker from "vue2-timepicker";
import "vue2-timepicker/dist/VueTimepicker.css";
import api from "../../service/api";

export default {
  name: "DialogOvertimeForm",
  components: { VueTimepicker },
  props: {
    value: { type: Boolean, default: false },

    // 'create' | 'edit'
    mode: { type: String, default: "create" },

    // ใช้เฉพาะ edit: object ที่หน้าเว็บ fetch มาแล้ว
    item: { type: Object, default: null },
  },
  data() {
    return {
      saving: false,

      // form state
      id: null,
      checkInDate: null,
      checkInTime: null,
      checkOutDate: null,
      checkOutTime: null,
      description: "",

      // picker state
      pickerTarget: null,
      selectedDate: null,
      tempTime: { HH: "00", mm: "00" },
      showDatePicker: false,
      showTimePicker: false,
      mockEmpId: '61301',

      selectedType: 1, // ค่า Default ประเภท
      employeeTypes: [
          { id: 1, name: 'NORMAL' },
          { id: 2, name: 'SHIFT_8' },
          { id: 3, name: 'SHIFT_12' },
          { id: 4, name: 'HOURLY' },
      ],

      // inline styles
      styles: {
        card: { borderRadius: "16px", overflow: "hidden" },
        header: { position: "relative", backgroundColor: "#e5efff" },
        headerTitle: { fontSize: "1.2rem", color: "#0863b6" },
        closeBtn: {
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          minWidth: "32px",
          height: "32px",
        },
        body: { padding: "32px 24px" },
        fieldLabel: { fontSize: "16px", color: "#333333", fontWeight: 500 },
        footer: { padding: "16px 24px", borderTop: "1px solid #e0e0e0" },
        footerBtn: { textTransform: "none", minWidth: "120px" },
        dateHeader: { backgroundColor: "#1976d2", color: "white", padding: "16px", fontSize: "18px" },
        timeWrapper: { backgroundColor: "white", borderRadius: "8px", overflow: "hidden" },
        timeTopBar: {
          backgroundColor: "#1976d2",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        timeBody: { padding: "32px 24px", backgroundColor: "white", minHeight: "280px" },
        timeFooter: { padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: "12px" },
        timeBtn: { textTransform: "none", minWidth: "90px" },
      },
    };
  },
  computed: {
    show: {
      get() { return this.value; },
      set(v) { this.$emit("input", v); },
    },
    isEdit() {
      return this.mode === "edit";
    },
    headerText() {
      return this.isEdit ? "แก้ไขคำขอล่วงเวลา" : "เพิ่มคำขอล่วงเวลา";
    },
    saveButtonText() {
      return this.isEdit ? "บันทึกการแก้ไข" : "บันทึกคำขอ";
    },
    buddhistYear() {
      const year = this.selectedDate ? new Date(this.selectedDate).getFullYear() : new Date().getFullYear();
      return year + 543;
    },
    checkInDisplay() {
      if (!this.checkInDate || !this.checkInTime) return "";
      return `${this.formatDateThai(this.checkInDate)} ${this.checkInTime}`;
    },
    checkOutDisplay() {
      if (!this.checkOutDate || !this.checkOutTime) return "";
      return `${this.formatDateThai(this.checkOutDate)} ${this.checkOutTime}`;
    },
  },
  watch: {
    // เปิด dialog แล้วค่อย init form ให้ถูกโหมด
    value(val) {
      if (!val) return;
      this.initForm();
    },
    // เผื่อ parent สลับ mode ขณะ dialog เปิด
    mode() {
      if (this.show) this.initForm();
    },
    // ถ้าแก้ไขแล้ว item เปลี่ยน (เลือก record ใหม่)
    item: {
      deep: true,
      handler() {
        if (this.show && this.isEdit) this.initForm();
      },
    },
  },
  methods: {
    initForm() {
      if (this.isEdit) this.fillFromItem(this.item);
      else this.resetForm();
    },
    fillFromItem(item) {
      this.resetForm();
      if (!item) return;

      this.id = item.id ?? null;
      this.description = item.description || "";

      if (item.start_time) {
        const d1 = new Date(item.start_time);
        this.checkInDate = this.toLocalYMD(d1);
        this.checkInTime = this.toHHmm(d1);
      }

      if (item.end_time) {
        const d2 = new Date(item.end_time);
        this.checkOutDate = this.toLocalYMD(d2);
        this.checkOutTime = this.toHHmm(d2);
      }
    },
    resetForm() {
      this.id = null;
      this.checkInDate = null;
      this.checkInTime = null;
      this.checkOutDate = null;
      this.checkOutTime = null;
      this.description = "";

      this.pickerTarget = null;
      this.selectedDate = null;
      this.tempTime = { HH: "00", mm: "00" };
      this.showDatePicker = false;
      this.showTimePicker = false;
      this.saving = false;
    },

    // date/time helpers
    toLocalYMD(d) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    },
    toHHmm(d) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    },
    formatDateThai(dateStr) {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("th-TH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    },

    // picker flow
    openPicker(target) {
      this.pickerTarget = target;
      const today = this.toLocalYMD(new Date());

      if (target === "checkIn") {
        this.selectedDate = this.checkInDate || today;
      } else {
        this.selectedDate = this.checkOutDate || today;
      }
      this.showDatePicker = true;
    },
    onDateSelected() {
      const target = this.pickerTarget;
      const prevTime = target === "checkIn" ? this.checkInTime : this.checkOutTime;

      if (target === "checkIn") this.checkInDate = this.selectedDate;
      else this.checkOutDate = this.selectedDate;

      if (prevTime) {
        const [HH, mm] = prevTime.split(":");
        this.tempTime = { HH, mm };
      } else {
        this.tempTime = { HH: "00", mm: "00" };
      }

      this.showDatePicker = false;
      this.showTimePicker = true;
    },
    confirmTime() {
      const time = `${this.tempTime.HH}:${this.tempTime.mm}`;
      if (this.pickerTarget === "checkIn") this.checkInTime = time;
      else this.checkOutTime = time;
      this.showTimePicker = false;
    },

    close() {
      this.show = false;
      this.$emit("close");
      this.resetForm();
    },

    async submit() {
      const payload = {
        id: this.id,
        start_time: this.checkInDate && this.checkInTime ? `${this.checkInDate} ${this.checkInTime}:00` : null,
        end_time: this.checkOutDate && this.checkOutTime ? `${this.checkOutDate} ${this.checkOutTime}:00` : null,
        description: this.description || "",
        emp_id: this.mockEmpId, 
        created_by: this.mockEmpId,
        type: this.selectedType
      };

      if (!payload.start_time || !payload.end_time) return;

      try {
        this.saving = true;

        let resp;
        if (this.isEdit) {
          if (!payload.id) {
            console.warn("edit mode but missing id");
            return;
          }
          resp = await api.put(`/api/ot/${payload.id}`, payload);
        } else {
          resp = await api.post(`/api/ot`, payload);
        }

        // ให้ parent ไป refresh list เองได้
        const result = {
          mode: this.mode,
          payload,
          resp: resp?.data
        }
        this.$emit("submit", result);
        this.close();
      } catch (err) {
        console.error("Error saving OT:", err);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
/* จำเป็นต้องเป็น CSS เพราะต้องเจาะ DOM ภายใน vue2-timepicker */
::v-deep .custom-timepicker {
  width: 100%;
}

::v-deep .custom-timepicker input.display-time {
  width: 100% !important;
  padding: 14px 16px;
  border: 2px solid #d0d0d0;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  background-color: #fff;
  transition: border-color 0.2s;
}

::v-deep .custom-timepicker input.display-time:focus {
  outline: none;
  border-color: #1976d2;
}

::v-deep .custom-timepicker .dropdown {
  position: relative !important;
  top: 8px !important;
  margin-top: 8px;
  width: 100% !important;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  display: flex !important;
  gap: 12px;
  padding: 8px;
  overflow: hidden;
}

::v-deep .custom-timepicker .select-list {
  flex: 1 1 0 !important;
  max-width: none !important;
  max-height: 160px;
  overflow-y: auto !important;
}

::v-deep .custom-timepicker .controls {
  display: none !important;
}

/* เผื่อธีมบางตัว date title โผล่ */
::v-deep .v-picker__title {
  background-color: #1976d2 !important;
}

::v-deep .v-date-picker-table .v-btn.v-btn--active {
  background-color: #1976d2 !important;
  color: white !important;
}
</style>
