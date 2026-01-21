<template>
  <v-app style="background-color: #F8F9FA; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
      <!-- Stats -->
      <StatsGrid :stats="stats" :current-filter="statusFilter" @update:filter="statusFilter = $event" />

      <!-- Filter -->
      <FilterToolbar v-model="searchQuery" />

      <!-- ✅ WHITE BACKGROUND AREA (Table + Pagination) -->
      <v-container fluid class="white-area mt-4 pa-4 rounded-xl">
        <EmployeeTable :key="tableKey" :items="paginatedEmployees" :total-items="filteredEmployees.length"
          :loading="loading" :is-selectable="isPendingMode" :show-approve="statusFilter === 'pending_hr'"
          v-model="selectedRequests" @approve="openAction('approve')" @reject="openAction('reject')"
          @view="openTracking" />

        <v-row class="mt-4 align-center justify-end" v-if="filteredEmployees.length > 0">
          <span class="caption grey--text mr-3">จำนวนแถว</span>

          <v-select v-model="itemsPerPage" :items="[10, 20, 50]" dense outlined hide-details class="rounded-lg caption"
            style="max-width: 80px;" @change="page = 1" />

          <span class="caption grey--text ml-3 mr-4">รายการต่อหน้า</span>

          <span class="caption font-weight-medium mr-4">
            {{ paginationMeta }}
          </span>

          <div class="d-flex align-center">
            <v-btn small class="white rounded-lg mr-2" elevation="0" style="border: 1px solid #e0e0e0; min-width: 32px;"
              :disabled="page === 1" @click="page--">
              <v-icon small>mdi-chevron-left</v-icon>
            </v-btn>

            <v-btn small class="white rounded-lg" elevation="0" style="border: 1px solid #e0e0e0; min-width: 32px;"
              :disabled="page >= pageCount" @click="page++">
              <v-icon small>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
        </v-row>
      </v-container>

      <!-- Dialogs (ลอยด้านนอก container ได้เลย) -->
      <Dialog v-model="actionDialog" :type="actionType" :items="selectedRequests" :success="successDialog"
        @confirm="confirmAction" @done="onDialogDone" />

      <TrackingDialog :key="trackingKey" v-model="trackingDialog" :item="trackingItem" @close="trackingItem = null" />

    </v-main>
  </v-app>
</template>

<script>
import StatsGrid from '@/components/global/StatsGrid.vue'
import FilterToolbar from '@/components/global/FilterToolbar.vue'
import EmployeeTable from '@/components/overtimeapprove/EmployeeTable.vue'
import Dialog from '@/components/overtimeapprove/Dialog.vue'
import TrackingDialog from '@/components/overtimeapprove/TrackingDialog.vue'
import api from "../../service/api"

const dateFormatter = new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' })

