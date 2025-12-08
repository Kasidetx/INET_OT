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
                  <span class="date-value">{{ entry.date }}</span>
                </div>

                <div class="status-block">
                  <span class="small-label">สถานะ</span>
                  <span class="colon">:</span>
                  <span class="status-value">{{ entry.status || "-" }}</span>
                </div>
              </div>

              <div class="bottom-row">
                <div class="in-block">
                  <span class="small-label">เข้างาน</span>
                  <span class="colon">:</span>
                  <span class="detail-value">{{ entry.checkIn }}</span>
                </div>

                <div class="out-block">
                  <span class="small-label">ออกงาน</span>
                  <span class="colon">:</span>
                  <span class="detail-value">{{ entry.checkOut }}</span>
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
    <DialogOvertimeForm v-model="dialogOvertimeForm" :mode="overtimeMode" :item="selectedEntry"
      @submit="handleSubmitOvertime" />
  </v-container>
</template>

<script>
import DialogOvertimeForm from "@/components/timeattendance/DialogOvertimeForm.vue";
import DialogOvertimeConfirm from "@/components/timeattendance/DialogOvertimeConfirm.vue";
import api from "../../service/api";

export default {
  name: "TimeAttendance",
  components: {
    DialogOvertimeForm,
    DialogOvertimeConfirm,
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
      try {
        // ปรับ URL ถ้า backend อยู่ที่พอร์ตอื่น หรือใช้ proxy ใน dev config
        const resp = await api.get("/api/ot");
        console.log("Fetched OT entries:", resp.data);
        if (resp.data && resp.data.success) {
          const items = resp.data.data || [];
          // map backend fields -> UI fields
          this.allTimeEntries = items.map((it) => {
            return {
              selected: false,
              // ถ้า backend เก็บ start_time / end_time ในรูปแบบ ISO
              date: this.formatDateShort(it.created_at) || "-",
              status: "-",
              checkIn: this.formatDateTimeLong(it.start_time) || it.start_time || "-",
              checkOut: this.formatDateTimeLong(it.end_time) || it.end_time || "-",
              description: it.description || "-",
              // keep raw for edit if needed
              _raw: it,
            };
          });
          this.timeEntries = [...this.allTimeEntries];
          this.selectAll = false;
        } else {
          console.warn("No data from /api/ot", resp.data);
          this.allTimeEntries = [];
          this.timeEntries = [];
        }
      } catch (err) {
        console.error("Failed to load OT entries:", err);
        // fallback to empty
        this.allTimeEntries = [];
        this.timeEntries = [];
      }
    },

    formatDateShort(iso) {
      if (!iso) return null;
      try {
        const d = new Date(iso);
        return d.toLocaleDateString("th-TH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }); // e.g. "ศ. 26 ก.ย. 2565"
      } catch {
        return iso;
      }
    },

    formatDateTimeLong(iso) {
      if (!iso) return null;
      try {
        const d = new Date(iso);
        const date = d.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const time = d.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return `${date} ${time} น.`;
      } catch {
        return iso;
      }
    },

    onSearch() {
      if (this.selectedYear && this.selectedMonth) {
        this.timeEntries = this.allTimeEntries.filter((entry) => {
          const text = entry.checkIn || "";
          return (
            text.includes(this.selectedYear) &&
            text.includes(this.selectedMonth)
          );
        });
        this.selectAll = false;
      } else {
        console.log("Please select both year and month to search.");
        this.timeEntries = this.allTimeEntries;
        this.selectAll = false;
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
      const raw = entry._raw || {};

      this.overtimeMode = "edit";
      this.selectedEntry = {
        ...entry,
        title: "แก้ไขคำขอล่วงเวลา",
        start_time: raw.start_time,
        end_time: raw.end_time,
        id: raw.id,
        description: raw.description ?? entry.description ?? "",
      };

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
