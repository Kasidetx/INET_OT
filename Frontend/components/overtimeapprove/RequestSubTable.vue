<template>
  <div class="pa-0 request-sub-container">

    <v-data-table v-if="!$vuetify.breakpoint.xsOnly" :headers="headers" :items="items" :item-key="itemKey"
      :show-select="selectable" v-model="modelProxy" hide-default-footer class="elevation-0 transparent-table" dense>
      <template v-slot:item.requestId="{ item }">
        <span class="font-weight-bold grey--text text--darken-2">{{ item.requestId }}</span>
      </template>

      <template v-slot:item.detail="{ item }">
        <div class="py-2">
          <div class="font-weight-bold text-body-2 mb-1">{{ item.detailTitle }}</div>
          <div class="grey--text caption">{{ item.detailDesc }}</div>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <Status :value="item.status" />
      </template>

      <template v-slot:item.action="{ item }">
        <v-btn icon small outlined color="grey lighten-1" style="border-color:#E0E0E0;" @click="$emit('view', item)">
          <v-icon color="primary" small>mdi-eye-outline</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <div v-else class="pa-3 bg-mobile-sub">
      <div v-if="selectable" class="d-flex align-center mb-2 px-1">
        <v-checkbox v-model="selectAllMobile" hide-details class="mt-0 pt-0 small-checkbox"
          label="เลือกทั้งหมด"></v-checkbox>
      </div>

      <div v-for="(item, index) in items" :key="item[itemKey]" class="sub-card mb-3 pa-3 rounded-lg white elevation-1">
        <div class="d-flex align-start">
          <div v-if="selectable" class="mr-3 pt-1">
            <v-checkbox v-model="modelProxy" :value="item" hide-details class="mt-0 pt-0" />
          </div>

          <div class="flex-grow-1">
            <div class="d-flex justify-space-between align-start mb-2">
              <div class="caption font-weight-bold grey--text">#{{ item.requestId }}</div>
              <Status :value="item.status" />
            </div>

            <div class="font-weight-bold text-body-2 mb-1">{{ item.detailTitle }}</div>
            <div class="caption grey--text text--darken-1 mb-2">{{ item.detailDesc }}</div>

            <v-divider class="mb-2 border-dashed"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <div class="caption grey--text">
                <v-icon x-small class="mr-1">mdi-calendar-clock</v-icon>
                {{ item.transDate }}
              </div>
              <div class="font-weight-bold primary--text">
                {{ item.hours }}
              </div>
            </div>

            <div class="mt-2 text-right">
              <v-btn small text color="primary" class="px-0" @click="$emit('view', item)">
                ดูรายละเอียด <v-icon right small>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import Status from "@/components/global/Status.vue";

export default {
  name: "RequestSubTable",
  components: { Status },
  props: {
    items: { type: Array, default: () => [] },
    selected: { type: Array, default: () => [] },
    itemKey: { type: String, default: "reqNo" },
    selectable: { type: Boolean, default: false }
  },
  computed: {
    modelProxy: {
      get() { return this.selected; },
      set(val) { this.$emit("update:selected", val); }
    },
    headers() {
      const h = [
        { text: "ลำดับ", value: "requestId", align: "center", sortable: false, class: "caption", width: "60px" },
        { text: "หมายเลขคำร้อง", value: "docNo", sortable: false, class: "caption" },
        { text: "รายละเอียด", value: "detail", sortable: false, class: "caption" },
        { text: "จำนวนชั่วโมง", value: "hours", align: "center", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่เริ่ม", value: "start", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่สิ้นสุด", value: "end", sortable: false, class: "caption" },
        { text: "สถานะ", value: "status", align: "center", sortable: false, class: "caption" },
        { text: "", value: "action", align: "center", sortable: false }
      ];
      if (this.selectable) {
        h.unshift({ text: "", value: "data-table-select", sortable: false, width: 48 });
      }
      return h;
    },
    selectAllMobile: {
      get() {
        return this.items.length > 0 && this.items.every(i => this.selected.includes(i));
      },
      set(val) {
        if (val) {
          this.$emit("update:selected", [...this.items]);
        } else {
          this.$emit("update:selected", []);
        }
      }
    }
  }
};
</script>

<style scoped>
.request-sub-container {
  border-top: 1px solid #eee;
}

.transparent-table {
  background: transparent !important;
}

.bg-mobile-sub {
  background-color: #F8F9FA;
  border-radius: 0 0 12px 12px;
}

.sub-card {
  border: 1px solid #eee;
}

.border-dashed {
  border-style: dashed;
  border-color: #eee;
}
</style>