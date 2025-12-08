<template>
  <div>
    <!-- Dialog ยืนยัน -->
    <v-dialog v-model="internalDialog" max-width="520" persistent>
      <v-card :style="{ borderRadius: '16px', overflow: 'hidden' }">
        <!-- Header -->
        <v-card-title
          class="d-flex justify-center align-center"
          style="position: relative; background-color: #e5efff;"
        >
          <span
            class="font-weight-bold text-center"
            style="font-size: 1.2rem; color: #0863b6;"
          >
            คำขอเบิกค่าล่วงเวลา
          </span>

          <v-btn
            icon
            @click="handleCancel"
            style="
              position: absolute;
              right: 16px;
              top: 50%;
              transform: translateY(-50%);
              min-width: 32px;
              height: 32px;
            "
          >
            <v-icon color="#0863B6">
              mdi-close
            </v-icon>
          </v-btn>
        </v-card-title>

        <!-- Body -->
        <v-card-text style="padding: 32px 40px 16px;">
          <div class="d-flex flex-column align-center text-center">
            <!-- รูปภาพ -->
            <v-img
              src="@/assets/overtime-request.png"
              max-width="220"
              contain
              class="mb-6"
            />

            <!-- ข้อความหลัก -->
            <p
              style="
                font-size: 20px;
                font-weight: 700;
                color: #0863b6;
                margin-bottom: 4px;
              "
            >
              ต้องการส่งคำขอเบิกค่าล่วงเวลาใช่หรือไม่
            </p>

            <!-- ข้อความรอง -->
            <p
              style="
                font-size: 16px;
                font-weight: 400;
                color: #777777;
                margin: 0;
              "
            >
              คุณแน่ใจหรือไม่ว่าต้องการส่งคำขอเบิกค่าล่วงเวลา
            </p>
          </div>
        </v-card-text>

        <!-- Footer -->
        <v-card-actions
          class="pb-8 pt-0"
          style="justify-content: center; gap: 16px;"
        >
          <v-btn
            outlined
            color="#0863B6"
            rounded
            min-width="100px"
            @click="handleCancel"
          >
            ยกเลิก
          </v-btn>

          <v-btn
            color="#0863B6"
            rounded
            min-width="100px"
            class="white--text"
            @click="handleConfirm"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ Dialog แสดงผลสำเร็จ -->
    <DialogOvertimeSuccess v-model="successDialog" />
  </div>
</template>

<script>
import DialogOvertimeSuccess from "@/components/timeattendance/DialogOvertimeSuccess.vue";

export default {
  name: "DialogOvertimeConfirm",
  components: {
    DialogOvertimeSuccess,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      internalDialog: this.value, // สำหรับ v-model ของ dialog ยืนยัน
      successDialog: false,       // สำหรับ dialog สำเร็จ
    };
  },
  watch: {
    value(val) {
      this.internalDialog = val;
    },
    internalDialog(val) {
      this.$emit("input", val); // รองรับ v-model จาก parent
    },
  },
  methods: {
    handleCancel() {
      this.internalDialog = false;
      this.$emit("cancel");
    },
    handleConfirm() {
      // แจ้ง parent ว่ามีการยืนยัน (เอาไว้ยิง API/logic ข้างนอก)
      this.$emit("confirm");

      // ปิด dialog ยืนยัน
      this.internalDialog = false;

      // เปิด dialog สำเร็จ
      this.successDialog = true;
    },
  },
};
</script>
