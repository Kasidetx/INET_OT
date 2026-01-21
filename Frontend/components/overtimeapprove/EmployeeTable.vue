<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-bold primary--text mb-2 mb-sm-0">
        รายการเอกสารทั้งหมด {{ totalItems }} รายการ
      </h3>

      <div v-if="isSelectable" class="d-flex align-center w-full-mobile justify-end">
        <transition name="fade">
          <span v-if="value.length > 0" class="caption grey--text mr-3 font-weight-bold d-none d-sm-inline">
             เลือก {{ value.length }}
          </span>
        </transition>

        <v-btn depressed outlined class="rounded-lg px-4 mr-2 font-weight-bold flex-grow-1-mobile" height="40"
          :disabled="value.length === 0" :color="value.length > 0 ? 'error' : 'grey darken-1'" 
          @click="$emit('reject')">
          <v-icon left small>mdi-close</v-icon> ไม่อนุมัติ
        </v-btn>

        <v-btn v-if="showApprove" depressed class="rounded-lg px-4 font-weight-bold white--text flex-grow-1-mobile" height="40"
          :disabled="value.length === 0" :class="value.length > 0 ? 'success' : 'grey lighten-1'"
          @click="$emit('approve')">
          <v-icon left small>mdi-check</v-icon> อนุมัติ
        </v-btn>
      </div>
    </div>

    <v-data-table 
      v-if="!$vuetify.breakpoint.xsOnly"
      :headers="headers" 
      :items="items" 
      :expanded.sync="expanded" 
      show-expand 
      item-key="id"
      class="elevation-0 rounded-0 custom-table" 
      hide-default-footer 
      :loading="loading" 
      :items-per-page="-1"
    >
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

<div v-else>
  <div v-for="(item, index) in items" :key="item.id"
    class="mb-4 white rounded-xl elevation-2 overflow-hidden border-card">

    <div class="pa-4 relative" @click="toggleExpandMobile(item.id)">
      <div class="d-flex justify-space-between align-start">
        <div class="d-flex align-center">
          <v-avatar color="blue lighten-5" size="40" class="mr-3">
            <span class="blue--text font-weight-bold text-body-2">{{ item.empCode.slice(-2) }}</span>
          </v-avatar>
          <div>
            <div class="font-weight-bold text-body-1">{{ item.name }}</div>
            <div class="caption grey--text">{{ item.position }} | {{ item.empCode }}</div>
          </div>
        </div>

        <v-icon :class="{'rotate-180': mobileExpanded.includes(item.id)}" color="grey">
          mdi-chevron-down
        </v-icon>
      </div>

      <div class="mt-3 d-flex justify-space-between align-center pt-3" style="border-top: 1px dashed #eee;">
        <div class="caption grey--text">
          รายการ: <span class="black--text font-weight-bold">{{ item.itemsCount }}</span>
        </div>
        <div class="caption grey--text">
          รวมชั่วโมง: <span class="primary--text font-weight-bold" style="font-size: 1rem;">{{ item.totalHours }}</span>
        </div>
      </div>
    </div>

    <v-expand-transition>
      <div v-if="mobileExpanded.includes(item.id)">
        <RequestSubTable :items="item.requests" :selectable="isSelectable" :itemKey="'otId'"
          :selected.sync="selectedRequestsByEmp[item.id]" @view="onView" />
      </div>
    </v-expand-transition>

  </div>
</div>

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
    value: { type: Array, default: () => [] },
    isSelectable: { type: Boolean, default: false },
    showApprove: { type: Boolean, default: true }
  },
  data() {
    return {
      expanded: [], // Desktop
      mobileExpanded: [], // Mobile
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
        const seen = new Set();
        const unique = [];
        for (const it of all) {
          const k = it?.otId;
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
    },
    toggleExpandMobile(id) {
      const index = this.mobileExpanded.indexOf(id);
      if (index === -1) {
        this.mobileExpanded.push(id);
      } else {
        this.mobileExpanded.splice(index, 1);
      }
    }
  }
};
</script>

<style scoped>
.custom-table.v-data-table {
  border: 1px solid #E0E0E0;
}

