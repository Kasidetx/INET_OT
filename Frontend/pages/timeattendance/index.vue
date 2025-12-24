<template>
  <v-container class="pa-0" style="background-color:#ffffff; min-height:100vh; border-radius:16px;">
    <div style="padding:32px; background-color:#ffffff; border-radius:16px;">
      <v-row class="mb-4 align-center" no-gutters>
        <!-- ปี -->
        <v-col cols="auto" class="d-flex align-center">
          <span style="font-size:14px; color:#333333; margin-right:8px;">
            ปี :
          </span>
          <v-select v-model="selectedYear" :items="yearList" dense outlined hide-details style="min-width:120px;" />
        </v-col>

        <!-- เดือน -->
        <v-col cols="auto" class="d-flex align-center ml-3">
          <span style="font-size:14px; color:#333333; margin-right:8px;">
            เดือน :
          </span>
          <v-select v-model="selectedMonth" :items="monthList" dense outlined hide-details style="min-width:160px;" />
        </v-col>

        <!-- ปุ่มค้นหา -->
        <v-col cols="auto" class="d-flex align-center ml-3">
          <v-btn color="primary" outlined @click="onSearch"
            style="height:36px; padding:0 18px; font-size:14px; text-transform:none;">
            ค้นหา
          </v-btn>
        </v-col>

        <v-spacer />

        <v-col cols="auto">
          <v-btn min-width="100px" :disabled="!hasSelectedEntries" :color="hasSelectedEntries ? '#0863B6' : '#C4C4C4'"
            class="white--text" style="text-transform:none;" @click="dialogConfirm = true">
            ส่งคำขอ
          </v-btn>
        </v-col>
      </v-row>

      <v-spacer />

      <!-- Heading -->
      <div style="margin-bottom:24px;">
        <p style="font-size:24px; font-weight:700; color:#158eff; margin:0;">
          รายการเวลาเข้างาน {{ timeEntries.length }} รายการ
        </p>
      </div>

      <v-row class="mb-4" no-gutters>
        <v-col cols="auto">
          <v-checkbox v-model="selectAll" hide-details big-checkbox class="select-all-checkbox"
            @change="toggleSelectAll">
            <template #label>
              <span style="font-size:18px; font-weight:500; color:#333333; line-height:1;">
                เลือกทั้งหมด
              </span>
            </template>
          </v-checkbox>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto">
          <v-btn outlined color="primary" @click="addOvertimeRequest" style="
              height:46px;
              padding:0 24px;
              text-transform:none;
              border-color:#6aa1d3;
              color:#6aa1d3;
              font-size:15px;
            ">
            เพิ่มคำขอล่วงเวลา
          </v-btn>
        </v-col>
      </v-row>

      <div class="entries-container">
        <div v-for="(entry, index) in timeEntries" :key="index" class="time-entry-card">
          <div class="entry-row">
            <div class="entry-checkbox">
              <v-checkbox v-model="entry.selected" hide-details big-checkbox @change="updateSelectAll"></v-checkbox>
            </div>

            <div class="card-main">
              <div class="top-row">
                <div class="date-block">
                  <span class="small-label">วันที่</span>
                  <span class="colon">:</span>
                  <span class="date-value">{{ $formatDate(entry.date) }}</span>
                </div>

                <div class="status-block">
                  <span class="small-label">สถานะ</span>
                  <span class="colon">:</span>

                  <Status :value="entry.status" />
                </div>
              </div>

              <div class="bottom-row">
                <div class="in-block">
                  <span class="small-label">เข้างาน</span>
                  <span class="colon">:</span>
                  <span class="detail-value">{{ $formatDateTime(entry.checkIn) }}</span>
                </div>

                <div class="out-block">
                  <span class="small-label">ออกงาน</span>
                  <span class="colon">:</span>
                  <span class="detail-value">{{ $formatDateTime(entry.checkOut) }}</span>
                </div>
              </div>
              <div v-if="entry.selected">
                <span class="small-label">รายละเอียด</span>
                <span class="colon">:</span>
                <v-textarea v-model="entry.description" outlined rows="2" counter="300" maxlength="300" readonly
                  placeholder="กรอกรายละเอียด" hide-details="auto" />
              </div>
            </div>

            <div class="entry-edit">
              <div class="edit-button-wrapper" @click="editOvertimeRequest(entry)">
                <v-btn class="btn-edit-icon">
                  <v-icon class="pencil-icon">mdi-pencil</v-icon>
                </v-btn>
              </div>
              <span class="edit-text">แก้ไขคำขอล่วงเวลา</span>
            </div>
          </div>
        </div>

      </div>
    </div>
    <DialogOvertimeConfirm v-model="dialogConfirm" @confirm="submitRequest" />
    <DialogOvertimeForm v-model="dialogOvertimeForm" :mode="overtimeMode" :item="selectedEntry" :emp-id="mockEmpId"
      @submit="handleSubmitOvertime" />
  </v-container>
</template>

<script>
import DialogOvertimeForm from "@/components/timeattendance/DialogOvertimeForm.vue";
import DialogOvertimeConfirm from "@/components/timeattendance/DialogOvertimeConfirm.vue";
import Status from "@/components/global/Status.vue"; // ตรวจสอบ path ให้ถูกต้อง
import api from "../../service/api";

