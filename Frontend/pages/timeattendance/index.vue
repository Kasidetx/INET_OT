<template>
  <v-container class="pa-4 custom-bg" fluid>
    <v-row class="mb-4 align-center" dense>
      <v-col cols="12" sm="auto" class="d-flex align-center mb-3 mb-sm-0">
        <span class="label-text mr-3">ปี :</span>
        <v-select v-model="selectedYear" :items="yearList" outlined hide-details class="white rounded-lg big-input"
          style="min-width: 140px;" />
      </v-col>

      <v-col cols="12" sm="auto" class="d-flex align-center mb-3 mb-sm-0 ml-sm-4">
        <span class="label-text mr-3">เดือน :</span>
        <v-select v-model="selectedMonth" :items="monthList" outlined hide-details class="white rounded-lg big-input"
          style="min-width: 180px;" />
      </v-col>

      <v-col cols="12" sm="auto" class="ml-sm-4 mb-3 mb-sm-0">
        <v-btn color="primary" outlined block class="rounded-lg big-btn" height="50" @click="onSearch">
          <span class="text-h6 font-weight-bold">ค้นหา</span>
        </v-btn>
      </v-col>

      <v-spacer class="d-none d-sm-block" />

      <v-col cols="12" sm="auto" v-if="!$vuetify.breakpoint.xsOnly">
        <v-btn block :disabled="!hasSelectedEntries" :color="hasSelectedEntries ? '#0863B6' : '#E0E0E0'"
          class="white--text rounded-lg big-btn" height="40" @click="dialogConfirm = true">
          <span class="text-h6">ส่งคำขอ</span>
        </v-btn>
      </v-col>
    </v-row>

    <div class="mb-6">
      <h2 class="primary--text text-h5 font-weight-bold mb-4">
        รายการเวลาเข้างาน {{ timeEntries.length }} รายการ
      </h2>

      <v-row no-gutters align="center" class="mb-2">
        <v-col cols="auto">
          <v-checkbox v-model="selectAll" hide-details class="mt-0 pt-0 custom-checkbox" @change="toggleSelectAll">
            <template #label>
              <span class="black--text font-weight-bold" style="font-size: 18px;">เลือกทั้งหมด</span>
            </template>
          </v-checkbox>
        </v-col>

        <v-spacer />

        <v-col cols="12" sm="auto" class="d-flex gap-3 mt-3 mt-sm-0 justify-end flex-wrap">
          <v-btn color="success" outlined class="rounded-lg px-6" height="50" @click="simulateSwipeCard">
            <v-icon left>mdi-card-account-details-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold">จำลองรูดบัตร</span>
          </v-btn>

          <v-btn color="#0863B6" outlined class="rounded-lg px-6 ml-2" height="50" @click="addOvertimeRequest">
            <span class="text-subtitle-1 font-weight-bold">เพิ่มคำขอล่วงเวลา</span>
          </v-btn>
        </v-col>
      </v-row>

      <v-row v-if="$vuetify.breakpoint.xsOnly" class="mb-4 mt-2">
        <v-col cols="12">
          <v-btn block :disabled="!hasSelectedEntries" :color="hasSelectedEntries ? '#0863B6' : '#E0E0E0'"
            class="white--text rounded-lg big-btn" height="56" @click="dialogConfirm = true">
            <span class="text-h6">ส่งคำขอ</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div class="entries-list">
      <div v-for="(entry, index) in timeEntries" :key="index" :class="[
        'entry-card',
        $vuetify.breakpoint.xsOnly ? 'mobile-card' : 'desktop-card'
      ]">
        <div class="d-flex flex-nowrap align-start">

          <div class="mr-4 pt-1">
            <v-checkbox v-model="entry.selected" hide-details class="mt-0 pt-0 custom-checkbox big-checkbox"
              @change="updateSelectAll" />
          </div>

          <div class="flex-grow-1" style="min-width: 0;">

            <div class="d-flex flex-wrap align-center justify-space-between mb-3">
              <div class="d-flex flex-wrap align-center">

                <div class="d-flex align-center mr-8 item-group">
                  <span class="label-text mr-4">วันที่ :</span>
                  <span class="value-text font-weight-bold">{{ $formatDate(entry.date) }}</span>
                </div>

                <div class="d-flex align-center item-group">
                  <span class="label-text mr-4">สถานะ :</span>
                  <div style="transform: scale(1.1); transform-origin: left;">
                    <Status :value="entry.status" />
                  </div>
                </div>

              </div>

              <div class="edit-btn-container" @click="editOvertimeRequest(entry)" v-ripple>
                <v-icon color="#0863B6" size="22" class="mr-1">mdi-pencil</v-icon>
                <span class="edit-text">แก้ไขคำขอล่วงเวลา</span>
              </div>
            </div>

            <div class="d-flex flex-wrap align-center">
              <div class="d-flex align-center mr-10 item-group" style="min-width: 280px;">
                <span class="label-text mr-4">เข้างาน :</span>
                <span class="value-text">
                  {{ $formatDate(entry.date) }}
                  <span class="time-highlight ml-2">{{ $formatTime(entry.checkIn) }}</span>
                </span>
              </div>

              <div class="d-flex align-center item-group" style="min-width: 280px;">
                <span class="label-text mr-4">ออกงาน :</span>
                <span class="value-text">
                  {{ $formatDate(entry.checkOut || entry.date) }}
                  <span class="time-highlight ml-2">{{ $formatTime(entry.checkOut) }}</span>
                </span>
              </div>

            </div>

            <div v-if="entry.selected" class="mt-4">
              <v-textarea v-model="entry.description" outlined rows="2" placeholder="ระบุรายละเอียดเพิ่มเติม"
                hide-details class="rounded-lg text-body-1" />
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
import Status from "@/components/global/Status.vue";
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
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
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
      mockEmpId: '61306',
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
        const response = await api.get("/api/ot", {
          params: { emp_id: this.mockEmpId }
        });
        if (response.data && response.data.status === 'success') {
          const employees = response.data.result;
          const flattenedEntries = [];

          employees.forEach(emp => {
            if (Array.isArray(emp.requests) && emp.requests.length > 0) {
              emp.requests.forEach(req => {
                const status = Number(req.status);
                // ดึงเฉพาะสถานะ 0 (Draft) หรือตามต้องการ
                if (status === 0) {
                  flattenedEntries.push({
                    date: req.created_at,
                    checkIn: req.start_time,
                    checkOut: req.end_time,
                    status: req.status,
                    description: req.description || "",
                    id: req.ot_id,
                    request_id: req.request_id,
                    emp_id: this.mockEmpId,
                    selected: false,
                  });
                }
              });
            }
          });
          this.allTimeEntries = flattenedEntries; // เก็บข้อมูลดิบทั้งหมด
          this.onSearch(); // กรองข้อมูลตามปีเดือนเริ่มต้น
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        this.loading = false;
      }
    },

    onSearch() {
      if (this.selectedYear && this.selectedMonth) {
        const targetYear = parseInt(this.selectedYear) - 543; // แปลงกลับเป็น ค.ศ.
        this.timeEntries = this.allTimeEntries.filter((entry) => {
          const d = new Date(entry.checkIn || entry.date); // ใช้ checkIn เป็นหลัก ถ้าไม่มีใช้ date
          const entryYear = d.getFullYear();
          // getMonth() คืนค่า 0-11, monthList index ตรงกันพอดี
          const entryMonthName = this.monthList[d.getMonth()];

          return entryYear === targetYear && entryMonthName === this.selectedMonth;
        });
      }
    },

    async simulateSwipeCard() {
      try {
        const now = new Date();
        const endTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const payload = {
          emp_id: this.mockEmpId,
          created_by: this.mockEmpId,
          start_time: this.formatToMySQL(now),
          end_time: this.formatToMySQL(endTime),
          description: "ลงเวลาเข้างาน (จำลอง)",
          type: 1,
          sts: 0
        };
        const response = await api.post('/api/ot', payload);
        if (response.data && response.data.status === 'success') {
          this.fetchTimeEntries();
        }
      } catch (err) {
        console.error("Simulation Error:", err);
        alert("เกิดข้อผิดพลาดในการจำลองรูดบัตร");
      }
    },

    formatToMySQL(date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    },

    async submitRequest() {
      const selectedItems = this.timeEntries.filter((e) => e.selected);
      if (selectedItems.length === 0) return;

      try {
        const res = await api.post("/api/ot/submit", {
          items: selectedItems.map(item => ({ id: item.id })),
          leader_emp_id: "head001"
        });
        if (res.data && res.data.status === 'success') {
          this.dialogConfirm = false;
          await this.fetchTimeEntries();
        }
      } catch (err) {
        console.error("Submit Error:", err);
        alert("เกิดข้อผิดพลาดในการส่งคำขอ");
      }
    },

    addOvertimeRequest() {
      this.overtimeMode = "create";
      this.selectedEntry = null;
      this.dialogOvertimeForm = true;
    },

    editOvertimeRequest(entry) {
      this.overtimeMode = "edit";
      this.selectedEntry = { ...entry };
      this.dialogOvertimeForm = true;
    },

    toggleSelectAll() {
      this.timeEntries.forEach((entry) => {
        entry.selected = this.selectAll;
      });
    },

    updateSelectAll() {
      this.selectAll = this.timeEntries.length > 0 && this.timeEntries.every((entry) => entry.selected);
    },

    handleSubmitOvertime(submit) {
      this.fetchTimeEntries();
    }
  }
};
</script>

