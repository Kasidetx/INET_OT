<template>
  <v-container fluid class="pa-6">
    <v-row no-gutters>
      <v-col cols="12" class="main-bg pa-6">
        <v-breadcrumbs class="px-0 mb-4" :items="breadcrumbs" />

        <!-- TOP STAT BOXES -->
        <v-row class="mb-4">
          <v-col
            cols="12"
            sm="6"
            md="2"
            v-for="(stat, i) in statsComputed"
            :key="i"
          >
            <v-card
              class="pa-4 stat-card"
              outlined
              elevation="0"
              :class="[
                { active: isStatActive(stat.label) },
                `${stat.color}-stat`,
              ]"
              @click="onStatClick(stat.label)"
            >
              <div class="d-flex align-center">
                <v-icon class="stat-icon mr-3" size="56" :color="stat.color">{{
                  stat.icon
                }}</v-icon>
                <div>
                  <div class="subtitle-2 grey--text">{{ stat.label }}</div>
                  <div class="headline font-weight-bold">{{ stat.value }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- SEARCH / FILTER -->
        <v-card class="pa-4 mb-4" outlined elevation="0">
          <v-row align="center" no-gutters>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="q"
                prepend-inner-icon="mdi-magnify"
                placeholder="ค้นหารายการ..."
                dense
                outlined
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="6" sm="3" class="px-2">
              <v-select
                v-model="filterCompany"
                :items="companies"
                label="บริษัท :"
                dense
                outlined
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="6" sm="2" class="px-2">
              <v-select
                v-model="filterYear"
                :items="years"
                label="ปี :"
                dense
                outlined
                hide-details
                clearable
              />
            </v-col>

            <v-col cols="12" sm="1" class="text-right pl-2">
              <v-btn color="primary" @click="onSearch" class="mt-1"
                >ค้นหา</v-btn
              >
            </v-col>
          </v-row>
        </v-card>

        <!-- TABLE LIST -->
        <v-card outlined elevation="0">
          <v-card-title
            class="pb-0 blue--text d-flex justify-space-between align-center"
          >
            <span>รายการเอกสาร {{ filteredItems.length }} รายการ</span>
            <v-btn
              v-if="selectedItems.length > 0"
              color="error"
              outlined
              small
              @click="onBulkCancel"
            >
              ยกเลิกคำร้องขอ
            </v-btn>
          </v-card-title>
          <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

          <!-- ERROR STATE -->
          <v-alert v-if="error" type="error" class="ma-4">
            ไม่สามารถโหลดข้อมูล: {{ error.message }}
          </v-alert>

          <!-- TABLE -->
          <v-simple-table v-if="!loading && paginatedItems.length > 0">
            <template #default>
              <thead>
                <tr class="blue lighten-5">
                  <th class="text-center" width="50">
                    <v-checkbox
                      v-model="selectAll"
                      @change="toggleSelectAll"
                      hide-details
                    />
                  </th>
                  <th class="text-left" width="50">{{ headers[0].text }}</th>
                  <th class="text-left">{{ headers[1].text }}</th>
                  <th class="text-left">{{ headers[2].text }}</th>
                  <th class="text-left">{{ headers[3].text }}</th>
                  <th class="text-left">{{ headers[4].text }}</th>
                  <th class="text-center">{{ headers[5].text }}</th>
                  <th class="text-center" width="80">{{ headers[6].text }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in paginatedItems" :key="index">
                  <td class="text-center">
                    <v-checkbox
                      v-model="selectedItems"
                      :value="item.id"
                      hide-details
                    />
                  </td>
                  <td class="font-weight-bold">
                    {{ index + 1 + (page - 1) * perPage }}
                  </td>
                  <td class="font-weight-medium">{{ item.request_no }}</td>
                  <td class="black--text">{{ item.title }}</td>
                  <td>
                    <div>{{ item.startDate }}</div>
                    <div class="black--text caption">{{ item.startTime }}</div>
                  </td>
                  <td>
                    <div>{{ item.endDate }}</div>
                    <div class="black--text caption">{{ item.endTime }}</div>
                  </td>
                  <td class="text-center">{{ item.hours }}</td>
                  <td class="text-center">
                    <v-chip
                      :color="statusColor(item.status)"
                      small
                      text-color="white"
                      label
                    >
                      {{ item.status }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <v-btn icon small @click="onView(item)" class="mr-1">
                      <v-icon small color="primary">mdi-eye</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>

          <!-- NO DATA STATE -->
          <v-card-text
            v-if="!loading && paginatedItems.length === 0"
            class="text-center grey--text"
          >
            ไม่พบรายการ
          </v-card-text>

          <!-- PAGINATION -->
          <v-card-actions
            v-if="filteredItems.length > 0"
            class="d-flex align-center justify-space-between pagination-controls pa-3"
          >
            <span class="black--text">จำนวนแถว</span>
            <div class="d-flex align-center">
              <v-select
                v-model="perPage"
                :items="[10, 20, 50]"
                dense
                hide-details
                outlined
                style="max-width: 80px"
                class="mr-3"
              />
              <span class="grey--text subtitle-2 mr-3 pagination-range">{{
                rangeText
              }}</span>

              <v-btn
                icon
                :disabled="page === 1"
                @click="page = Math.max(1, page - 1)"
                class="mr-2"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>

              <v-btn
                icon
                :disabled="page === pages"
                @click="page = Math.min(pages, page + 1)"
              >
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- VIEW DETAIL DIALOG -->
    <v-dialog v-model="viewDialog" max-width="600px">
      <v-card v-if="selectedItem">
        <v-card-title>
          รายะเอียดเอกสารคำร้องขอ
          <v-spacer></v-spacer>
          <v-btn icon small @click="viewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <div class="font-weight-bold mb-2">รายะเอียดเอกสาร</div>
            <v-card class="pa-4 grey lighten-5 mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">หมายเลขเอกสาร</span>
                <span class="font-weight-bold">{{
                  selectedItem.request_no
                }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">วันที่ยื่น</span>
                <span class="font-weight-bold">{{
                  selectedItem.startDate
                }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">เวลาเริ่ม</span>
                <span class="font-weight-bold">{{
                  selectedItem.startTime
                }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="grey--text">เวลาสิ้นสุด</span>
                <span class="font-weight-bold">{{ selectedItem.endTime }}</span>
              </div>
            </v-card>
          </div>

          <div class="mb-4">
            <div class="font-weight-bold mb-2">เหตุผลยืม</div>
            <v-textarea
              v-model="cancellationReason"
              outlined
              dense
              placeholder="บรรยายเหตุผลการยกเลิกคำร้องขอ"
              rows="4"
            />
          </div>

          <v-row class="w-100" no-gutters>
            <v-col cols="6" class="pr-1">
              <v-btn color="primary" outlined block @click="onApproveDetail">
                ยืนยัน
              </v-btn>
            </v-col>

            <v-col cols="6" class="pl-1">
              <v-btn color="error" outlined block @click="onCancelRequest">
                ยกเลิกคำร้องขอ
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import api from "../../service/api";

export default {
  name: "AttendancePage",
  data() {
    return {
      q: "",
      filterCompany: null,
      filterYear: null,
      filterStatus: null,
      perPage: 10,
      page: 1,

      // Dialog states
      viewDialog: false,
      selectedItem: null,
      cancellationReason: "",

      breadcrumbs: [
        { text: "หน้าหลัก", disabled: false },
        { text: "ลงเวลา", disabled: false },
        { text: "ลงเวลางาน", disabled: true },
      ],

      stats: [
        { icon: "mdi-file-document-outline", label: "ทั้งหมด", color: "blue" },
        { icon: "mdi-file-clock-outline", label: "รออนุมัติ", color: "orange" },
        {
          icon: "mdi-file-document-check-outline",
          label: "อนุมัติแล้ว",
          color: "green",
        },
        {
          icon: "mdi-file-document-remove-outline",
          label: "ไม่อนุมัติ",
          color: "red",
        },
        { icon: "mdi-file-cancel-outline", label: "ยกเลิก", color: "grey" },
      ],

      companies: [],
      years: [],

      headers: [
        { text: "ลำดับ", value: "index" },
        { text: "หมายเลขคำร้อง", value: "request_no" },
        { text: "รายละเอียด", value: "title" },
        { text: "วัน-เวลาที่เริ่ม", value: "start" },
        { text: "วัน-เวลาที่สิ้นสุด", value: "end" },
        { text: "จำนวนชั่วโมง", value: "hours" },
        { text: "สถานะ", value: "status" },
        { text: "", value: "actions" },
      ],

      attendanceRecords: [],
      loading: false,
      error: null,

      editDialog: false,
      editStep: 1,
      editDate: null,
      editTime: null,
      editingItem: null,
      selectedHour: null,
      selectedMinute: null,
      hours: Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      ),
      minutes: Array.from({ length: 60 }, (_, i) =>
        i.toString().padStart(2, "0")
      ),

      // New data properties for bulk actions
      selectedItems: [],
      selectAll: false,
    };
  },
  computed: {
    statsComputed() {
      const all = this.attendanceRecords.length;
      const counts = { รออนุมัติ: 0, อนุมัติแล้ว: 0, ไม่อนุมัติ: 0, ยกเลิก: 0 };

      this.attendanceRecords.forEach((r) => {
        if (r.status && counts.hasOwnProperty(r.status)) counts[r.status]++;
      });

      return this.stats.map((s) => {
        let value = s.label === "ทั้งหมด" ? all : counts[s.label] || 0;
        return { ...s, value };
      });
    },

    filteredItems() {
      let items = this.attendanceRecords.slice();
      if (this.q) {
        const q = this.q.toLowerCase();
        items = items.filter(
          (it) =>
            (it.request_no || "").toLowerCase().includes(q) ||
            (it.title || "").toLowerCase().includes(q) ||
            (it.company || "").toLowerCase().includes(q)
        );
      }
      if (this.filterCompany) {
        items = items.filter((it) => it.company === this.filterCompany);
      }
      if (this.filterYear) {
        items = items.filter(
          (it) => it.startDate && it.startDate.includes(this.filterYear)
        );
      }
      if (this.filterStatus) {
        items = items.filter((it) => it.status === this.filterStatus);
      }
      return items;
    },

    pages() {
      return Math.max(1, Math.ceil(this.filteredItems.length / this.perPage));
    },

    paginatedItems() {
      const start = (this.page - 1) * this.perPage;
      return this.filteredItems.slice(start, start + this.perPage);
    },

    rangeText() {
      const total = this.filteredItems.length;
      if (total === 0) return "0-0 of 0";
      const start = (this.page - 1) * this.perPage + 1;
      const end = Math.min(this.page * this.perPage, total);
      return `${start}-${end} of ${total}`;
    },
  },
  mounted() {
    this.fetchCompanies();
    this.fetchYears();
    this.fetchRecords();
  },
  methods: {
    isStatActive(label) {
      return this.filterStatus === label && label !== "ทั้งหมด";
    },
    onStatClick(label) {
      if (label === "ทั้งหมด") {
        this.filterStatus = null;
      } else {
        this.filterStatus = this.filterStatus === label ? null : label;
      }
      this.page = 1; // รีเซ็ตไปหน้า 1
    },
    getStatColorCode(color) {
      const colorMap = {
        blue: "#1e88e5",
        orange: "#fb8c00",
        green: "#43a047",
        red: "#e53935",
        grey: "#757575",
      };
      return colorMap[color] || "#1e88e5";
    },
    getStatBgColor(color) {
      const colorMap = {
        blue: "rgba(30, 136, 229, 0.1)",
        orange: "rgba(251, 140, 0, 0.1)",
        green: "rgba(67, 160, 71, 0.1)",
        red: "rgba(229, 57, 53, 0.1)",
        grey: "rgba(117, 117, 117, 0.1)",
      };
      return colorMap[color] || "rgba(30, 136, 229, 0.1)";
    },

    async fetchCompanies() {
      try {
        const res = await api.get(`/api/ot`);
        const uniqueCompanies = [
          ...new Set(res.data.map((item) => item.company).filter(Boolean)),
        ];
        this.companies = uniqueCompanies;
      } catch (err) {
        console.error("fetchCompanies error:", err);
      }
    },

    async fetchYears() {
      try {
        const res = await api.get(`/api/ot`);
        const yearSet = new Set();
        res.data.forEach((item) => {
          if (item.start_date) {
            const year = item.start_date.split("-")[0];
            if (year) yearSet.add(year);
          }
        });
        this.years = Array.from(yearSet).sort().reverse();
      } catch (err) {
        console.error("fetchYears error:", err);
      }
    },

    async fetchRecords() {
      this.loading = true;
      this.error = null;
      try {
        console.log("Fetching from:", `/api/ot`);
        const res = await api.get(`/api/ot`, { timeout: 8000 });

        const rawData = res.data.data || res.data;

        console.log(
          "Success:",
          Array.isArray(rawData) ? rawData.length : rawData
        );

        this.attendanceRecords = Array.isArray(rawData)
          ? rawData.map((item) => ({
              id: item.id,
              request_no: item.request_no || `OT-${item.id}`,
              title: item.description || "-",
              company: item.company || "N/A",
              startDate: item.start_time
                ? this.formatISODate(item.start_time)
                : "-",
              startTime: item.start_time
                ? this.formatISOTime(item.start_time)
                : "-",
              endDate: item.end_time ? this.formatISODate(item.end_time) : "-",
              endTime: item.end_time ? this.formatISOTime(item.end_time) : "-",
              hours: `${item.total || 0} ชั่วโมง`,
              status: item.status || "รออนุมัติ",
            }))
          : [];

        console.log("✨ Mapped records:", this.attendanceRecords);
      } catch (err) {
        console.error("Full error:", err);
        this.error = {
          message:
            err.response?.data?.message || err.message || "Network Error",
        };
      } finally {
        this.loading = false;
      }
    },

    formatISODate(isoString) {
      if (!isoString) return "";
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },

    formatISOTime(isoString) {
      if (!isoString) return "";
      const date = new Date(isoString);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}.${minutes} น.`;
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      return timeStr.slice(0, 5).replace(":", ".") + " น.";
    },

    onSearch() {
      this.page = 1;
    },

    statusColor(status) {
      const colors = {
        อนุมัติแล้ว: "success",
        รออนุมัติ: "warning",
        ไม่อนุมัติ: "error",
        ยกเลิก: "grey",
      };
      return colors[status] || "primary";
    },

    onView(item) {
      this.selectedItem = item;
      this.cancellationReason = "";
      this.viewDialog = true;
    },

    onApproveDetail() {
      console.log("อนุมัติ:", this.selectedItem);
      alert("อนุมัติสำเร็จ");
      this.viewDialog = false;
    },

    async onCancelRequest() {
      if (!this.cancellationReason.trim()) {
        alert("กรุณาระบุเหตุผลการยกเลิก");
        return;
      }

      try {
        // ส่งคำขอยกเลิกไปยัง API
        await api.put(`/api/ot/${this.selectedItem.id}`, {
          status: "ยกเลิก",
          cancellation_reason: this.cancellationReason,
        });

        alert("ยกเลิกคำร้องขอสำเร็จ");
        this.viewDialog = false;
        this.fetchRecords(); // รีโหลดข้อมูล
      } catch (err) {
        console.error("Cancel error:", err);
        alert("ยกเลิกล้มเหลว: " + (err.response?.data?.message || err.message));
      }
    },

    onEdit(item) {
      this.editingItem = item;
      this.editDate = null;
      this.editTime = null;
      this.selectedHour = null;
      this.selectedMinute = null;
      this.editStep = 1;
      this.editDialog = true;
    },

    closeEditDialog() {
      this.editDialog = false;
      this.editingItem = null;
      this.editDate = null;
      this.editTime = null;
      this.selectedHour = null;
      this.selectedMinute = null;
      this.editStep = 1;
    },

    async saveEdit() {
      this.editTime = `${this.selectedHour}:${this.selectedMinute}`;
      try {
        await api.put(`/api/ot/${this.editingItem.id}`, {
          start_date: this.editDate,
          start_time: this.editTime,
        });
        console.log("บันทึกการแก้ไขสำเร็จ");
        this.fetchRecords();
      } catch (err) {
        console.error("saveEdit error:", err);
        alert("บันทึกล้มเหลว: " + (err.response?.data?.message || err.message));
      }
      this.closeEditDialog();
    },

    toggleSelectAll() {
      this.selectedItems = this.selectAll
        ? this.paginatedItems.map((item) => item.id)
        : [];
    },

    async onBulkCancel() {
      if (this.selectedItems.length === 0) {
        return;
      }

      const confirmed = confirm(
        `คุณแน่ใจที่จะยกเลิกคำร้องขอ ${this.selectedItems.length} รายการนี้?`
      );
      if (!confirmed) {
        return;
      }

      try {
        await Promise.all(
          this.selectedItems.map((id) =>
            api.put(`/api/ot/${id}`, { status: "ยกเลิก" })
          )
        );
        alert("ยกเลิกคำร้องขอสำเร็จ");
        this.selectedItems = [];
        this.fetchRecords();
      } catch (err) {
        console.error("Bulk cancel error:", err);
        alert("ยกเลิกคำร้องขอล้มเหลว");
      }
    },
  },
};
</script>

<style scoped>
.main-bg {
  background-color: #f5f7fb;
  min-height: 100vh;
}

.stat-card {
  border-radius: 8px;
  border: 1px solid #e8eef7 !important;
  transition: all 0.3s ease;
  cursor: pointer;

  padding: 24px !important;
  min-height: 110px;
  display: flex;
  align-items: center;
}
.stat-card .subtitle-2 {
  font-size: 1.5rem; /* เพิ่มขนาดป้ายชื่อ */
}

.stat-card .headline {
  font-size: 1.25rem; /* เพิ่มขนาดตัวเลข */
  line-height: 0.9;
  padding: 17px;
}

/* ปรับขนาดไอคอน (สำรอง ถ้าต้องการ override) */
.stat-icon {
  opacity: 0.95;
  font-size: 80px !important;
  width: 56px;
  height: 56px;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-card.active.blue-stat {
  border: 2px solid #1e88e5 !important;
  box-shadow: 0 6px 18px rgba(30, 136, 229, 0.25);
  background-color: #e3f2fd !important;
}

.stat-card.active.orange-stat {
  border: 2px solid #fb8c00 !important;
  box-shadow: 0 6px 18px rgba(251, 140, 0, 0.25);
  background-color: #fff3e0 !important;
}

.stat-card.active.green-stat {
  border: 2px solid #43a047 !important;
  box-shadow: 0 6px 18px rgba(67, 160, 71, 0.25);
  background-color: #e8f5e9 !important;
}

.stat-card.active.red-stat {
  border: 2px solid #e53935 !important;
  box-shadow: 0 6px 18px rgba(229, 57, 53, 0.25);
  background-color: #ffebee !important;
}

.stat-card.active.grey-stat {
  border: 2px solid #757575 !important;
  box-shadow: 0 6px 18px rgba(117, 117, 117, 0.18);
  background-color: #f5f5f5 !important;
}

/* Pagination: ขยับไปด้านขวา และ responsive */
.pagination-controls {
  justify-content: space-between !important;
}
.pagination-range {
  min-width: 110px;
  text-align: right;
}

/* mobile: กลับมาอยู่กลางเมื่อหน้าจอเล็ก */
@media (max-width: 600px) {
  .pagination-controls {
    justify-content: center !important;
    padding: 8px !important;
  }
  .pagination-range {
    min-width: 80px;
    text-align: center;
  }
}

/* ปรับสำหรับมือถือ ให้ไม่ใหญ่มาก */
@media (max-width: 600px) {
  .stat-card {
    padding: 12px !important;
    min-height: 84px;
  }
  .stat-icon {
    font-size: 40px !important;
    width: 40px;
    height: 40px;
  }
  .stat-card .headline {
    font-size: 1.05rem;
  }
}

.gap-2 {
  gap: 8px;
}

.pagination-controls {
  justify-content: space-between !important;
}

@media (max-width: 600px) {
  .pagination-controls {
    flex-direction: column;
    justify-content: center !important;
    gap: 12px;
  }
}
</style>
