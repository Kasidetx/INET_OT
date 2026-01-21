<template>
  <v-card outlined class="rounded-xl overflow-hidden border-light">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <v-simple-table v-if="!$vuetify.breakpoint.xsOnly" class="custom-table">
      <template v-slot:default>
        <thead>
          <tr class="blue lighten-5">
            <th class="text-left py-4" width="60">ลำดับ</th>
            <th class="text-left">ชื่อการตั้งค่า</th>
            <th class="text-left">ประเภทพนักงาน</th>
            <th class="text-left">เงื่อนไขวัน/เวลา</th>
            <th class="text-center">อัตรา (เท่า)</th>
            <th class="text-center" width="120">สถานะ</th>
            <th class="text-center" width="120">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in pagedItems" :key="item.id" class="hover-row">
            <td class="text-center font-weight-bold grey--text">{{ (page - 1) * perPage + index + 1 }}</td>

            <td class="font-weight-bold text-body-2 text--primary py-3">
              {{ item.name || '-' }}
            </td>

            <td>
              <v-chip small :color="getTypeColor(item.employee_type_id) + '20'"
                :text-color="getTypeColor(item.employee_type_id)" class="font-weight-bold">
                {{ getEmployeeTypeName(item.employee_type_id) }}
              </v-chip>
            </td>

            <td>
              <div class="d-flex flex-column caption">
                <span class="font-weight-medium black--text">
                  <v-icon x-small class="mr-1">mdi-calendar</v-icon>
                  {{ item.day_type === 'WORKDAY' ? 'วันทำงาน' : 'วันหยุด' }}
                </span>
                <span class="grey--text">
                  <v-icon x-small class="mr-1">mdi-clock-outline</v-icon>
                  {{ formatPeriod(item.ot_period) }}
                </span>
              </div>
            </td>

            <td class="text-center">
              <span class="text-h6 font-weight-bold blue--text">{{ item.rate }}</span>
            </td>

            <td class="text-center">
              <div class="d-flex align-center justify-center">
                <div :style="{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: item.is_active ? '#4CAF50' : '#9E9E9E',
                  boxShadow: item.is_active ? '0 0 0 2px #E8F5E9' : ''
                }"></div>
                <span class="ml-2 caption font-weight-bold" :class="item.is_active ? 'green--text' : 'grey--text'">
                  {{ item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
                </span>
              </div>
            </td>

            <td class="text-center">
              <div class="d-flex align-center justify-center">
                <v-btn icon small color="primary" class="mr-1" @click="$emit('edit', item)">
                  <v-icon small>mdi-pencil-outline</v-icon>
                </v-btn>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn icon small :color="item.is_active ? 'error' : 'success'" :loading="updatingId === item.id"
                      v-bind="attrs" v-on="on" @click="toggleStatus(item)">
                      <v-icon small>
                        {{ item.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>{{ item.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน' }}</span>
                </v-tooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <div v-else class="pa-4 bg-gray-light">
      <div v-for="(item, index) in pagedItems" :key="item.id"
        class="mobile-card mb-4 pa-4 white rounded-lg elevation-2">

        <div class="d-flex justify-space-between align-start mb-3">
          <div class="font-weight-bold text-body-1 text--primary pr-2" style="line-height: 1.4;">
            {{ item.name }}
          </div>
          <v-btn icon small color="primary" class="mt-n1 mr-n2" @click="$emit('edit', item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-chip x-small label :color="getTypeColor(item.employee_type_id)" dark class="font-weight-bold">
            {{ getEmployeeTypeName(item.employee_type_id) }}
          </v-chip>

          <v-chip x-small outlined color="grey darken-2">
            {{ item.day_type === 'WORKDAY' ? 'วันทำงาน' : 'วันหยุด' }}
          </v-chip>
        </div>

        <v-divider class="mb-3 border-dashed"></v-divider>

        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="caption grey--text mb-1">ช่วงเวลา</div>
            <div class="font-weight-medium text-body-2">
              {{ formatPeriod(item.ot_period) }}
            </div>
            <div class="caption grey--text mt-1">{{ getDisplayTime(item) }}</div>
          </div>

          <div class="text-right">
            <div class="caption grey--text mb-1">อัตราจ่าย</div>
            <div class="text-h5 font-weight-bold blue--text">{{ item.rate }} <span
                class="caption grey--text">เท่า</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 d-flex align-center justify-space-between" style="border-top: 1px solid #f0f0f0;">

          <div class="d-flex align-center">
            <span class="caption mr-2">สถานะ:</span>
            <div :style="{
              width: '10px', height: '10px', borderRadius: '50%',
              background: item.is_active ? '#4CAF50' : '#9E9E9E',
              boxShadow: item.is_active ? '0 0 0 2px #E8F5E9' : ''
            }"></div>
            <span class="ml-2 caption font-weight-bold" :class="item.is_active ? 'green--text' : 'grey--text'">
              {{ item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
            </span>
          </div>

          <v-btn small outlined :color="item.is_active ? 'error' : 'success'" class="rounded-lg"
            :loading="updatingId === item.id" @click="toggleStatus(item)">
            <v-icon left small>{{ item.is_active ? 'mdi-power-off' : 'mdi-power' }}</v-icon>
            {{ item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}
          </v-btn>
        </div>

      </div>
    </div>

    <v-divider></v-divider>
    <div class="d-flex justify-center align-center py-3">
      <v-btn icon :disabled="page === 1" @click="page--">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <span class="mx-4 text-body-2 font-weight-medium">หน้า {{ page }} / {{ totalPages }}</span>
      <v-btn icon :disabled="page === totalPages" @click="page++">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script>
import api from "~/service/api"

export default {
  name: "OvertimeSettingTable",
  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  data() {
    return {
      updatingId: null,
      page: 1,
      perPage: 15
    }
  },
  methods: {
    getTypeColor(id) {
      const map = { 1: "#FFA000", 2: "#6366f1", 3: "#4CAF50", 4: "#EF5350" }
      return map[id] || "#1976D2"
    },
    getEmployeeTypeName(id) {
      const types = { 1: "พนักงานปกติ", 2: "พนักงานกะ", 3: "กะ 12 ชม.", 4: "รายชั่วโมง" }
      return types[id] || "ทั่วไป"
    },
    formatPeriod(period) {
      const periods = { 'DURING_WORK': 'ในเวลาทำงาน', 'BEFORE_WORK': 'ก่อนเข้างาน (เช้า)', 'AFTER_WORK': 'หลังเลิกงาน (เย็น)' }
      return periods[period] || period
    },
    getDisplayTime(item) {
      if (item.employee_type_id === 1) {
        if (item.start_time) return "เริ่ม " + item.start_time.substring(0, 5) + " น."
        return item.ot_period === "DURING_WORK" ? "เริ่ม 08:30" : "เริ่ม 17:30"
      }
      if (item.employee_type_id === 4) return "ไม่ระบุเวลา"
      return "ตามตารางกะ"
    },
    async toggleStatus(item) {
      this.updatingId = item.id
      try {
        const newStatus = !item.is_active
        await api.put(`/api/otconfig/${item.id}`, { ...item, is_active: newStatus })
        this.$emit("refresh")
      } catch (error) {
        alert("ไม่สามารถเปลี่ยนสถานะได้")
      } finally {
        this.updatingId = null
      }
    }
  },
  computed: {
    totalPages() { return Math.ceil(this.items.length / this.perPage) || 1 },
    pagedItems() {
      const start = (this.page - 1) * this.perPage
      const end = start + this.perPage
      return this.items.slice(start, end)
    }
  },
  watch: { items() { this.page = 1 } }
}
</script>

<style scoped>
.border-light {
  border: 1px solid #eef2f6 !important;
}

.bg-gray-light {
  background-color: #F8F9FA;
}

.mobile-card {
  border: 1px solid #e0e0e0;
}

.border-dashed {
  border-style: dashed;
  border-color: #eee;
}

.hover-row:hover {
  background-color: #f9faff !important;
}

.gap-2 {
  gap: 8px;
}
</style>