<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-bold primary--text">
        รายการเอกสารทั้งหมด {{ totalItems }} รายการ
      </h3>

      <div v-if="isSelectable" class="d-flex align-center">
        <transition name="fade">
          <span v-if="value.length > 0" class="caption grey--text mr-4 font-weight-bold">
            เลือกแล้ว {{ value.length }} รายการ
          </span>
        </transition>

        <v-btn depressed outlined class="rounded-lg px-6 mr-3 font-weight-bold" height="40"
          :disabled="value.length === 0" :color="value.length > 0 ? 'error' : 'grey darken-1'" @click="$emit('reject')">
          ไม่อนุมัติ
        </v-btn>

        <v-btn v-if="showApprove" depressed class="rounded-lg px-6 font-weight-bold white--text" height="40"
          :disabled="value.length === 0" :class="value.length > 0 ? 'success' : 'grey lighten-1'"
          @click="$emit('approve')">
          อนุมัติ
        </v-btn>
      </div>
    </div>

    <v-data-table :headers="headers" :items="items" :expanded.sync="expanded" show-expand item-key="id"
      class="elevation-0 rounded-0 custom-table" hide-default-footer :loading="loading" :items-per-page="-1">
      <template v-slot:item.data-table-expand="{ expand, isExpanded }">
        <v-btn icon small @click="expand(!isExpanded)">
          <v-icon :color="isExpanded ? 'primary' : 'grey'">
            {{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-btn>
      </template>

      <template v-slot:item.totalHours="{ item }">
        <span class="font-weight-bold grey--text text--darken-3">{{ item.totalHours }}</span>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="pa-0 white">

          <RequestSubTable :items="item.requests" :selectable="isSelectable" :itemKey="'otId'"
            :selected.sync="selectedRequestsByEmp[item.id]" @view="onView" />

        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import RequestSubTable from "./RequestSubTable.vue";

export default {
  name: "EmployeeTable",
  components: { RequestSubTable },
  props: {
    items: { type: Array, default: () => [] },
    totalItems: { type: Number, default: 0 },
    loading: Boolean,
    value: { type: Array, default: () => [] }, // v-model
    isSelectable: { type: Boolean, default: false },
    showApprove: { type: Boolean, default: true }
  },
  data() {
    return {
      expanded: [],
      selectedRequestsByEmp: {},
      headers: [
        { text: "ลำดับ", value: "rank", align: "center", sortable: false, width: "50px" },
        { text: "รหัสพนักงาน", value: "empCode", sortable: false, class: "grey--text text--darken-2" },
        { text: "ชื่อ-นามสกุล", value: "name", sortable: false, class: "font-weight-bold" },
        { text: "ตำแหน่ง", value: "position", sortable: false },
        { text: "จำนวนรายการ", value: "itemsCount", align: "center", sortable: false },
        { text: "รวมชั่วโมง", value: "totalHours", align: "center", sortable: false },
        { text: "", value: "data-table-expand", align: "end" }
      ],
    };
  },
  watch: {
    items: {
      immediate: true,
      deep: true,
      handler(list) {
        (list || []).forEach(emp => {
          if (this.selectedRequestsByEmp[emp.id] === undefined) {
            this.$set(this.selectedRequestsByEmp, emp.id, []);
          }
        });
      }
    },
    value(val) {
      if (val.length === 0) {
        // เช็คว่าข้างในมีค่าค้างอยู่ไหม ถ้ามีให้ล้างออก
        const hasSelection = Object.values(this.selectedRequestsByEmp).some(arr => arr && arr.length > 0);

        if (hasSelection) {
          Object.keys(this.selectedRequestsByEmp).forEach(key => {
            this.selectedRequestsByEmp[key] = [];
          });
        }
      }
    },
    selectedRequestsByEmp: {
      deep: true,
      handler(val) {
        const all = Object.values(val).flat();
        // ใช้ otId เพื่อกันซ้ำแทน reqNo
        const seen = new Set();
        const unique = [];
        for (const it of all) {
          const k = it?.otId; // ✅ ใช้ otId
          if (!k) continue;
          if (seen.has(k)) continue;
          seen.add(k);
          unique.push(it);
        }
        this.$emit("input", unique);
      }
    },
  },
  methods: {
    onView(reqItem) {
      this.$emit("view", reqItem)
    }
  }
};
</script>

<style>
.custom-table.v-data-table {
  border: 1px solid #E0E0E0;
}

.custom-table .v-data-table-header th {
  background: #EEEEEE !important;
  color: #424242 !important;
  font-weight: 700 !important;
}

.success {
  background: #4CAF50 !important;
  border-color: #4CAF50 !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>