<style scoped>
.custom-bg {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* เพิ่มขนาด Font ของ Label */
.label-text {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
}

/* ปรับ Input ให้ดูใหญ่ขึ้นเมื่อไม่มี dense */
.big-input ::v-deep .v-input__slot {
  min-height: 50px !important;
}

.big-input ::v-deep .v-select__selection {
  font-size: 16px !important;
}

/* ปุ่มใหญ่ */
.big-btn {
  font-size: 16px;
  letter-spacing: 0.5px;
}

/* --- Entry Card Styles --- */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* เพิ่มระยะห่างระหว่างการ์ด */
}

.entry-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  /* เพิ่ม Padding ภายในการ์ด */
  transition: all 0.2s ease;
}

/* 1. Desktop Style */
.desktop-card {
  border: 1px solid #0863B6;
  box-shadow: none;
}

/* 2. Mobile Style */
.mobile-card {
  position: relative;
  padding: 20px;
  padding-top: 50px;
}

/* --- Info Group --- */
.info-group {
  display: flex;
  align-items: center;
}

.info-label {
  color: #666;
  font-size: 16px;
  /* ใหญ่ขึ้น */
  min-width: 70px;
}

.info-sep {
  margin: 0 10px;
  color: #666;
  font-size: 16px;
}

.info-value {
  color: #333;
  font-size: 16px;
  /* ใหญ่ขึ้น */
}

