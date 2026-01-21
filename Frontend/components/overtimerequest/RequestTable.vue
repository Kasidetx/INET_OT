<template>
  <v-card outlined elevation="0" class="white rounded-xl border-light pa-4">
    <div class="d-flex flex-wrap justify-space-between align-center mb-4">
      <span class="text-h6 font-weight-bold primary--text">รายการเอกสารทั้งหมด {{ filteredItems.length }} รายการ</span>

      <div v-if="showSelect && selected.length > 0" class="mt-2 mt-sm-0 w-full-mobile">
        <v-btn color="#D1392B" dark depressed @click="$emit('bulk-cancel')"
          class="rounded-lg px-6 subtitle-2 w-full-mobile" height="40">
          <v-icon left>mdi-delete-sweep</v-icon>
          ยกเลิกคำร้องขอ ({{ selected.length }})
        </v-btn>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-if="!$vuetify.breakpoint.xsOnly" class="border-light rounded-0 overflow-hidden">
      <v-simple-table v-if="!loading && paginatedItems.length > 0">
        <template #default>
          <thead>
            <tr class="blue lighten-5">
              <th v-if="showSelect" class="text-center" width="50">
                <v-checkbox :input-value="selectAll" @change="toggleSelectAll" hide-details class="mt-0 pt-0" />
              </th>
              <th v-for="(h, i) in headers" :key="i" :class="h.class || 'text-left'" :width="h.width">
                {{ h.text }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item) in paginatedItems" :key="item.id" class="hover-row">
              <td v-if="showSelect" class="text-center">
                <v-checkbox v-model="localSelected" :value="item.id" hide-details class="mt-0 pt-0" />
              </td>

              <td class="font-weight-bold text-center grey--text text--darken-2">{{ item.request_no }}</td>
              <td class="font-weight-medium text-center">{{ item.docs_no }}</td>
              <td class="black--text text-body-2">{{ item.title }}</td>
              <td>
                <div class="font-weight-medium">{{ item.startDate }}</div>
                <div class="grey--text caption">{{ item.startTime }}</div>
              </td>
              <td>
                <div class="font-weight-medium">{{ item.endDate }}</div>
                <div class="grey--text caption">{{ item.endTime }}</div>
              </td>
              <td class="text-center font-weight-bold">{{ item.hours }}</td>
              <td class="text-center">
                <Status :value="item.status" />
              </td>
              <td class="text-center">
                <v-btn icon small @click="$emit('view', item)" class="mr-1 btn-view">
                  <v-icon small color="primary">mdi-eye-outline</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </div>

    <div v-else class="pa-4 bg-gray-light">

      <div v-if="showSelect && paginatedItems.length > 0" class="d-flex align-center mb-3 ml-1">
        <v-checkbox :input-value="selectAll" @change="toggleSelectAll" hide-details class="mt-0 pt-0 big-checkbox"
          label="เลือกทั้งหมดในหน้านี้"></v-checkbox>
      </div>

      <div v-for="(item, index) in paginatedItems" :key="item.id" class="mobile-card mb-4">
        <div class="d-flex align-start">
          <div v-if="showSelect" class="mr-3 pt-1">
            <v-checkbox v-model="localSelected" :value="item.id" hide-details class="mt-0 pt-0 big-checkbox" />
          </div>

          <div class="flex-grow-1">
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <div class="caption grey--text">เลขที่เอกสาร</div>
                <div class="font-weight-bold text-body-1 primary--text">{{ item.docs_no }}</div>
              </div>
              <Status :value="item.status" />
            </div>

            <v-divider class="mb-3 border-dashed"></v-divider>

            <div class="mb-3">
              <div class="font-weight-bold text-body-2 mb-1">{{ item.title }}</div>
              <div class="d-flex align-center mt-1">
                <v-icon x-small color="grey" class="mr-1">mdi-clock-outline</v-icon>
                <span class="caption grey--text">{{ item.hours }}</span>
              </div>
            </div>

            <div class="date-time-box rounded pa-2 mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="caption grey--text">เริ่ม:</span>
                <span class="caption font-weight-bold">{{ item.startDate }} <span class="primary--text">{{
                  item.startTime
                    }}</span></span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="caption grey--text">สิ้นสุด:</span>
                <span class="caption font-weight-bold">{{ item.endDate }} <span class="primary--text">{{ item.endTime
                    }}</span></span>
              </div>
            </div>

            <v-btn block outlined color="primary" class="rounded-lg" @click="$emit('view', item)">
              <v-icon left small>mdi-file-document-outline</v-icon>
              ดูรายละเอียด
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredItems.length > 0" class="d-flex align-center justify-end mt-4">
      <span class="caption grey--text mr-3">จำนวนแถว</span>
      <v-select v-model="perPage" :items="[10, 20, 50]" dense outlined hide-details class="rounded-lg caption"
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
    </div>

    <div v-if="!loading && filteredItems.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey lighten-2">mdi-file-document-off-outline</v-icon>
      <div class="grey--text mt-2">ไม่พบรายการเอกสาร</div>
    </div>

  </v-card>
