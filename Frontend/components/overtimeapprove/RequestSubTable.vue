<template>
  <div class="pa-0" style="border-top: 1px solid #eee;">
    <v-data-table 
      :headers="headers" 
      :items="items" 
      :item-key="itemKey" 
      :show-select="selectable"
      v-model="modelProxy" 
      hide-default-footer 
      class="elevation-0 transparent-table" 
      dense
    >
      <template v-slot:item.requestId="{ item }">
        <span class="font-weight-bold grey--text text--darken-2">{{ item.requestId }}</span>
      </template>

      <template v-slot:item.detail="{ item }">
        <div class="py-3">
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
    itemKey: { type: String, default: "reqNo" }, // ค่า default (แต่เราส่ง otId มาทับแล้ว)
    selectable: { type: Boolean, default: false }
  },
  computed: {
    // ✅ ใช้ Computed แทน Data/Watch เพื่อความแม่นยำในการ Sync ข้อมูล
    modelProxy: {
      get() {
        return this.selected;
      },
      set(val) {
        this.$emit("update:selected", val);
      }
    },
    headers() {
      const h = [
        { text: "ลำดับ", value: "requestId", align: "center", sortable: false, class: "caption", width: "80px" },
        { text: "หมายเลขคำร้อง", value: "docNo", sortable: false, class: "caption" },
        { text: "รายละเอียด", value: "detail", sortable: false, class: "caption" },
        { text: "จำนวนชั่วโมง", value: "hours", align: "center", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่เริ่ม", value: "start", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่สิ้นสุด", value: "end", sortable: false, class: "caption" },
        { text: "วันที่ทำรายการ", value: "transDate", sortable: false, class: "caption" },
        { text: "สถานะ", value: "status", align: "center", sortable: false, class: "caption" },
        { text: "", value: "action", align: "center", sortable: false }
      ];

      if (this.selectable) {
        h.unshift({ text: "", value: "data-table-select", sortable: false, width: 48 });
      }

      return h;
    }
  }
  // ❌ ลบ watch และ data เดิมออกได้เลยครับ เพื่อไม่ให้ตีกัน
};
</script>

<style scoped>
.transparent-table {
  background: transparent !important;
}
</style>