.custom-table .v-data-table-header th {
  background: #EEEEEE !important;
  font-weight: 700 !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.border-card {
  border: 1px solid #e0e0e0;
}

.rotate-180 {
  transform: rotate(180deg);
}

@media (max-width: 600px) {
  .w-full-mobile {
    width: 100%;
  }

  .flex-grow-1-mobile {
    flex-grow: 1;
  }
}
</style><template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-bold primary--text mb-2 mb-sm-0">
        รายการเอกสารทั้งหมด {{ totalItems }} รายการ
      </h3>

      <div v-if="isSelectable" class="d-flex align-center w-full-mobile justify-end">
        <transition name="fade">
          <span v-if="value.length > 0" class="caption grey--text mr-3 font-weight-bold d-none d-sm-inline">
            เลือก {{ value.length }}
          </span>
        </transition>

        <v-btn depressed outlined class="rounded-lg px-4 mr-2 font-weight-bold flex-grow-1-mobile" height="40"
          :disabled="value.length === 0" :color="value.length > 0 ? 'error' : 'grey darken-1'" @click="$emit('reject')">
          <v-icon left small>mdi-close</v-icon> ไม่อนุมัติ
        </v-btn>

        <v-btn v-if="showApprove" depressed class="rounded-lg px-4 font-weight-bold white--text flex-grow-1-mobile"
          height="40" :disabled="value.length === 0" :class="value.length > 0 ? 'success' : 'grey lighten-1'"
          @click="$emit('approve')">
          <v-icon left small>mdi-check</v-icon> อนุมัติ
        </v-btn>
      </div>
    </div>

    <v-data-table v-if="!$vuetify.breakpoint.xsOnly" :headers="headers" :items="items" :expanded.sync="expanded"
      show-expand item-key="id" class="elevation-0 rounded-0 custom-table" hide-default-footer :loading="loading"
      :items-per-page="-1">
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

    <div v-else>
      <div v-for="(item, index) in items" :key="item.id"
        class="mb-4 white rounded-xl elevation-2 overflow-hidden border-card">

        <div class="pa-4 relative" @click="toggleExpandMobile(item.id)">
          <div class="d-flex justify-space-between align-start">
            <div class="d-flex align-center">
              <v-avatar color="blue lighten-5" size="40" class="mr-3">
                <span class="blue--text font-weight-bold text-body-2">{{ item.empCode.slice(-2) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-bold text-body-1">{{ item.name }}</div>
                <div class="caption grey--text">{{ item.position }} | {{ item.empCode }}</div>
              </div>
            </div>

            <v-icon :class="{ 'rotate-180': mobileExpanded.includes(item.id) }" color="grey">
              mdi-chevron-down
            </v-icon>
          </div>

          <div class="mt-3 d-flex justify-space-between align-center pt-3" style="border-top: 1px dashed #eee;">
            <div class="caption grey--text">
              รายการ: <span class="black--text font-weight-bold">{{ item.itemsCount }}</span>
            </div>
            <div class="caption grey--text">
              รวมชั่วโมง: <span class="primary--text font-weight-bold" style="font-size: 1rem;">{{ item.totalHours
                }}</span>
            </div>
          </div>
        </div>

        <v-expand-transition>
          <div v-if="mobileExpanded.includes(item.id)">
            <RequestSubTable :items="item.requests" :selectable="isSelectable" :itemKey="'otId'"
              :selected.sync="selectedRequestsByEmp[item.id]" @view="onView" />
          </div>
        </v-expand-transition>

      </div>
    </div>

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
    value: { type: Array, default: () => [] },
    isSelectable: { type: Boolean, default: false },
    showApprove: { type: Boolean, default: true }
  },
  data() {
    return {
      expanded: [], // Desktop
      mobileExpanded: [], // Mobile
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
        const seen = new Set();
        const unique = [];
        for (const it of all) {
          const k = it?.otId;
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
    },
    toggleExpandMobile(id) {
      const index = this.mobileExpanded.indexOf(id);
      if (index === -1) {
        this.mobileExpanded.push(id);
      } else {
        this.mobileExpanded.splice(index, 1);
      }
    }
  }
};
</script>

<style scoped>
.custom-table.v-data-table {
  border: 1px solid #E0E0E0;
}

.custom-table .v-data-table-header th {
  background: #EEEEEE !important;
  font-weight: 700 !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.border-card {
  border: 1px solid #e0e0e0;
}

.rotate-180 {
  transform: rotate(180deg);
}

@media (max-width: 600px) {
  .w-full-mobile {
    width: 100%;
  }

  .flex-grow-1-mobile {
    flex-grow: 1;
  }
}
</style>