</template>

<script>
import Status from "@/components/global/Status.vue";
export default {
  components: { Status },
  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    selected: { type: Array, default: () => [] },
    showSelect: { type: Boolean, default: false }
  },
  data() {
    return {
      page: 1,
      perPage: 10,
      headers: [
        { text: "ลำดับ", width: "50", class: "text-center" },
        { text: "เลขที่คำร้อง", class: "text-center" },
        { text: "รายละเอียด" },
        { text: "วัน-เวลาที่เริ่ม" },
        { text: "วัน-เวลาที่สิ้นสุด" },
        { text: "ชั่วโมง", class: "text-center" },
        { text: "สถานะ", class: "text-center" },
        { text: "จัดการ", width: "80", class: "text-center" },
      ]
    };
  },
  computed: {
    filteredItems() { return this.items; },
    pageCount() {
      const c = Math.ceil(this.filteredItems.length / this.perPage);
      return c > 0 ? c : 1;
    },
    paginatedItems() {
      const start = (this.page - 1) * this.perPage;
      return this.filteredItems.slice(start, start + this.perPage);
    },
    paginationMeta() {
      const total = this.filteredItems.length;
      if (total === 0) return '0 จาก 0';
      const start = (this.page - 1) * this.perPage + 1;
      const end = Math.min(this.page * this.perPage, total);
      return `${start}-${end} จาก ${total}`;
    },
    localSelected: {
      get() { return this.selected; },
      set(val) { this.$emit('update:selected', val); }
    },
    selectAll() {
      return this.paginatedItems.length > 0 && this.paginatedItems.every(i => this.localSelected.includes(i.id));
    }
  },
  watch: {
    items() { this.page = 1; }
  },
  methods: {
    toggleSelectAll() {
      if (this.selectAll) {
        const newSelected = this.localSelected.filter(id => !this.paginatedItems.find(i => i.id === id));
        this.$emit('update:selected', newSelected);
      } else {
        const newSelected = [...this.localSelected];
        this.paginatedItems.forEach(item => {
          if (!newSelected.includes(item.id)) newSelected.push(item.id);
        });
        this.$emit('update:selected', newSelected);
      }
    }
  }
};
</script>

<style scoped>
.border-light {
  border: 1px solid #e0e0e0;
}

/* --- Mobile Card Style --- */
.bg-gray-light {
  background-color: #F8F9FA;
}

.mobile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.date-time-box {
  background-color: #F3F7FA;
  border: 1px solid #E3F2FD;
}

.border-dashed {
  border-style: dashed;
  border-color: #eee;
}

/* Checkbox ใหญ่ขึ้นบนมือถือ */
.big-checkbox ::v-deep .v-icon {
  font-size: 24px;
}

/* ปุ่มเต็มจอบนมือถือ */
@media (max-width: 600px) {
  .w-full-mobile {
    width: 100% !important;
  }
}

/* Table Hover Effect */
.hover-row:hover {
  background-color: #f5faff !important;
}

.btn-view:hover {
  background-color: #e3f2fd;
}
</style>