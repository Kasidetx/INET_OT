<template>
  <v-card outlined class="rounded-xl overflow-hidden border-light">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <v-simple-table class="custom-table">
      <template v-slot:default>
        <thead>
          <tr class="blue lighten-5">
            <th class="text-left py-4" width="80">ลำดับ</th>
            <th class="text-left">ชื่อ</th>
            <th class="text-left">ประเภทพนักงาน</th>
            <th class="text-left">ประเภทวัน</th>
            <th class="text-left">ช่วงเวลาทำงาน</th>
            <th class="text-center">ค่าล่วงเวลา (เท่า)</th>
            <th class="text-center" width="120">สถานะ</th>
            <th class="text-center" width="120">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in pagedItems" :key="item.id">
            <td class="text-center font-weight-bold">
              {{ (page - 1) * perPage + index + 1 }}
            </td>

            <td class="black--text font-weight-medium">
              {{ item.name || '-' }}
            </td>

            <td>
              <div class="d-flex align-center">
                <div class="mr-2" style="width:10px;height:10px;border-radius:50%;"
                  :style="{ background: getTypeColor(item.employee_type_id) }"></div>

                <span class="font-weight-bold">
                  {{ getEmployeeTypeName(item.employee_type_id) }}
                </span>
              </div>
            </td>

            <td class="font-weight-medium">
              {{ item.day_type === 'WORKDAY' ? 'วันทำงาน' : 'วันหยุด' }}
            </td>

            <td>
              <div class="d-flex flex-column">
                <span class="text-body-2">
                  {{ formatPeriod(item.ot_period) }}
                </span>

                <span class="caption grey--text">
                  {{ getDisplayTime(item) }}
                </span>
              </div>
            </td>

            <td class="text-center font-weight-bold text-h6">
              {{ item.rate }}
            </td>

            <td class="text-center">
              <StatusOTconfig :value="item.is_active" />
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
                        {{ item.is_active
                          ? 'mdi-pause-circle-outline'
                          : 'mdi-play-circle-outline' }}
                      </v-icon>
                    </v-btn>
                  </template>

                  <span>
                    {{ item.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน' }}
                  </span>
                </v-tooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <v-divider></v-divider>

    <div class="d-flex justify-center align-center py-3">
      <v-btn icon :disabled="page === 1" @click="page--">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <span class="mx-4 text-body-2 font-weight-medium">
        หน้า {{ page }} / {{ totalPages }}
      </span>

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
      const map = {
        1: "#FFA000",
        2: "#6366f1",
        3: "#4CAF50",
        4: "#EF5350"
      }
      return map[id] || "#1976D2"
    },

    getEmployeeTypeName(id) {
      const types = {
        1: "พนักงานปกติ",
        2: "พนักงานกะ",
        3: "กะ 12 ชม.",
        4: "รายชั่วโมง"
      }
      return types[id] || "ทั่วไป"
    },

    formatPeriod(period) {
      const periods = {
        'DURING_WORK': 'ในเวลางาน',
        'OUTSIDE_WORK': 'นอกเวลางาน',
        'BEFORE_WORK': 'ก่อนเริ่มงาน',
        'AFTER_WORK': 'หลังเลิกงาน'
      }
      return periods[period] || period
    },


    getDisplayTime(item) {

      // 1. พนักงานกะ + ทำงานในเวลา → ไม่ต้องแสดงอะไร
      if (
        item.employee_type_id !== 1 &&
        item.ot_period === "DURING_WORK"
      ) {
        return "-"
      }

      // 2. พนักงานปกติ + ทำงานในเวลา โชว์เวลา FIXED_TIME เท่านั้น
      if (
        item.employee_type_id === 1 &&
        item.ot_period === "DURING_WORK"
      ) {
        return item.start_time
          ? item.start_time.substring(0, 5) + " น."
          : "-"
      }

      // 3. กรณีอื่น ๆ ใช้ start_condition map
      const map = {
        AFTER_SHIFT: "หลังจบกะ",
        AFTER_WORK: "หลังเลิกงาน",
        BEFORE_WORK: "ก่อนเริ่มงาน",
        FIXED_TIME: "-"
      }

      return map[item.start_condition] || "-"
    },


    // =====================================

    async toggleStatus(item) {
      this.updatingId = item.id

      try {
        const newStatus = !item.is_active

        await api.put(`/api/otconfig/${item.id}`, {
          ...item,
          is_active: newStatus
        })

        this.$toast?.success("เปลี่ยนสถานะเรียบร้อยแล้ว")
        this.$emit("refresh")
      } catch (error) {
        this.$toast?.error("ไม่สามารถเปลี่ยนสถานะได้")
      } finally {
        this.updatingId = null
      }
    }
  },

  computed: {
    totalPages() {
      return Math.ceil(this.items.length / this.perPage) || 1
    },

    pagedItems() {
      const start = (this.page - 1) * this.perPage
      const end = start + this.perPage
      return this.items.slice(start, end)
    }
  },

  watch: {
    items() {
      this.page = 1
    }
  }
}
</script>

<style scoped>
.border-light {
  border: 1px solid #eef2f6 !important;
}

.custom-table ::v-deep thead th {
  background-color: #f1f5f9 !important;
  font-size: 13px !important;
  color: #64748b !important;
  font-weight: 600 !important;
}
</style>