.edit-btn-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  /* ปรับขนาดและระยะห่าง */
  padding: 8px 16px;
  border-radius: 8px;
  /* มุมมน */

  /* สีพื้นหลังและขอบเริ่มต้น */
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;

  /* เพิ่ม Transition ให้ดูลื่นไหล */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* เพิ่มเงาเล็กน้อยให้ดูมีมิติ */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Effect ตอนเอาเมาส์ไปชี้ (Hover) */
.edit-btn-container:hover {
  background-color: #F0F7FF;
  /* เปลี่ยนพื้นหลังเป็นสีฟ้าอ่อน */
  border-color: #0863B6;
  /* เปลี่ยนขอบเป็นสีน้ำเงิน */
  box-shadow: 0 4px 8px rgba(8, 99, 182, 0.15);
  /* เงาสีน้ำเงินฟุ้งๆ */
  transform: translateY(-2px);
  /* ลอยขึ้นเล็กน้อย */
}

/* Effect ตอนกดค้าง (Active) */
.edit-btn-container:active {
  transform: translateY(0);
  /* ยุบลง */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.edit-text {
  font-size: 14px;
  font-weight: 600;
  /* ตัวหนาขึ้น */
  color: #555555;
  margin-left: 6px;
  transition: color 0.2s;
}

/* เปลี่ยนสีข้อความตอน Hover ด้วย */
.edit-btn-container:hover .edit-text {
  color: #0863B6;
}


/* --- Edit Button --- */
.edit-btn-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  /* เพิ่มพื้นที่กด */
  border-radius: 8px;
  transition: background-color 0.2s;
  background-color: #f9f9f9;
  /* ใส่พื้นหลังจางๆ ให้รู้ว่าเป็นปุ่ม */
}