export default {
  name: "TimeAttendance",
  components: {
    DialogOvertimeForm,
    DialogOvertimeConfirm,
    Status
  },
  data() {
    const THAI_MONTHS = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const now = new Date();
    const buddhistYear = now.getFullYear() + 543;
    return {
      selectedYear: String(buddhistYear),
      selectedMonth: THAI_MONTHS[now.getMonth()],
      yearList: Array.from({ length: 4 }, (_, i) => String(buddhistYear - i)),
      monthList: THAI_MONTHS,

      selectAll: false,

      allTimeEntries: [],
      timeEntries: [],
      dialogOvertimeForm: false,
      selectedEntry: null,
      overtimeMode: "",
      dialogConfirm: false,

      mockEmpId: '61302',
    };
  },
  created() {
    this.fetchTimeEntries();
  },
  computed: {
    hasSelectedEntries() {
      return this.timeEntries.some((entry) => entry.selected);
    },
  },
  methods: {

    async fetchTimeEntries() {
      this.loading = true;
      try {
        // 1. ยิง API /api/ot แบบ Production
        const response = await api.get("/api/ot", {
          params: {
            // ส่งค่า Mock ID ไป (ถ้า user ไม่กรอกจะเป็น null/empty ก็ไม่เป็นไร)
            emp_id: this.mockEmpId
          }
        });

        if (response.data && response.data.success) {
          const employees = response.data.data;
          const flattenedEntries = [];

          // 2. วนลูป 2 ชั้นเพื่อแตกข้อมูล (Employee -> Request -> Row)
          employees.forEach(emp => {
            // เช็คว่าพนักงานคนนี้มีรายการ OT ไหม
            if (Array.isArray(emp.ot_requests) && emp.ot_requests.length > 0) {

              emp.ot_requests.forEach(req => {
                flattenedEntries.push({
                  // --- ส่วนข้อมูลหลักที่ใช้แสดงผล ---
                  date: req.created_at,     // วันที่ (เช่น 24/12/2568)
                  checkIn: req.start_time,  // เวลาเข้า (เช่น 08:30 น.)
                  checkOut: req.end_time,   // เวลาออก (เช่น 17:30 น.)
                  status: req.ot_status,    // สถานะ (เช่น รออนุมัติ)
                  description: req.description || "-",        // รายละเอียด


                  // --- ส่วนที่ต้องใช้สำหรับ Logic (Checkbox, Edit, Status) ---
                  id: req.id,                 // ID ของรายการ OT
                  request_id: req.request_id,
                  emp_id: this.mockEmpId,
                  selected: false,      // จำเป็นสำหรับ Checkbox เลือกรายการ
                });
              });
            }
          });

          // 3. อัปเดตเข้าตัวแปรตาราง
          this.timeEntries = flattenedEntries;
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        this.loading = false;
      }
    },

    // ปรับปรุง onSearch ให้ค้นหาจากข้อมูลที่ map มาแล้ว
    onSearch() {
      if (this.selectedYear && this.selectedMonth) {
        const targetYear = parseInt(this.selectedYear); // พ.ศ.
        this.timeEntries = this.allTimeEntries.filter((entry) => {
          const d = new Date(entry._raw.start_time);
          const entryYear = d.getFullYear() + 543;
          const entryMonth = this.monthList[d.getMonth()];

          return entryYear === targetYear && entryMonth === this.selectedMonth;
        });
      }
    },

    submitRequest() {
      // logic submit จริงค่อยมาใส่ทีหลัง
      const selected = this.timeEntries.filter((e) => e.selected);
      console.log("Submit request", selected);
    },
    addOvertimeRequest() {
      this.overtimeMode = "create";
      this.selectedEntry = null;
      this.dialogOvertimeForm = true;
    },
    editOvertimeRequest(entry) {
      this.overtimeMode = "edit";
      this.selectedEntry = {
        ...entry,
      };

      console.log("Editing entry:", this.selectedEntry);

      this.dialogOvertimeForm = true;
    },
    toggleSelectAll() {
      this.timeEntries.forEach((entry) => {
        entry.selected = this.selectAll;
      });
    },
    updateSelectAll() {
      this.selectAll = this.timeEntries.every((entry) => entry.selected);
    },
    handleSubmitOvertime(submit) {
      console.log("บันทึก OT สำเร็จ", submit);
      this.fetchTimeEntries();
    }
  }
};
</script>

<style scoped>
.entries-container {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.time-entry-card {
  position: relative;
  border: 1px solid #e6eef6;
  border-radius: 14px;
  padding: 26px 26px 24px 20px;
  background-color: #ffffff;
  min-height: 150px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
}

.entry-row {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.entry-checkbox {
  flex-shrink: 0;
  margin-top: 12px;
}

.card-main {
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 16px 32px;
  align-items: center;
}

.top-row,
.bottom-row {
  display: contents;
}

.date-block,
.in-block {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-block,
.out-block {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  margin: 15px;
}

.small-label {
  font-size: 18px;
  color: #6b6b6b;
  font-weight: 500;
}

.colon {
  margin: 0 6px;
  color: #6b6b6b;
  font-weight: 500;
  font-size: 18px;
}

.date-value,
.status-value,
.detail-value {
  font-size: 18px;
  font-weight: 600;
  color: #222222;
}

.entry-edit {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  z-index: 5;
}

.edit-button-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #ffffff;
  overflow: hidden;
  height: 40px;
  padding: 0;
}

.btn-edit-icon {
  background-color: #ffffff !important;
  height: 40px !important;
  min-width: 40px !important;
  padding: 0 !important;
  box-shadow: none;
  margin: 0 !important;
}

.edit-text {
  color: #333333;
  padding: 0 12px;
  white-space: nowrap;
  line-height: 40px;
  height: 40px;
  font-size: 18px;
}

.pencil-icon {
  color: #6aa1d3 !important;
  font-size: 20px;
}

::v-deep .v-checkbox label {
  color: #333333;
  font-size: 15px;
}

::v-deep .v-input--selection-controls {
  margin-top: 0;
  padding-top: 0;
}

::v-deep .v-input--checkbox .v-input__control {
  margin-top: 0;
}
</style>