export default {
  components: { StatsGrid, FilterToolbar, EmployeeTable, Dialog, TrackingDialog },

  data() {
    return {
      loading: false,
      searchQuery: '',
      statusFilter: 'all',
      page: 1,
      itemsPerPage: 10,

      tableKey: 0,
      successDialog: false,

      trackingDialog: false,
      trackingItem: null,
      trackingKey: 0,

      stats: [
        { label: 'ทั้งหมด', filterKey: 'all', count: 0, icon: 'mdi-file-document-outline', color: '#1565C0', bg: '#E3F2FD' },
        { label: 'รอหัวหน้าอนุมัติ', filterKey: 'pending_head', count: 0, icon: 'mdi-account-clock-outline', color: '#D97706', bg: '#FFF7ED' },
        { label: 'รอ HR อนุมัติ', filterKey: 'pending_hr', count: 0, icon: 'mdi-briefcase-clock-outline', color: '#EAB308', bg: '#FEFCE8' },
        { label: 'อนุมัติ', filterKey: 'approved', count: 0, icon: 'mdi-check-circle-outline', color: '#16A34A', bg: '#DCFCE7' },
        { label: 'หัวหน้าไม่อนุมัติ', filterKey: 'rejected_head', count: 0, icon: 'mdi-account-remove-outline', color: '#EF4444', bg: '#FFEBEE' },
        { label: 'HR ไม่อนุมัติ', filterKey: 'rejected_hr', count: 0, icon: 'mdi-close-circle-outline', color: '#DC2626', bg: '#FEF2F2' },
        { label: 'ยกเลิก', filterKey: 'cancelled', count: 0, icon: 'mdi-file-hidden', color: '#4B5563', bg: '#F3F4F6' },
      ],

      employees: [],
      selectedRequests: [],

      actionDialog: false,
      actionType: 'approve',
    }
  },

  computed: {
    isPendingMode() {
      return ['pending_head', 'pending_hr'].includes(this.statusFilter)
    },

    filteredEmployees() {
      const q = (this.searchQuery || '').trim().toLowerCase()
      const mode = this.statusFilter

      const STATUS_MAP = {
        pending_head: [1],
        pending_hr: [2],
        approved: [3],
        rejected_head: [4],
        rejected_hr: [5],
        cancelled: [6],
      }

      const matchStatus = (s) => {
        if (mode === 'all') return true
        const target = STATUS_MAP[mode] || []
        return target.includes(Number(s))
      }

      return (this.employees || [])
        .map(emp => {
          const reqs = (emp.requests || []).filter(r => matchStatus(r.status))
          const hay = `${emp.empCode} ${emp.name} ${emp.position}`.toLowerCase()
          const passSearch = !q || hay.includes(q)

          if (!passSearch || reqs.length === 0) return null

          const sumFilteredHours = reqs.reduce((sum, r) => sum + (r.valHours || 0), 0)
          const formattedTotal = Number.isInteger(sumFilteredHours) ? sumFilteredHours : sumFilteredHours.toFixed(2)

          return {
            ...emp,
            requests: reqs,
            itemsCount: reqs.length,

            totalHours: sumFilteredHours > 0 ? `${formattedTotal} ชั่วโมง` : '-'
          }
        })
        .filter(Boolean)
    },

    pageCount() {
      const c = Math.ceil(this.filteredEmployees.length / this.itemsPerPage)
      return c > 0 ? c : 1
    },

    paginatedEmployees() {
      const start = (this.page - 1) * this.itemsPerPage
      return this.filteredEmployees.slice(start, start + this.itemsPerPage)
    },

    paginationMeta() {
      const total = this.filteredEmployees.length
      if (total === 0) return '0 จาก 0'
      const start = (this.page - 1) * this.itemsPerPage + 1
      const end = Math.min(this.page * this.itemsPerPage, total)
      return `${start}-${end} จาก ${total}`
    }
  },

  watch: {
    statusFilter() {
      this.selectedRequests = []
      this.page = 1
    },
    filteredEmployees() {
      this.page = 1
    },
    actionDialog(v) {
      // พอ dialog ปิด (กดยืนยัน หรือ กดปิด)
      if (!v) {
        this.selectedRequests = []
        this.tableKey++ // บังคับ reset EmployeeTable
      }
    }
  },

  methods: {
    formatDateTime(isoString, type = 'date') {
      if (!isoString) return '-'
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return '-'
      return type === 'time'
        ? timeFormatter.format(date) + ' น.'
        : dateFormatter.format(date)
    },

    resetStats() {
      this.stats.forEach(s => (s.count = 0))
    },

    openAction(type) {
      if (!this.selectedRequests.length) return
      this.actionDialog = false
      this.actionType = type
      this.actionDialog = true
    },

    async confirmAction({ type, reason, items }) {
      console.log('🔥 confirmAction CALLED', type)

      // 1. ตรวจสอบข้อมูลที่ถูกเลือก
      const selected = Array.isArray(items) ? items : (this.selectedRequests || [])

      // ✅ กรองเอาเฉพาะรายการที่มี requestId
      const validItems = selected.filter(it => it.requestId)

      if (validItems.length === 0) {
        console.warn('❌ ไม่พบรายการที่เลือก หรือไม่มี Request ID')
        this.actionDialog = false
        return
      }

      // ✅ กำหนดคนอนุมัติ (Mock ตาม Tab ที่เลือกอยู่)
      // ถ้าอยู่ Tab รอหัวหน้า -> ให้ action_by เป็น head001
      // ถ้าอยู่ Tab รอ HR -> ให้ action_by เป็น hr001
      let actionBy = 'unknown'
      if (this.statusFilter === 'pending_head') actionBy = 'head001'
      else if (this.statusFilter === 'pending_hr') actionBy = 'hr001'
      else {
        // กรณีอยู่หน้า All ให้เดาจากสถานะของ Item แรก
        const firstStatus = Number(validItems[0].status)
        actionBy = firstStatus === 1 ? 'head001' : 'hr001'
      }

      try {
        // 2. วนลูปยิง API Approval
        await Promise.all(
          validItems.map(item => {
            console.log(`➡️ ${type.toUpperCase()} Request ID: ${item.requestId} by ${actionBy}`)

            // ✅ ยิงเข้า Route Approval ที่เราเตรียมไว้ใน Backend
            return api.post(`/api/approval/${item.requestId}`, {
              status: type, // ส่ง 'approve' หรือ 'reject'
              reason: reason,
              action_by: actionBy
            })
          })
        )

        console.log('✅ Action Success')

        // 3. ปิด Dialog และโหลดข้อมูลใหม่
        this.successDialog = true
        this.selectedRequests = []
        this.tableKey++
        await this.fetchData()

      } catch (err) {
        console.error("❌ Action Error:", err)
        alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message))
      }
    },

    onDialogDone() {
      this.successDialog = false
      this.actionDialog = false
      this.selectedRequests = []
    },

    openTracking(item) {
      this.trackingItem = item
      this.trackingKey++
      this.trackingDialog = true
    },

    async fetchData() {
      this.loading = true
      this.resetStats()

      try {
        const resp = await api.get("/api/ot")
        const rawData = resp.data?.result || []

        const processedEmployees = rawData.map((emp, index) => {
          let totalHoursVal = 0
          const requests = (emp.requests || []).filter(r => r).map((ot, idx) => {
            const duration = Number(ot.duration || ot.total || 0)
            totalHoursVal += duration

            const statusId = Number(ot.status || ot.req_status || 1)

            // Count Stats
            this.stats[0].count++
            if (statusId === 1) this.stats[1].count++
            else if (statusId === 2) this.stats[2].count++
            else if (statusId === 3) this.stats[3].count++
            else if (statusId === 4) this.stats[4].count++
            else if (statusId === 5) this.stats[5].count++
            else if (statusId === 6) this.stats[6].count++

            const desc = ot.description || "-"

            return {
              id: idx + 1,
              otId: ot.ot_id || ot.id || ot.otId,
              requestId: ot.request_id,
              docNo: ot.doc_no || "-",
              transDate: this.formatDateTime(ot.created_at || ot.start_time, 'date'),
              start: `${this.formatDateTime(ot.start_time, 'date')} ${this.formatDateTime(ot.start_time, 'time')}`,
              end: `${this.formatDateTime(ot.end_time, 'date')} ${this.formatDateTime(ot.end_time, 'time')}`,
              timeStart: this.formatDateTime(ot.start_time, 'time'),
              timeEnd: this.formatDateTime(ot.end_time, 'time'),
              hours: `${duration} ชั่วโมง`,
              valHours: duration,
              detailTitle: desc.split('\n')[0] || desc,
              detailDesc: desc.split('\n')[1] || "",
              status: statusId,
              empCode: emp.employee_code || "-",
              empName: emp.employee_name || "-",
            }
          })

          return {
            id: emp.eid || index,
            rank: index + 1,
            empCode: emp.employee_code || "-",
            name: emp.employee_name || "-",
            position: emp.position || "-",
            itemsCount: requests.length,
            totalHours: totalHoursVal > 0 ? `${totalHoursVal} ชั่วโมง` : '-',
            requests
          }
        })

        this.employees = Object.freeze(processedEmployees)
      } catch (err) {
        console.error("Fetch Error:", err)
      } finally {
        this.loading = false
      }
    }
  },

  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
.white-area {
  background-color: #ffffff;
  border: 1px solid #eaeaea;
}
</style>