.edit-btn-wrapper:hover {
  background-color: #eef7ff;
}

.box-icon {
  padding: 4px;
  /* border: 1px solid #E0E0E0; เอาขอบออกเพื่อให้ดูคลีนขึ้น */
  background: transparent;
}

.edit-text {
  font-size: 15px;
  /* ใหญ่ขึ้น */
  margin-left: 6px;
}

/* --- Checkbox ใหญ่ --- */
.big-checkbox ::v-deep .v-icon {
  font-size: 28px !important;
  /* ไอคอนติ๊กถูกใหญ่ขึ้น */
}

/* --- Utilities --- */
.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 20px;
}

.gap-row {
  gap: 24px;
}

@media (max-width: 600px) {
  .mobile-card {
    position: relative;
    /* สำคัญมาก! เพื่อให้ปุ่มดินสออ้างอิงตำแหน่งจากกรอบนี้ */
    padding: 20px;
    padding-top: 50px;
    /* เว้นที่ด้านบนเพิ่มอีกนิด กันข้อความทับปุ่มดินสอ */
  }

  .edit-btn-container {
    position: absolute !important;
    top: 16px;
    right: 16px;

    /* ทำเป็นปุ่มวงกลม */
    background-color: #F0F7FF !important;
    /* สีพื้นหลังฟ้าอ่อนๆ */
    border: 1px solid #D6E4FF;
    /* เส้นขอบจางๆ */
    border-radius: 50%;
    /* ทำเป็นวงกลม */
    width: 40px;
    /* ความกว้าง */
    height: 40px;
    /* ความสูง */

    /* จัดไอคอนให้อยู่ตรงกลาง */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    /* ลบ Padding เดิม */

    /* เพิ่มเงาให้ดูลอยๆ น่ากด */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .edit-btn-wrapper {
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    padding: 8px;
  }

  .edit-btn-container .v-icon {
    font-size: 20px !important;
    color: #0863B6 !important;
    margin: 0 !important;
    /* ลบ margin เดิม */
  }

  .label-text,
  .value-text {
    font-size: 16px;
  }

  .time-highlight {
    font-size: 18px;
  }

  .entry-card {
    position: relative;
    padding-top: 50px;
    /* เว้นที่ด้านบนให้ปุ่ม Edit */
    padding-left: 16px;
    padding-right: 16px;
  }

  /* ในมือถือ ซ่อนคำว่า "แก้ไข..." ให้เหลือแต่ไอคอน แต่ขยายไอคอนให้กดง่าย */
  .edit-text {
    display: none;
  }

  .box-icon {
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    padding: 8px;
    /* พื้นที่กดไอคอนดินสอใหญ่ขึ้น */
    background: #fff;
  }
}
</style>