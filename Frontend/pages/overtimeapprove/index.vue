<template>
  <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
      
      <div class="mb-6">
        <v-tabs background-color="transparent" color="#1E88E5" slider-size="3">
          <v-tab class="font-weight-bold text-body-1 px-0 mr-8" style="letter-spacing: 0;">อนุมัติค่าล่วงเวลา</v-tab>
          <v-tab class="font-weight-medium text-body-1 grey--text px-0" style="letter-spacing: 0;" disabled>อนุมัติค่ารักษา</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>

      <StatsGrid :stats="stats" />
      
      <FilterToolbar v-model="searchQuery" />

      <EmployeeTable 
        :items="employees" 
        :loading="loading" 
      />

      <v-row class="mt-4 align-center justify-end">
        <span class="caption grey--text mr-3">แสดง</span>
        <v-select :items="[10, 20, 50]" value="10" dense outlined hide-details class="rounded-lg caption" style="max-width: 80px;"></v-select>
        <span class="caption grey--text ml-3 mr-4">รายการต่อหน้า</span>
        <span class="caption font-weight-medium mr-4">1-10 จาก 20</span>
        <v-btn-toggle dense class="rounded-lg mr-2" borderless>
          <v-btn small class="white"><v-icon small>mdi-chevron-left</v-icon></v-btn>
          <v-btn small class="white"><v-icon small>mdi-chevron-right</v-icon></v-btn>
        </v-btn-toggle>
      </v-row>

    </v-main>
  </v-app>
</template>

<script>
import StatsGrid from '@/components/overtimeapprove/StatsGrid.vue';
import FilterToolbar from '@/components/overtimeapprove/FilterToolbar.vue';
import EmployeeTable from '@/components/overtimeapprove/EmployeeTable.vue';
import api from "../../service/api";

// Utility Formatter (เหลือแค่นี้พอ)
const dateFormatter = new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFormatter = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });

export default {
  components: {
    StatsGrid,
    FilterToolbar,
    EmployeeTable
  },
  data() {
    return {
      loading: false,
      searchQuery: '',
      // Stats Array: ส่วนนี้ยังต้องมีเพื่อแสดง Card ด้านบน (กำหนดสีของ Card ไว้ตรงนี้ได้เลย)
      stats: [
        { label: 'ทั้งหมด', count: 0, icon: 'mdi-file-document-outline', iconColor: '#1976D2', bg: '#E3F2FD', borderColor: '#BBDEFB' },       // Index 0
        { label: 'รอหัวหน้าอนุมัติ', count: 0, icon: 'mdi-clock-time-four-outline', iconColor: '#F57C00', bg: '#FFF3E0', borderColor: '#FFE0B2' }, // Index 1
        { label: 'รอ HR อนุมัติ', count: 0, icon: 'mdi-account-clock-outline', iconColor: '#FFA000', bg: '#FFF8E1', borderColor: '#FFECB3' },   // Index 2
        { label: 'อนุมัติ', count: 0, icon: 'mdi-check-circle-outline', iconColor: '#388E3C', bg: '#E8F5E9', borderColor: '#C8E6C9' },          // Index 3
        { label: 'HR ไม่อนุมัติ', count: 0, icon: 'mdi-close-circle-outline', iconColor: '#D32F2F', bg: '#FFEBEE', borderColor: '#FFCDD2' },    // Index 4
        { label: 'หัวหน้าไม่อนุมัติ', count: 0, icon: 'mdi-close-box-outline', iconColor: '#D32F2F', bg: '#FFEBEE', borderColor: '#FFCDD2' },   // Index 5
        { label: 'ยกเลิก', count: 0, icon: 'mdi-cancel', iconColor: '#616161', bg: '#F5F5F5', borderColor: '#E0E0E0' },                        // Index 6
      ],
      employees: [],
      // years: [], // ❌ ถ้าไม่ได้ทำ dropdown กรองปี ก็ลบตัวแปรนี้ทิ้งได้เลยครับ
    };
  },
  methods: {
    formatDateTime(isoString, type = 'date') {
      if (!isoString) return "-";
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "-"; 
      return type === 'time' ? timeFormatter.format(date) + " น." : dateFormatter.format(date);
    },
    
    resetStats() {
      this.stats.forEach(s => s.count = 0);
    },

    async fetchData() {
      this.loading = true;
      this.resetStats();
      try {
        const resp = await api.get("/api/ot");
        const rawData = resp.data?.data || resp.data || [];
        
        const processedEmployees = rawData.map((emp, index) => {
            let totalHoursVal = 0;

            const requests = (emp.ot_requests || []).map((ot, idx) => {
                const duration = Number(ot.ot_duration || 0);
                totalHoursVal += duration;

                // ----------------------------------------------------
                // ส่วนการนับ Stats (Clean ขึ้น)
                // ----------------------------------------------------
                // สมมติ Database ส่ง status เป็น: 
                // 1=รอหัวหน้า, 2=รอHR, 3=อนุมัติ, 4=HRไม่, 5=หนไม่, 6=ยกเลิก
                const statusId = Number(ot.ot_status) || 1; 

                this.stats[0].count++; // นับยอดรวมเสมอ
                
                // Map ID เข้ากับ Index ของ Array stats ด้านบน
                // ถ้า ID ตรงกับ Index ก็ใช้ได้เลย หรือจะเขียน if/else เพื่อความชัวร์ก็ได้
                if (statusId === 1) this.stats[1].count++;      // รอหัวหน้า
                else if (statusId === 2) this.stats[2].count++; // รอ HR
                else if (statusId === 3) this.stats[3].count++; // อนุมัติ
                else if (statusId === 4) this.stats[4].count++; // HR ไม่อนุมัติ
                else if (statusId === 5) this.stats[5].count++; // หัวหน้าไม่อนุมัติ
                else if (statusId === 6) this.stats[6].count++; // ยกเลิก
                // ----------------------------------------------------

                const desc = ot.description || "-";
                const detailParts = desc.split('\n');

                return {
                    id: `${emp.eid}-${ot.request_id}-${idx}`,
                    reqNo: ot.request_id || "-",
                    detailTitle: detailParts[0] || desc,
                    detailDesc: detailParts[1] || "",
                    hours: `${duration} ชั่วโมง`,
                    start: `${this.formatDateTime(ot.start_time, 'date')} ${this.formatDateTime(ot.start_time, 'time')}`,
                    end: `${this.formatDateTime(ot.end_time, 'date')} ${this.formatDateTime(ot.end_time, 'time')}`,
                    transDate: this.formatDateTime(ot.created_at || ot.start_time, 'date'),
                    
                    // ✅ ส่งแค่ ID ไปก็พอ Component ลูกจัดการสีเอง
                    status: statusId, 
                };
            });

            return {
                id: emp.eid || index,
                rank: index + 1,
                empCode: emp.employee_code || "-",
                name: emp.employee_name || "-",
                position: emp.position || "-",
                department: emp.department || "-", 
                company: emp.company || "iRecruit",
                itemsCount: requests.length,
                totalHours: totalHoursVal > 0 ? `${totalHoursVal} ชั่วโมง` : '-',
                requests: requests
            };
        });

        this.employees = Object.freeze(processedEmployees);

      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>