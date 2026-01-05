<template>
  <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
      <v-breadcrumbs class="px-0 mb-4" :items="breadcrumbs" />

      <v-row class="mb-6">
        <StatsGrid :stats="stats" :current-filter="filterStatus" @update:filter="onStatClick" />
      </v-row>

      <FilterToolbar v-model="q" placeholder="ค้นหารายการ, เลขเอกสาร, รายละเอียด...">
        <template #filters>
          <v-col cols="auto" class="px-2">
            <v-select v-model="filterYear" :items="years" label="ปี :" dense outlined hide-details clearable
              background-color="#F7F9FC" class="rounded-lg" style="width: 120px;" />
          </v-col>
        </template>
      </FilterToolbar>

      <RequestTable :items="filteredItems" :loading="loading" :selected.sync="selectedItems"
        :show-select="filterStatus === 'pending_head' || filterStatus === 'pending_hr'" @view="onView"
        @bulk-cancel="onBulkCancel" />

      <DialogCancelRequest v-model="cancelDialog" :items="itemsToCancel" @confirm="confirmCancelRequest" />

      <v-dialog v-model="viewDialog" max-width="900px">
        <v-card v-if="selectedItem" class="rounded-lg">
          <v-card-title class="blue lighten-5 d-flex justify-center py-4 relative" style="position: relative;">
            <span class="headline font-weight-bold blue--text text--darken-3">รายละเอียดเบิกค่าล่วงเวลา</span>
            <v-btn icon absolute right top @click="viewDialog = false" class="mt-3 mr-3">
              <v-icon color="grey darken-2">mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <div class="subtitle-1 font-weight-bold mb-6 black--text">รายละเอียดเอกสาร</div>

            <v-row class="mb-2">
              <v-col cols="12" md="6" class="py-1">
                <v-row no-gutters>
                  <v-col cols="4" class="black--text text--darken-1">หมายเลขเอกสาร</v-col>
                  <v-col cols="1" class="text-center">:</v-col>
                  <v-col cols="7" class="font-weight-medium black--text">{{ selectedItem.docs_no }}</v-col>
                </v-row>
              </v-col>
              <v-col cols="12" md="6" class="py-1">
                <v-row no-gutters>
                  <v-col cols="5" class="black--text text--darken-1 text-right pr-4">จำนวนชั่วโมงทั้งหมด</v-col>
                  <v-col cols="1" class="text-center">:</v-col>
                  <v-col cols="6" class="font-weight-medium black--text">{{ selectedItem.hours }}</v-col>
                </v-row>
              </v-col>
              <v-col cols="12" class="py-1">
                <v-row no-gutters>
                  <v-col cols="2" class="black--text text--darken-1" style="max-width: 140px;">หมายเหตุ</v-col>
                  <v-col cols="1" class="text-center" style="max-width: 40px;">:</v-col>
                  <v-col class="black--text">
                    {{ selectedItem.status === 6 ? (selectedItem.cancellation_reason || 'ยกเลิกคำร้องขอเบิกค่าล่วงเวลา')
                      :
                      (selectedItem.title || '-') }}
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-card outlined elevation="0" class="mt-4 rounded-lg overflow-hidden">
              <v-simple-table>
                <template v-slot:default>
                  <thead class="grey lighten-5">
                    <tr>
                      <th class="text-center font-weight-bold black--text subtitle-2 py-3">ลำดับ</th>
                      <th class="text-left font-weight-bold black--text subtitle-2">วันที่</th>
                      <th class="text-left font-weight-bold black--text subtitle-2">เวลาที่เริ่ม</th>
                      <th class="text-left font-weight-bold black--text subtitle-2">เวลาที่สิ้นสุด</th>
                      <th class="text-center font-weight-bold black--text subtitle-2">อัตราค่าล่วงเวลา</th>
                      <th class="text-left font-weight-bold black--text subtitle-2">จำนวนชั่วโมง</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(detail, i) in relatedItems" :key="i">
                      <td class="text-center grey--text">{{ i + 1 }}</td>
                      <td class="grey--text text--darken-2">{{ detail.date }}</td>
                      <td class="grey--text text--darken-2">{{ detail.startTime }}</td>
                      <td class="grey--text text--darken-2">{{ detail.endTime }}</td>
                      <td class="text-center grey--text text--darken-2">
                        <v-chip small :color="getRateColor(detail.rate)" dark class="font-weight-bold">
                          {{ detail.rate }} เท่า
                        </v-chip>
                      </td>
                      <td class="text-center grey--text text--darken-2">{{ detail.hours }}</td>
                    </tr>
                    <tr v-if="loadingDetails">
                      <td colspan="6" class="text-center pa-4">กำลังโหลดข้อมูล...</td>
                    </tr>
                    <tr v-if="!loadingDetails && relatedItems.length === 0">
                      <td colspan="6" class="text-center pa-4 grey--text">ไม่พบข้อมูลรายละเอียด</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card>

            <div class="d-flex justify-center mt-8">
              <v-btn color="#0d47a1" dark depressed width="140" height="44" class="rounded-lg title font-weight-regular"
                style="font-size: 1rem !important;" @click="viewDialog = false">
                ปิด
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="successDialog" max-width="500px">
        <v-card class="rounded-lg text-center pb-6">
          <v-card-title class="blue lighten-5 py-3 relative justify-center mb-6">
            <div class="font-weight-bold blue--text text--darken-2 title">
              ยกเลิกคำร้องขอ
            </div>
            <v-btn icon absolute right top @click="successDialog = false" class="mt-1 mr-1">
              <v-icon color="blue darken-2">mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div class="mb-4 d-flex justify-center">
              <div
                style="background-color: #66bb6a; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                <v-icon size="50" color="white">mdi-check</v-icon>
              </div>
            </div>
            <div class="headline font-weight-bold blue--text text--darken-3 px-4">
              คุณได้ทำการยกเลิกส่งคำขอเบิกค่าล่วงเวลาเรียบร้อยแล้ว
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

    </v-main>
  </v-app>
