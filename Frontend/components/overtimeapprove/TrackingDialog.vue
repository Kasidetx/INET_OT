<template>
    <v-dialog v-model="visible" max-width="640" persistent>
        <v-card class="rounded-xl" style="overflow:hidden;">
            <div class="d-flex align-center justify-space-between px-6 py-4" style="background:#E3F2FD;">
                <div class="d-flex align-center">
                    <v-icon color="#1565C0" class="mr-2">mdi-clipboard-text-outline</v-icon>
                    <div>
                        <div class="font-weight-bold" style="color:#1565C0; font-size:18px;">
                            สถานะการเบิกค่าล่วงเวลา
                        </div>
                        <div class="caption grey--text">Tracking</div>
                    </div>
                </div>

                <v-btn icon @click="close">
                    <v-icon color="#1565C0">mdi-close</v-icon>
                </v-btn>
            </div>

            <v-card-text class="px-8 pt-6 pb-2">
                <div class="text-h6 font-weight-bold mb-4">ข้อมูลเอกสาร</div>

                <div class="d-flex align-center mb-3">
                    <div class="grey--text text--darken-1" style="min-width:140px;">สถานะ</div>
                    <div class="mr-3">:</div>
                    <v-chip small :color="statusChip.color" :text-color="statusChip.textColor" class="font-weight-bold">
                        {{ statusChip.label }}
                    </v-chip>
                </div>

                <div class="d-flex align-center mb-3">
                    <div class="grey--text text--darken-1" style="min-width:140px;">หมายเลขเอกสาร</div>
                    <div class="mr-3">:</div>
                    <div class="font-weight-bold">{{ docNo }}</div>
                </div>

                <div class="d-flex align-center mb-3">
                    <div class="grey--text text--darken-1" style="min-width:140px;">จำนวนชั่วโมงทั้งหมด</div>
                    <div class="mr-3">:</div>
                    <div class="font-weight-bold">{{ totalHours }}</div>
                </div>

                <div class="d-flex align-center mb-6">
                    <div class="grey--text text--darken-1" style="min-width:140px;">วันที่ทำรายการ</div>
                    <div class="mr-3">:</div>
                    <div class="font-weight-bold">{{ transDate }}</div>
                </div>

                <div class="text-subtitle-1 font-weight-bold mb-3">ลำดับการอนุมัติ</div>

                <div class="rounded-lg pa-4" style="border:1px solid #ECECEC; background:#FAFAFA;">
                    <div class="d-flex align-center">
                        <div class="step-dot mr-4" :class="step1.dotClass">1</div>
                        <div class="flex-grow-1">
                            <div class="font-weight-bold">ลำดับอนุมัติที่ 1</div>
                            <div class="caption grey--text text--darken-1">
                                {{ mockHead.title }}
                            </div>
                            <div class="caption grey--text text--darken-1">
                                {{ mockHead.name }}
                            </div>
                        </div>

                        <v-chip small :color="step1.chip.color" :text-color="step1.chip.textColor"
                            class="font-weight-bold">
                            {{ step1.chip.label }}
                        </v-chip>
                    </div>

                    <v-divider class="my-4"></v-divider>

                    <div v-if="showStep2" class="d-flex align-center">
                        <div class="step-dot mr-4" :class="step2.dotClass">2</div>
                        <div class="flex-grow-1">
                            <div class="font-weight-bold">ลำดับอนุมัติที่ 2</div>
                            <div class="caption grey--text text--darken-1">
                                {{ mockHr.title }}
                            </div>
                            <div class="caption grey--text text--darken-1">
                                {{ mockHr.name }}
                            </div>
                        </div>

                        <v-chip small :color="step2.chip.color" :text-color="step2.chip.textColor"
                            class="font-weight-bold">
                            {{ step2.chip.label }}
                        </v-chip>
                    </div>
                </div>

            </v-card-text>

            <v-card-actions class="justify-center pb-6">
                <v-btn color="#1565C0" class="white--text px-10 rounded-lg" height="44" @click="close">
                    ปิด
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "TrackingDialog",
    props: {
        value: { type: Boolean, default: false },
        item: { type: Object, default: null },
    },
    computed: {
        visible: {
            get() { return this.value },
            set(v) { this.$emit("input", v) }
        },

        // Mock Data (สามารถเปลี่ยนไปดึงจาก item ได้ถ้ามีข้อมูล)
        mockHead() {
            return { title: "หัวหน้า", name: "Dear" }
        },
        mockHr() {
            return { title: "HR", name: "Optra" }
        },

        statusId() {
            return Number(this.item?.status || 0)
        },

        // ✅ แก้ไข: รองรับชื่อตัวแปรที่หลากหลาย (reqNo, doc_no, docs_no)
        docNo() {
            if (!this.item) return "-";
            return this.item.docNo || "-";
        },
        
        totalHours() {
            return this.item?.hours || "-"
        },
        
        transDate() {
            return this.item?.transDate || "-"
        },

        showStep2() {
            // ถ้าสถานะเป็น 1 (รอหัวหน้า) หรือ 5 (หัวหน้าไม่อนุมัติ) -> ยังไม่ถึง HR
            return ![1, 5].includes(this.statusId)
        },

        // Chip สถานะด้านบนสุด
        statusChip() {
            const s = this.statusId
            const map = {
                1: { label: "รอหัวหน้าอนุมัติ", color: "#FFE8C2", textColor: "#B45309" },
                2: { label: "รอ HR อนุมัติ", color: "#FEF3C7", textColor: "#B45309" },
                3: { label: "อนุมัติแล้ว", color: "#DCFCE7", textColor: "#166534" },
                4: { label: "HR ไม่อนุมัติ", color: "#FEE2E2", textColor: "#991B1B" },
                5: { label: "หัวหน้าไม่อนุมัติ", color: "#FEE2E2", textColor: "#991B1B" },
                6: { label: "ยกเลิก", color: "#E5E7EB", textColor: "#374151" }
            }
            return map[s] || { label: "-", color: "#E5E7EB", textColor: "#374151" }
        },

        // Logic สถานะสำหรับ Step 1 (หัวหน้า)
        step1() {
            const s = this.statusId
            if (s === 1) return this.makeStep("pending")   // กำลังรอ
            if (s === 2 || s === 3 || s === 4) return this.makeStep("approved") // ผ่านแล้ว (ส่งต่อให้ HR หรือจบแล้ว)
            if (s === 5) return this.makeStep("rejected")  // ตกม้าตายตรงนี้
            if (s === 6) return this.makeStep("cancelled")
            return this.makeStep("waiting")
        },

        // Logic สถานะสำหรับ Step 2 (HR)
        step2() {
            const s = this.statusId
            if (s === 2) return this.makeStep("pending")   // ถึงคิว HR แล้ว
            if (s === 3) return this.makeStep("approved")  // HR อนุมัติแล้ว
            if (s === 4) return this.makeStep("rejected")  // HR ไม่อนุมัติ
            if (s === 6) return this.makeStep("cancelled")
            return this.makeStep("waiting") // ยังไม่ถึงคิว
        },
    },
    methods: {
        close() {
            this.$emit("input", false)
        },

        makeStep(state) {
            const cfg = {
                waiting: {
                    dotClass: "dot-wait",
                    chip: { label: "รออนุมัติ", color: "#F3F4F6", textColor: "#9CA3AF" }
                },
                pending: {
                    dotClass: "dot-pending",
                    chip: { label: "รอดำเนินการ", color: "#FFE8C2", textColor: "#B45309" }
                },
                approved: {
                    dotClass: "dot-approved",
                    chip: { label: "อนุมัติแล้ว", color: "#DCFCE7", textColor: "#166534" }
                },
                rejected: {
                    dotClass: "dot-rejected",
                    chip: { label: "ไม่อนุมัติ", color: "#FEE2E2", textColor: "#991B1B" }
                },
                cancelled: {
                    dotClass: "dot-cancelled",
                    chip: { label: "ยกเลิก", color: "#E5E7EB", textColor: "#374151" }
                }
            }
            return cfg[state] || cfg.waiting
        }
    }
}
</script>

<style scoped>
.step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
}

.dot-wait { background: #F3F4F6; color: #9CA3AF; }
.dot-pending { background: #FFE8C2; color: #B45309; }
.dot-approved { background: #DCFCE7; color: #166534; }
.dot-rejected { background: #FEE2E2; color: #991B1B; }
.dot-cancelled { background: #E5E7EB; color: #374151; }
</style>