<template>
  <v-chip
    small
    class="status-chip font-weight-bold px-3"
    :color="statusConfig.bg"
    :text-color="statusConfig.text"
    style="border-radius: 6px; border: 1px solid transparent;"
    :style="{ borderColor: statusConfig.border }"
  >
    <v-icon left x-small class="mr-1" :color="statusConfig.text">
      mdi-circle
    </v-icon>

    <span class="text-caption" style="font-size: 13px !important; letter-spacing: 0.5px; font-weight: 500;">
      {{ statusConfig.label }}
    </span>
  </v-chip>
</template>

<script>
export default {
  name: "StatusBadge",
  props: {
    value: {
      type: [Number, String],
      required: true
    }
  },
  computed: {
    statusConfig() {
      // ใช้ชุดสีที่ Modern ขึ้น (Emerald, Amber, Rose, Slate)
      const map = {
        1: { 
          label: "รออนุมัติ", 
          bg: "#FFFBEB", // เหลืองอ่อนมาก
          text: "#B45309", // ส้มเข้ม
          border: "#FDE68A" // ขอบเหลืองจางๆ
        },
        2: { 
          label: "อนุมัติแล้ว", 
          bg: "#ECFDF5", // เขียว Emerald อ่อน
          text: "#047857", // เขียวเข้ม
          border: "#A7F3D0" 
        },
        3: { 
          label: "ไม่อนุมัติ", 
          bg: "#FEF2F2", // แดง Rose อ่อน
          text: "#B91C1C", // แดงเข้ม
          border: "#FECACA" 
        },
        4: { 
          label: "ยกเลิก", 
          bg: "#F1F5F9", // เทา Slate
          text: "#475569", // เทาเข้ม
          border: "#E2E8F0" 
        }
      };
      
      return map[this.value] || { label: "ไม่ระบุ", bg: "#F3F4F6", text: "#9CA3AF", border: "transparent" };
    }
  }
};
</script>

<style scoped>
/* เพิ่ม Effect ตอนเอาเมาส์ชี้ */
.status-chip {
  transition: all 0.2s ease-in-out;
}
.status-chip:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}
</style>