</template>

<script>
import api from "@/service/api";
import Status from "@/components/global/Status.vue";
import StatsGrid from "@/components/global/StatsGrid.vue";
import FilterToolbar from "@/components/global/FilterToolbar.vue";
import RequestTable from "@/components/overtimerequest/RequestTable.vue";
import DialogCancelRequest from "@/components/overtimerequest/DialogCancelRequest.vue";

const API_URL = process.env.VUE_APP_API_URL || "http://localhost:5500/api";

export default {
  name: "AttendancePage",
  components: {
    Status,
    StatsGrid,
    FilterToolbar,
    RequestTable,
    DialogCancelRequest
  },

  data() {
    return {
      loading: false,
      loadingDetails: false,
      error: null,
      breadcrumbs: [],

      // Filter
      q: "",
      filterYear: null,
      filterStatus: "all",

      // Data
      attendanceRecords: [],
      years: [],
      selectedItems: [], // ID ที่ถูกเลือกจาก Table

      // Stats Config
      stats: [
        { label: 'ทั้งหมด', filterKey: 'all', count: 0, icon: 'mdi-file-document-outline', color: '#1565C0', bg: '#E3F2FD' },
        { label: 'รอหัวหน้าอนุมัติ', filterKey: 'pending_head', count: 0, icon: 'mdi-account-clock-outline', color: '#D97706', bg: '#FFF7ED' },
        { label: 'รอ HR อนุมัติ', filterKey: 'pending_hr', count: 0, icon: 'mdi-briefcase-clock-outline', color: '#EAB308', bg: '#FEFCE8' },
        { label: 'อนุมัติ', filterKey: 'approved', count: 0, icon: 'mdi-check-circle-outline', color: '#16A34A', bg: '#DCFCE7' },
        { label: 'หัวหน้าไม่อนุมัติ', filterKey: 'rejected_head', count: 0, icon: 'mdi-account-remove-outline', color: '#EF4444', bg: '#FFEBEE' },
        { label: 'HR ไม่อนุมัติ', filterKey: 'rejected_hr', count: 0, icon: 'mdi-close-circle-outline', color: '#DC2626', bg: '#FEF2F2' },
        { label: 'ยกเลิก', filterKey: 'cancelled', count: 0, icon: 'mdi-file-hidden', color: '#4B5563', bg: '#F3F4F6' },
      ],

      // Dialogs
      viewDialog: false,
      cancelDialog: false,
      successDialog: false,

      selectedItem: null,
      relatedItems: [],
      itemsToCancel: [],
      cancellationReason: "",
    };
  },

  computed: {
    filteredItems() {
      let items = this.attendanceRecords.slice();

      // 1. กรองคำค้นหา
      if (this.q) {
        const q = this.q.toLowerCase();
        items = items.filter(
          (it) =>
            (it.docs_no || "").toLowerCase().includes(q) ||
            (it.request_no || "").toLowerCase().includes(q) ||
            (it.title || "").toLowerCase().includes(q)
        );
      }

      // 2. กรองปี
      if (this.filterYear) {
        items = items.filter(
          (it) => it.startDate && it.startDate.includes(this.filterYear)
        );
      }

      // 3. กรองสถานะ
      if (this.filterStatus && this.filterStatus !== 'all') {
        const STATUS_MAP = {
          pending_head: [1],
          pending_hr: [2],
          approved: [3],
          rejected_head: [4],
          rejected_hr: [5],
          cancelled: [6],
        };
        const targetIds = STATUS_MAP[this.filterStatus] || [];
        items = items.filter((it) => targetIds.includes(Number(it.status)));
      }

      return items;
    }
  },

  watch: {
    q() { this.resetSelection(); },
    filterYear() { this.resetSelection(); },
    filterStatus() { this.resetSelection(); }
  },

  mounted() {
    this.fetchRecords();
  },

  methods: {
    // --- Data Fetching ---
    async fetchRecords() {
      this.loading = true;
      this.error = null;
      this.resetStats();

      try {
        const response = await api.get(`api/ot/request`);

        if (response.data && response.data.status === 'success') {
          const rawData = response.data.result;
          const groups = {};

          // Grouping
          rawData.forEach(item => {
            const key = item.request_id || `REQ-${item.id}`;
            if (!groups[key]) {
              groups[key] = { items: [], totalHours: 0 };
            }
            const hours = parseFloat(item.total) || 0;
            groups[key].items.push(item);
            groups[key].totalHours += hours;
          });

          // Mapping
          const records = Object.values(groups).map(g => {
            const first = g.items[0];
            const totalH = g.totalHours;
            const formattedHours = Number.isInteger(totalH) ? totalH : totalH.toFixed(2);
            const statusId = Number(first.sts);

            // Count Stats
            this.stats[0].count++;
            if (statusId === 1) this.stats[1].count++;
            else if (statusId === 2) this.stats[2].count++;
            else if (statusId === 3) this.stats[3].count++;
            else if (statusId === 4) this.stats[4].count++;
            else if (statusId === 5) this.stats[5].count++;
            else if (statusId === 6) this.stats[6].count++;

            return {
              id: first.id,
              request_no: first.request_id || "-",
              docs_no: first.doc_no || first.docs_no || "-",
              title: first.description || "-",
              startDate: this.$formatDate(first.start_time),
              startTime: this.$formatTime(first.start_time),
              endDate: this.$formatDate(first.end_time),
              endTime: this.$formatTime(first.end_time),
              hours: `${formattedHours} ชั่วโมง`,
              status: statusId,
              cancellation_reason: first.cancellation_reason,
              children: g.items
            };
          });

          this.attendanceRecords = records.sort((a, b) => a.id - b.id);

          // Years List
          const yearSet = new Set();
          rawData.forEach(r => {
            if (r.start_time) {
              const y = new Date(r.start_time).getFullYear();
              if (y) yearSet.add(String(y));
            }
          });
          this.years = Array.from(yearSet).sort().reverse();
        }
      } catch (err) {
        console.error("API Error:", err);
        this.error = { message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้" };
      } finally {
        this.loading = false;
      }
    },

    getRateColor(rate) {
      const r = parseFloat(rate);
      if (r >= 3.0) return 'red lighten-1';
      if (r >= 1.5) return 'orange lighten-1';
      return 'green lighten-1';
    },

    // --- State Management ---
    onStatClick(filterKey) {
      this.filterStatus = filterKey;
    },

    resetStats() {
      this.stats.forEach(s => s.count = 0);
    },

    resetSelection() {
      this.selectedItems = [];
    },

    // --- View Detail ---
    async onView(item) {
      this.selectedItem = item;
      this.viewDialog = true;
      this.relatedItems = [];
      this.loadingDetails = true;

      try {
        const response = await api.get(`api/ot/${item.id}/details`);

        if (response.data && response.data.status === 'success') {
          const details = response.data.result.details || [];
          this.relatedItems = details.map((d) => ({
            date: this.$formatDate(d.ot_start_time),
            startTime: this.$formatTime(d.ot_start_time),
            endTime: this.$formatTime(d.ot_end_time),
            rate: d.ot_rate,   // ค่า rate จาก DB จะถูกดึงมาตรงนี้
            hours: d.ot_hour
          }));
        }
      } catch (err) {
        console.error("Error fetching details:", err);
        // ... (fallback code เดิม)
      } finally {
        this.loadingDetails = false;
      }
      this.cancellationReason = "";
    },

    // --- Cancel Logic ---
    async onBulkCancel() {
      if (this.selectedItems.length === 0) return;

      const groupItems = this.attendanceRecords.filter(r => this.selectedItems.includes(r.id));
      let allChildren = [];

      groupItems.forEach(group => {
        if (group.children) {
          allChildren = allChildren.concat(group.children.map(c => ({
            id: c.id,
            request_no: c.request_id,
            docs_no: c.doc_no,
            startDate: this.$formatDate(c.start_time),
            startTime: this.$formatTime(c.start_time),
            endTime: this.$formatTime(c.end_time)
          })));
        }
      });

      this.cancellationReason = "";
      this.itemsToCancel = allChildren;
      this.cancelDialog = true;
    },

    async onCancelRequest() {
      this.cancellationReason = "";

      if (this.selectedItem) {
        if (this.selectedItem.children) {
          this.itemsToCancel = this.selectedItem.children.map(c => ({
            id: c.id,
            request_no: c.request_id,
            // 🔥 Map docs_no จากแม่
            docs_no: c.doc_no || this.selectedItem.docs_no,
            startDate: this.$formatDate(c.start_time),
            startTime: this.$formatTime(c.start_time),
            endTime: this.$formatTime(c.end_time)
          }));
        } else {
          this.itemsToCancel = [this.selectedItem];
        }
      }

      this.viewDialog = false;
      this.cancelDialog = true;
    },

    async confirmCancelRequest(reason) {
      // รับ reason มาจาก Dialog Component หรือใช้ this.cancellationReason
      const reasonText = reason || this.cancellationReason;

      if (!reasonText.trim()) return;

      try {
        const nextStatus = 6;
        await Promise.all(this.itemsToCancel.map(item => {
          return api.put(`/api/ot/${item.id}`, {
            sts: nextStatus,
            cancellation_reason: reasonText
            // ส่ง reason ไปด้วยเผื่อ Backend รองรับการบันทึกเหตุผล
          });
        }));

        const cancelledRequestIds = new Set(this.itemsToCancel.map(i => i.request_no));

        // Update Local State (เพื่อให้ UI เปลี่ยนทันทีไม่ต้องรอโหลดใหม่)
        this.attendanceRecords.forEach(r => {
          if (cancelledRequestIds.has(r.request_no)) {
            r.status = 6; // 6 = ยกเลิก
            r.cancellation_reason = reasonText;
            if (r.children) {
              r.children.forEach(c => c.ot_status = 6);
            }
          }
        });

        // Recalculate Stats after cancel
        // (Optional: หรือจะเรียก fetchRecords() ใหม่ก็ได้ถ้าต้องการชัวร์)
        this.fetchRecords();

        this.cancelDialog = false;
        this.selectedItems = [];
        this.successDialog = true;

      } catch (err) {
        console.error("Cancel error:", err);
        alert("ยกเลิกล้มเหลว");
      }
    },
  },
};
</script>