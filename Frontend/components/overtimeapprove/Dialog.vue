<template>
  <v-dialog
    v-model="visible"
    :max-width="step === 'success' ? 520 : (type === 'approve' ? 520 : 820)"
    :scrollable="step !== 'success' && type !== 'approve'"
    persistent
  >
    <v-card class="rounded-xl" style="overflow:hidden; max-height:90vh;">

      <!-- ===================== SUCCESS ===================== -->
      <template v-if="step === 'success'">
        <v-card-title class="d-flex align-center justify-center px-4 py-3" style="position: relative;">
          <span class="font-weight-bold text-h6" style="color:#1565C0;">
            {{ type === 'approve' ? 'อนุมัติคำร้องเบิกค่าล่วงเวลา' : 'ไม่อนุมัติคำร้องเบิกค่าล่วงเวลา' }}
          </span>

          <v-btn icon color="#1565C0" @click="closeSuccess" style="position:absolute; right: 12px;">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="px-6 pt-8 pb-8 text-center">
          <div class="mb-5 d-flex justify-center">
            <v-avatar size="140" color="green lighten-1">
              <v-icon size="90" color="white">mdi-check</v-icon>
            </v-avatar>
          </div>

          <div class="text-h6 font-weight-bold" style="color:#1565C0;">
            {{ type === 'approve'
              ? 'คุณได้ทำการอนุมัติคำขอเบิกค่าล่วงเวลาเรียบร้อยแล้ว'
              : 'คุณได้ทำการไม่อนุมัติคำขอเบิกค่าล่วงเวลาเรียบร้อยแล้ว'
            }}
          </div>
        </v-card-text>
      </template>

      <!-- ===================== CONFIRM ===================== -->
      <template v-else>
        <!-- APPROVE (แบบง่าย) -->
        <template v-if="type === 'approve'">
          <v-card-title class="d-flex align-center justify-center px-4 py-3" style="position: relative;">
            <span class="font-weight-bold text-h6" style="color:#1565C0;">
              อนุมัติคำร้องเบิกค่าล่วงเวลา
            </span>

            <v-btn icon color="#1565C0" @click="close" style="position:absolute; right: 12px;">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="px-6 pt-6 pb-2 text-center">
            <div class="mb-4 d-flex justify-center">
              <v-avatar size="150" color="blue lighten-5">
                <v-icon size="90" color="primary">mdi-clipboard-check-outline</v-icon>
              </v-avatar>
            </div>

            <div class="text-h6 font-weight-bold mb-2">
              ต้องการอนุมัติคำร้องใช่หรือไม่
            </div>
            <div class="grey--text text--darken-1">
              คุณแน่ใจหรือไม่ว่าต้องการอนุมัติคำร้องเบิกค่าล่วงเวลา
            </div>

            <div class="mt-3 caption grey--text">
              เลือกแล้ว {{ safeItems.length }} รายการ
            </div>
          </v-card-text>

          <v-card-actions class="justify-center pb-8 pt-6 px-6">
            <v-btn outlined color="primary" class="px-10 rounded-lg font-weight-bold" height="44" @click="close">
              ยกเลิก
            </v-btn>

            <v-btn color="primary" class="px-10 ml-4 rounded-lg font-weight-bold white--text" height="44" @click="confirm">
              ยืนยัน
            </v-btn>
          </v-card-actions>
        </template>

        <!-- REJECT (แบบละเอียด) -->
        <template v-else>
          <v-card-title
            class="d-flex justify-center align-center px-4 py-3"
            style="background-color:#E3F2FD; position:relative;"
          >
            <span class="font-weight-bold text-h6" style="color:#1565C0;">
              ไม่อนุมัติคำร้องเบิกค่าล่วงเวลา
            </span>

            <v-btn icon color="#1565C0" @click="close" style="position:absolute; right: 12px;">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="px-6 pt-6">
            <div class="text-center mb-6">
              <div class="text-h6 font-weight-bold primary--text mb-2">
                ต้องการไม่อนุมัติคำร้องขอใช่หรือไม่
              </div>
              <div class="grey--text text--darken-1" style="font-size:1rem;">
                คุณแน่ใจหรือไม่ว่าต้องการไม่อนุมัติคำร้องขอ
              </div>
              <div class="mt-2 caption grey--text">
                เลือกแล้ว {{ safeItems.length }} รายการ
              </div>
            </div>

            <div class="pa-4 grey lighten-4 rounded-lg mb-4 custom-scroll" style="height:320px; overflow-y:auto;">
              <v-card
                v-for="(it, i) in safeItems"
                :key="(it.otId || it.reqNo) || i"
                class="mb-4 rounded-lg elevation-0 white pa-5"
              >
                <div class="font-weight-bold mb-4 text-h6 text--primary">รายการที่ {{ i + 1 }}</div>

                <v-row>
                  <v-col cols="12" md="6" class="py-1">
                    <div class="info-row">
                      <span class="info-label">หมายเลขเอกสาร</span><span class="info-sep">:</span>
                      <span class="info-value">{{ it.reqNo }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6" class="py-1">
                    <div class="info-row">
                      <span class="info-label">วันที่ทำงาน</span><span class="info-sep">:</span>
                      <span class="info-value">{{ it.transDate }}</span>
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </div>

            <div>
              <div class="font-weight-bold mb-2" style="font-size:1rem;">เหตุผลที่ไม่อนุมัติคำร้อง</div>
              <v-textarea
                v-model="reason"
                outlined
                placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติคำร้อง"
                rows="3"
                hide-details
                class="rounded-lg"
              />
            </div>
          </v-card-text>

          <v-card-actions class="justify-center pb-8 pt-4 px-6">
            <v-btn outlined color="primary" class="px-12 rounded-lg font-weight-bold" height="44" @click="close">
              ยกเลิก
            </v-btn>

            <v-btn
              class="px-12 ml-4 rounded-lg font-weight-bold"
              height="44"
              :color="reason.trim() ? 'primary' : 'grey lighten-1'"
              :disabled="!reason.trim()"
              @click="confirm"
            >
              ยืนยัน
            </v-btn>
          </v-card-actions>
        </template>
      </template>

    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "Dialog",
  props: {
    value: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
    type: { type: String, default: "approve" },

    // ✅ parent จะส่ง true มาตอน update สำเร็จ
    success: { type: Boolean, default: false }
  },
  data() {
    return {
      reason: "",
      step: "confirm" // confirm | success
    };
  },
  computed: {
    visible: {
      get() { return this.value; },
      set(v) { this.$emit("input", v); }
    },
    safeItems() {
      return Array.isArray(this.items) ? this.items : [];
    }
  },
  watch: {
    value(v) {
      if (v) {
        this.reason = "";
        this.step = "confirm";
      }
    },
    success(v) {
      if (v) this.step = "success";
    }
  },
  methods: {
    close() {
      this.$emit("input", false);
    },
    closeSuccess() {
      this.$emit("done"); // ให้ parent reset success + เคลียร์ selection
      this.$emit("input", false);
    },
    confirm() {
      this.$emit("confirm", {
        type: this.type,
        reason: this.reason,
        items: this.safeItems
      });
    }
  }
};
</script>

<style scoped>
.info-row { display:flex; align-items:baseline; font-size:1rem; line-height:2; }
.info-label { color:#757575; min-width:110px; flex-shrink:0; }
.info-sep { margin-right:12px; color:#757575; }
.info-value { font-weight:600; color:#000; word-break:break-word; }

.custom-scroll::-webkit-scrollbar { width: 8px; }
.custom-scroll::-webkit-scrollbar-track { background:#f1f1f1; border-radius:4px; }
.custom-scroll::-webkit-scrollbar-thumb { background:#c1c1c1; border-radius:4px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background:#a8a8a8; }
</style>
