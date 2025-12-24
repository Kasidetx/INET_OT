<template>
  <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
        <v-breadcrumbs class="px-0 mb-4" :items="breadcrumbs" />

        <!-- ส่วนแสดงสถิติด้านบน -->
        <v-row class="mb-6">
          <v-col 
            cols="12" 
            sm="6"
            md 
            v-for="(stat, index) in statsComputed" 
            :key="index"
          >
            <v-hover v-slot="{ hover }">
              <v-card 
                class="pa-6 rounded-xl d-flex align-center transition-swing"
                :elevation="hover ? 6 : 0"
                :style="`border: 1px solid ${isStatActive(stat.label) ? stat.borderColor : '#E0E0E0'}; height: 100%; background: white; transform: ${isStatActive(stat.label) ? 'scale(1.02)' : 'scale(1)'}`"
                @click="onStatClick(stat.label)"
                style="cursor: pointer; transition: all 0.2s;"
              >
                <div 
                  class="rounded-lg d-flex justify-center align-center mr-6 elevation-0"
                  :style="`background-color: ${stat.bg}; width: 80px; height: 80px; min-width: 80px; border: 1px solid ${stat.borderColor}`"
                >
                  <v-icon size="40" :color="stat.iconColor">{{ stat.icon }}</v-icon>
                </div>
                
                <div class="flex-grow-1">
                  <div class="text-h4 font-weight-bold mb-1" style="color: #2D3748; line-height: 1.2;">
                    {{ stat.count }}
                  </div>
                  <div class="subtitle-1 font-weight-medium grey--text text--darken-1">
                    {{ stat.label }}
                  </div>
                </div>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>

        <v-card class="pa-4 mb-4" flat color="transparent">
          <v-row align="center" no-gutters>
            <v-col cols="12" sm>
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

            <v-col cols="auto" class="px-2">
              <v-select
                v-model="filterYear"
                :items="years"
                label="ปี :"
                dense
                outlined
                hide-details
                clearable
                style="width: 120px;"
              />
            </v-col>

            <v-col cols="auto">
              <v-btn color="primary" @click="onSearch" class="mt-1"
                >ค้นหา</v-btn
              >
            </v-col>
          </v-row>
        </v-card>

        <!-- ตารางแสดงรายการ -->
        <v-card outlined elevation="0" class="white">
          <v-card-title class="pb-4 blue--text d-flex justify-space-between align-center">
            <span>รายการเอกสาร {{ filteredItems.length }} รายการ</span>
            <div v-if="selectedItems.length > 0">
                <v-btn
                  color="#1565c0"
                  dark
                  depressed
                  @click="onBulkCancel"
                  class="rounded-lg px-6 subtitle-2"
                  height="40"
                >
                  ยกเลิกคำร้องขอ
                </v-btn>
            </div>
          </v-card-title>
          <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

          <!-- ส่วนแสดงข้อผิดพลาด -->
          <v-alert v-if="error" type="error" class="ma-4">
            ไม่สามารถโหลดข้อมูล: {{ error.message }}
          </v-alert>

          <!-- ตารางข้อมูล -->
          <v-simple-table v-if="!loading && paginatedItems.length > 0">
            <template #default>
              <thead>
                <tr class="blue lighten-5">
                  <th class="text-center" width="50">
                    <v-checkbox
                      v-model="selectAll"
                      @change="toggleSelectAll"
                      hide-details
                      class="mt-0 pt-0"
                    />
                  </th>
                  <th class="text-left" width="50">{{ headers[0].text }}</th>
                  <th class="text-left">{{ headers[1].text }}</th>
                  <th class="text-left">{{ headers[2].text }}</th>
                  <th class="text-left">{{ headers[3].text }}</th>
                  <th class="text-left">{{ headers[4].text }}</th>
                  <th class="text-center">{{ headers[5].text }}</th>
                  <th class="text-center">{{ headers[6].text }}</th>
                  <th class="text-center" width="80">{{ headers[7].text }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in paginatedItems" :key="item.id">
                  <td class="text-center">
                    <v-checkbox
                      v-model="selectedItems"
                      :value="item.id"
                      hide-details
                      class="mt-0 pt-0"
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
                    <Status :value="item.statusCode" />
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

          <!-- ส่วนแสดงเมื่อไม่มีข้อมูล -->
          <div v-if="!loading && paginatedItems.length === 0" class="text-center pa-8">
            <v-img
              :src="require('@/assets/img/Delete.png')" 
              max-width="120"
              class="mx-auto mb-4"
              contain
            ></v-img>
            <div class="headline font-weight-bold blue--text text--darken-2 mb-2">ขออภัย</div>
            <div class="blue--text subtitle-1">ไม่มีรายการเอกสารคำขอเบิกค่าล่วงเวลา</div>
          </div>

          <!-- ส่วนจัดการหน้า (Pagination) -->
          <v-card-actions v-if="filteredItems.length > 0" class="d-flex align-center justify-space-between pagination-controls pa-3">
            <span class="black--text">จำนวนแถว</span>
            <div class="d-flex align-center">
              <v-select
                v-model="perPage"
                :items="[10, 20, 50]"
                dense
                hide-details
                outlined
                style="max-width:80px"
                class="mr-3"
              />
              <span class="grey--text subtitle-2 mr-3 pagination-range">{{ rangeText }}</span>

              <v-btn icon :disabled="page === 1" @click="page = Math.max(1, page - 1)" class="mr-2">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>

              <v-btn icon :disabled="page === pages" @click="page = Math.min(pages, page + 1)">
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>


    <!-- กล่องโต้ตอบรายละเอียด (Dialog) -->
    <v-dialog v-model="viewDialog" max-width="900px">
      <v-card v-if="selectedItem" class="rounded-lg">
        <!-- ส่วนหัว -->
        <v-card-title class="blue lighten-5 d-flex justify-center py-4 relative" style="position: relative;">
          <span class="headline font-weight-bold blue--text text--darken-3">รายละเอียดเบิกค่าล่วงเวลา</span>
          <v-btn icon absolute right top @click="viewDialog = false" class="mt-3 mr-3">
            <v-icon color="grey darken-2">mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="subtitle-1 font-weight-bold mb-6 black--text">รายละเอียดเอกสาร</div>

          <!-- ส่วนข้อมูลทั่วไป -->
          <v-row class="mb-2">
            <v-col cols="12" md="6" class="py-1">
              <v-row no-gutters>
                <v-col cols="4" class="black--text text--darken-1">หมายเลขเอกสาร</v-col>
                <v-col cols="1" class="text-center">:</v-col>
                <v-col cols="7" class="font-weight-medium black--text">{{ selectedItem.request_no }}</v-col>
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
                  {{ selectedItem.status === 'ยกเลิก' ? (selectedItem.cancellation_reason || 'ยกเลิกคำร้องขอเบิกค่าล่วงเวลา') : (selectedItem.title || '-') }}
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <!-- ส่วนตารางรายละเอียด -->
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
                    <td class="grey--text text--darken-2">{{ detail.startDate }}</td>
                    <td class="grey--text text--darken-2">{{ detail.startTime ? detail.startTime.replace('.', ':').replace(' น.', '') : '-' }}</td>
                    <td class="grey--text text--darken-2">{{ detail.endTime ? detail.endTime.replace('.', ':').replace(' น.', '') : '-' }}</td>
                    <td class="text-center grey--text text--darken-2">1.5</td>
                    <td class="grey--text text--darken-2">{{ detail.hours }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card>

          <!-- ปุ่มด้านล่าง -->
          <div class="d-flex justify-center mt-8">
            <v-btn
              color="#0d47a1"
              dark
              depressed
              width="160"
              height="44"
              class="rounded-lg title font-weight-regular"
              style="font-size: 1rem !important;"
              @click="viewDialog = false"
            >
              ปิด
            </v-btn>
          </div>

        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- กล่องยืนยันการยกเลิก -->
    <v-dialog v-model="cancelDialog" max-width="600px">
      <v-card class="rounded-lg">
        <v-card-title class="blue lighten-5 py-3 relative" style="position: relative;">
          <div style="width: 100%; text-align: center;" class="font-weight-bold blue--text text--darken-2 title">
            ยกเลิกคำร้องขอ
          </div>
          <v-btn icon absolute right top @click="cancelDialog = false" class="mt-1 mr-1">
            <v-icon color="blue darken-2">mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="text-center pt-6 px-6">
          <div class="subtitle-1 font-weight-bold blue--text text--darken-2 mb-1">
            ต้องการยกเลิกคำร้องขอใช่หรือไม่
          </div>
          <div class="black--text mb-6">วันนี้คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำร้องขอ</div>

          <!-- กล่องรายละเอียดรายการที่จะยกเลิก -->
          <div style="max-height: 300px; overflow-y: auto;" class="mb-4 pr-2 custom-scrollbar">
            <v-card 
              v-for="(item, index) in itemsToCancel" 
              :key="index"
              outlined 
              class="pa-4 text-left grey lighten-5 mb-3 rounded-lg elevation-0" 
              style="border: 1px solid #eee;"
            >
              <div class="font-weight-bold mb-3">รายการที่ {{ index + 1 }}</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <span class="black--text mr-2">หมายเลขเอกสาร :</span>
                  <span class="font-weight-bold black--text">{{ item.request_no }}</span>
                </v-col>
                <v-col cols="12" sm="6">
                  <span class="black--text mr-2">วันที่ทำงาน :</span>
                  <span class="font-weight-bold black--text">{{ item.startDate }}</span>
                </v-col>
                <v-col cols="12" sm="6" class="mt-2">
                  <span class="black--text mr-2">เวลาที่เริ่ม :</span>
                  <span class="font-weight-bold black--text">{{ (item.startTime || '').replace(' น.', '') }}</span>
                </v-col>
                <v-col cols="12" sm="6" class="mt-2">
                  <span class="black--text mr-2">เวลาที่สิ้นสุด :</span>
                  <span class="font-weight-bold black--text">{{ (item.endTime || '').replace(' น.', '') }}</span>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <div class="text-left font-weight-bold mb-2">เหตุผลที่ยกเลิกคำร้องขอ</div>
          <v-textarea
            v-model="cancellationReason"
            outlined
            placeholder="กรุณาระบุเหตุผลที่ยกเลิกคำร้องขอ"
            rows="4"
            class="rounded-lg"
          ></v-textarea>

          <div class="d-flex justify-center gap-4 mt-6 mb-6">
             <v-btn
              outlined
              color="primary"
              width="140"
              height="44"
              class="rounded-lg headline font-weight-medium"
              style="font-size: 1rem !important; border-color: #1976d2;"
              @click="cancelDialog = false"
            >
              ยกเลิก
            </v-btn>
            <v-btn
              depressed
              width="140"
              height="44"
              class="rounded-lg headline font-weight-medium"
              :style="{ 
                'font-size': '1rem !important',
                'background-color': cancellationReason.trim().length > 0 ? '#1565c0 !important' : '#BDBDBD !important',
                'color': 'white !important'
              }"
              :disabled="cancellationReason.trim().length === 0"
              @click="confirmCancelRequest"
            >
              ยืนยัน
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- กล่องแสดงผลสำเร็จ -->
    <v-dialog v-model="successDialog" max-width="500px">
      <v-card class="rounded-lg text-center pb-6">
        <v-card-title class="blue lighten-5 py-3 relative justify-center mb-6" style="position: relative;">
          <div class="font-weight-bold blue--text text--darken-2 title">
            ยกเลิกคำร้องขอ
          </div>
           <v-btn icon absolute right top @click="successDialog = false" class="mt-1 mr-1">
            <v-icon color="blue darken-2">mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="mb-4 d-flex justify-center">
             <div style="background-color: #66bb6a; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
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
import axios from "axios";
import Status from "@/components/global/Status.vue";

const API_URL = process.env.VUE_APP_API_URL || "http://localhost:5500/api";

export default {
  name: "AttendancePage",
  components: {
    Status,
  },

  data() {
    return {
      // --- UI States (สถานะของ UI) ---
      loading: false, // สถานะการโหลดข้อมูล
      error: null,    // เก็บข้อผิดพลาดถ้ามี
      breadcrumbs: [  // ตัวนำทาง breadcrumbs

       /* { text: "หน้าหลัก", disabled: false },
        { text: "ลงเวลา", disabled: false },
        { text: "ลงเวลางาน", disabled: true }, */
      ],

      // --- Filters & Search (ตัวกรองและค้นหา) ---
      q: "",

      filterYear: null,
      filterStatus: null,

      // --- Pagination (การแบ่งหน้า) ---
      perPage: 10,
      page: 1,

      // --- Data Models (โมเดลข้อมูล) ---
      attendanceRecords: [],

      years: [],
      stats: [
        { icon: "mdi-file-document-outline", label: "ทั้งหมด", color: "blue" },
        { icon: "mdi-file-clock-outline", label: "รออนุมัติ", color: "orange" },
        { icon: "mdi-file-document-check-outline", label: "อนุมัติแล้ว", color: "green" },
        { icon: "mdi-file-document-remove-outline", label: "ไม่อนุมัติ", color: "red" },
        { icon: "mdi-file-cancel-outline", label: "ยกเลิก", color: "grey" },
      ],
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

      // --- Selection (การเลือกรายการ) ---
      selectedItems: [],
      selectAll: false,

      // --- Dialog States & Models (สถานะของ Dialog ต่างๆ) ---
      viewDialog: false,
      cancelDialog: false,
      successDialog: false,
      
      selectedItem: null,
      relatedItems: [],    // สำหรับดูรายละเอียดของกลุ่มคำร้อง
      itemsToCancel: [],   // สำหรับจัดการการยกเลิก (หลายรายการ)
      cancellationReason: "",
      
      // ลบข้อมูลที่เกี่ยวข้องกับการแก้ไขที่ไม่ได้ใช้ออก
    };
  },

  watch: {
    q() { this.resetSelection(); },

    filterYear() { this.resetSelection(); },
    filterStatus() { this.resetSelection(); },
    page() { this.selectAll = false; },
  },

  computed: {
    // คำนวณสถิติสำหรับแสดงในกล่อง Stat ด้านบน
    statsComputed() {
      const all = this.attendanceRecords.length;
      const counts = { รออนุมัติ: 0, อนุมัติแล้ว: 0, ไม่อนุมัติ: 0, ยกเลิก: 0 };

      this.attendanceRecords.forEach((r) => {
        if (r.status && counts.hasOwnProperty(r.status)) counts[r.status]++;
      });

      // อัปเดตการจับคู่สีสำหรับการออกแบบใหม่
      const theme = {
        blue:   { bg: '#E3F2FD', border: '#90CAF9', icon: '#1976D2' },
        orange: { bg: '#FFF3E0', border: '#FFCC80', icon: '#EF6C00' },
        green:  { bg: '#E8F5E9', border: '#A5D6A7', icon: '#2E7D32' },
        red:    { bg: '#FFEBEE', border: '#EF9A9A', icon: '#C62828' },
        grey:   { bg: '#F5F5F5', border: '#E0E0E0', icon: '#616161' },
      };

      return this.stats.map((s) => {
        let count = s.label === "ทั้งหมด" ? all : counts[s.label] || 0;
        const t = theme[s.color] || theme.blue;
        return { 
            ...s, 
            count,
            bg: t.bg,
            borderColor: t.border,
            iconColor: t.icon
        };
      });
    },

    // กรองรายการตามคำค้นหา, บริษัท, ปี, และสถานะ
    filteredItems() {
      let items = this.attendanceRecords.slice();
      
      // กรองตามคำค้นหา
      if (this.q) {
        const q = this.q.toLowerCase();
        items = items.filter(
          (it) =>
            (it.request_no || "").toLowerCase().includes(q) ||
            (it.title || "").toLowerCase().includes(q)
        );
      }
      
      // กรองตามตัวเลือก Dropdown

      if (this.filterYear) {
        items = items.filter(
          (it) => it.startDate && it.startDate.includes(this.filterYear)
        );
      }
      
      // กรองตามการ์ดสถานะ
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

    this.fetchYears();
    this.fetchRecords();
  },

  methods: {
    async fetchYears() {
    },

    // ฟังก์ชันดึงข้อมูลจาก API
    async fetchRecords() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_URL}/ot/request`);
        if (response.data && response.data.success) {
          const rawData = response.data.data;
          
          // จัดกลุ่มตาม request_id
          const groups = {};
          rawData.forEach(item => {
              // ตรวจสอบให้แน่ใจว่ามี key ถ้าไม่มี request_id ให้ใช้ id แทนเพื่อความไม่ซ้ำกัน
              const key = item.request_id || `REQ-${item.id}`; 
              if (!groups[key]) {
                  groups[key] = {
                      items: [],
                      totalHours: 0
                  };
              }
              const hours = parseFloat(item.total) || 0;
              groups[key].items.push(item);
              groups[key].totalHours += hours;
          });

          // แปลงกลุ่มข้อมูลเป็น array สำหรับแสดงผล
          const records = Object.values(groups).map(g => {
              const first = g.items[0];
              // แปลงสถานะจากฐานข้อมูลเป็นข้อความ
              // 1: รออนุมัติ, 2: อนุมัติแล้ว, 3: ไม่อนุมัติ, 4: ยกเลิก
              const statusMap = { 1: 'รออนุมัติ', 2: 'อนุมัติแล้ว', 3: 'ไม่อนุมัติ', 4: 'ยกเลิก' };
              const statusText = statusMap[first.ot_status] || 'รออนุมัติ'; 

              // จัดรูปแบบชั่วโมงรวม: ตัดทศนิยมถ้าเป็นจำนวนเต็ม หรือเก็บทศนิยม 2 ตำแหน่ง
              const totalH = g.totalHours;
              const formattedHours = Number.isInteger(totalH) ? totalH : totalH.toFixed(2);

              return {
                  id: first.id, // ใช้ ID ที่ไม่ซ้ำกันสำหรับการเลือก
                  request_no: first.request_id || "-", 
                  title: first.description || "-",
                  startDate: this.formatISODate(first.start_time),
                  startTime: this.formatISOTime(first.start_time),
                  endDate: this.formatISODate(first.end_time),
                  endTime: this.formatISOTime(first.end_time),
                  hours: `${formattedHours} ชั่วโมง`, // ผลรวมชั่วโมง
                  status: statusText,
                  statusCode: first.ot_status,
                  cancellation_reason: first.cancellation_reason,
                  children: g.items // เก็บข้อมูลลูก (children) ดิบไว้สำหรับดูรายละเอียด
              };
          });

          // เรียงลำดับตาม ID จากมากไปน้อย (ล่าสุดขึ้นก่อน)
          this.attendanceRecords = records.sort((a, b) => a.id - b.id);

          // เติมข้อมูลตัวกรอง (ปี)
          const yearSet = new Set();
          rawData.forEach(r => {
               if(r.start_time) {
                 const y = new Date(r.start_time).getFullYear();
                 if(y) yearSet.add(String(y));
               }
          });
          this.years = Array.from(yearSet).sort().reverse();
        } else {
           throw new Error("Invalid response format");
        }

        // รีเซ็ตการเลือก
        this.selectedItems = [];
        this.selectAll = false;
            
      } catch (err) {
        console.error("API Error:", err);
        this.error = { message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้" };
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

    // UI HANDLERS (จัดการเหตุการณ์ UI: ค้นหา, กรอง, เลือก)
    onSearch() {
      this.page = 1;
    },

    isStatActive(label) {
      return this.filterStatus === label && label !== "ทั้งหมด";
    },

    onStatClick(label) {
      if (label === "ทั้งหมด") {
        this.filterStatus = null;
      } else {
        this.filterStatus = this.filterStatus === label ? null : label;
      }
      this.page = 1; // Reset to page 1
    },

    resetSelection() {
      this.selectedItems = [];
      this.selectAll = false;
    },

    toggleSelectAll() {
      this.selectedItems = this.selectAll ? this.paginatedItems.map(item => item.id) : [];
    },

    // ACTION HANDLERS (View, Cancel)
    // ฟังก์ชันเปิดดูรายละเอียด (View)
    onView(item) {
      this.selectedItem = item; // รายการถูกรวบรวมไว้แล้ว
      
      // ใช้ข้อมูลลูก (children) สำหรับตารางรายละเอียด
      // ต้องจัดรูปแบบให้ตรงกับที่ตารางต้องการ
      if (item.children && item.children.length > 0) {
          this.relatedItems = item.children.map(c => ({
              startDate: this.formatISODate(c.start_time),
              startTime: this.formatISOTime(c.start_time),
              endTime: this.formatISOTime(c.end_time),
              hours: c.total
          }));
      } else {
          // กรณีสำรองถ้าไม่มีข้อมูลลูก (ไม่ควรเกิดขึ้นด้วย logic ใหม่)
           this.relatedItems = [{
              startDate: item.startDate,
              startTime: item.startTime,
              endTime: item.endTime,
              hours: parseFloat(item.hours) || 0
           }];
      }

      this.cancellationReason = "";
      this.viewDialog = true;
    },

    // ฟังก์ชันจัดการเมื่อกดปุ่ม "ยกเลิกคำร้องขอ" (แบบกลุ่ม)
    async onBulkCancel() {
      if (this.selectedItems.length === 0) {
        return;
      }

      // แปลง ID ที่เลือกกลับเป็น object เต็ม (นี่คือกลุ่มหลัก)
      const groupItems = this.attendanceRecords.filter(r => this.selectedItems.includes(r.id));
      
      // รวมข้อมูลลูกทั้งหมดจากกลุ่มที่เลือกเพื่อทำการยกเลิก
      let allChildren = [];
      groupItems.forEach(group => {
          if (group.children) {
              allChildren = allChildren.concat(group.children.map(c => ({
                   id: c.id,
                   request_no: c.request_id,
                   startDate: this.formatISODate(c.start_time),
                   startTime: this.formatISOTime(c.start_time),
                   endTime: this.formatISOTime(c.end_time)
              })));
          }
      });

      this.cancellationReason = "";
      this.itemsToCancel = allChildren;
      this.cancelDialog = true;
    },

    // ฟังก์ชันจัดการเมื่อกด "ยกเลิก" ในหน้าดูรายละเอียด
    async onCancelRequest() {
      this.cancellationReason = "";
      
      // ตรวจสอบว่ามีรายการที่จะยกเลิกหรือไม่
      if (this.selectedItem) {
          // ถ้ามีข้อมูลลูก ให้ยกเลิกทั้งหมด
          // เราต้องการ array ของ object ที่ 'cancelDialog' รองรับ
          // cancelDialog ต้องการรายการที่มี request_no, startDate, ฯลฯ
          if (this.selectedItem.children) {
               this.itemsToCancel = this.selectedItem.children.map(c => ({
                   id: c.id,
                   request_no: c.request_id,
                   startDate: this.formatISODate(c.start_time),
                   startTime: this.formatISOTime(c.start_time),
                   endTime: this.formatISOTime(c.end_time)
               }));
          } else {
               this.itemsToCancel = [this.selectedItem];
          }
      }
      
      this.viewDialog = false; 
      this.cancelDialog = true;
    },

    // ยืนยันการยกเลิกคำร้อง (ทำงานจริงเมื่อกดปุ่มยืนยันใน Dialog)
    async confirmCancelRequest() {
       if (!this.cancellationReason.trim()) return;

      try {
        // ส่ง Request ไปยัง API จริงๆ สำหรับทุกรายการใน itemsToCancel
        const promises = this.itemsToCancel.map(item => {
            return axios.put(`${API_URL}/ot/${item.id}`, {
                ot_status: 4, // 4 = Cancelled
                // ถ้าต้องการบันทึกเหตุผลใน description หรือ field อื่น ให้เพิ่มตรงนี้
                // description: `${this.cancellationReason} (${item.description || ''})`
            });
        });

        await Promise.all(promises);

        // โหลดข้อมูลใหม่เพื่อให้แสดงผลถูกต้องตามจริงจาก DB
        await this.fetchRecords();

        this.cancelDialog = false;
        this.selectedItems = []; // ล้างการเลือก
        this.successDialog = true; 
        
      } catch (err) {
        console.error("Cancel error:", err);
        alert("การยกเลิกล้มเหลว: " + (err.response?.data?.message || err.message));
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Sarabun', sans-serif !important;
}

  /*โครงสร้างหลักและการ์ดสถิติ (Stat Card)*/



/* การแบ่งหน้า (Pagination)*/
.pagination-controls {
    justify-content: space-between !important;
}

.pagination-range {
    min-width: 110px;
    text-align: right;
}

/* Pagination: ขยับไปด้านขวา และ responsive */
.pagination-controls {
    justify-content: space-between !important;
}

.pagination-range {
    min-width: 110px;
    text-align: right;
}

.gap-2 {
    gap: 8px;
}

/* สำหรับมือถือ: */
@media (max-width: 600px) {
    .pagination-controls {
        flex-direction: column;
        justify-content: center !important;
        gap: 12px;
        padding: 8px !important;
    }

    .pagination-range {
        min-width: 80px;
        text-align: center;
    }
}

/* สไตล์สำหรับ Scrollbar ในรายการยกเลิก */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #bdbdbd;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9e9e9e;
}
</style> 