<template>
  <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
      <v-breadcrumbs class="px-0 mb-4" :items="breadcrumbs" />

      <StatsGrid :stats="stats" :current-filter="filterStatus" @update:filter="onStatClick" />

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
      <DialogRequestDetail v-model="viewDialog" :item="selectedItem" :details="relatedItems"
        :loading="loadingDetails" />
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
import DialogRequestDetail from "@/components/overtimerequest/DialogRequestDetail.vue";
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
    DialogCancelRequest,
    DialogRequestDetail,
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

      mockEmpId: '61306',

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
        const response = await api.get(`api/ot/request`, {
          params: {
            emp_id: this.mockEmpId
          }
        });

        if (response.data && response.data.status === 'success') {
          const rawData = response.data.result;
          const groups = {};

          // Grouping
          rawData.forEach(item => {
            const key = item.request_id || `REQ-${item.id}`;
            if (!groups[key]) {
              groups[key] = { items: [], totalHours: 0 };
            }

            // ❌ แก้ไขจุดที่ 1: เปลี่ยน item.total เป็น item.duration
            // (หรือใช้ || เพื่อรองรับทั้งแบบเก่าและใหม่)
            const hours = parseFloat(item.duration || item.total) || 0;

            groups[key].items.push(item);
            groups[key].totalHours += hours;
          });

          // Mapping
          const records = Object.values(groups).map(g => {
            const first = g.items[0];

            const statusId = Number(first.status);

            const totalH = g.totalHours;
            const formattedHours = Number.isInteger(totalH) ? totalH : totalH.toFixed(2);

            // Count Stats
            this.stats[0].count++;
            if (statusId === 1) this.stats[1].count++;
            else if (statusId === 2) this.stats[2].count++;
            else if (statusId === 3) this.stats[3].count++;
            else if (statusId === 4) this.stats[4].count++;
            else if (statusId === 5) this.stats[5].count++;
            else if (statusId === 6) this.stats[6].count++;

            return {
              id: first.id || first.ot_id, // รองรับชื่อจาก SP
              request_no: first.request_id || "-",
              docs_no: first.doc_no || first.docs_no || "-", // รองรับชื่อจาก SP
              title: first.description || "-", // SP ส่งมาเป็น description

              startDate: this.$formatDate(first.start_time),
              startTime: this.$formatTime(first.start_time),
              endDate: this.$formatDate(first.end_time),
              endTime: this.$formatTime(first.end_time),

              hours: `${formattedHours} ชั่วโมง`,
              status: statusId,

              // ✅ ใส่ค่า Reason ใหม่
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
            id: c.ot_id,
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