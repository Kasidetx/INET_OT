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
                    <Status :value="docStatus" />
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

                <div v-if="loading" class="d-flex justify-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>

                <div v-else class="rounded-lg pa-4" style="border:1px solid #ECECEC; background:#FAFAFA;">
                    
                    <div class="d-flex align-center">
                        <div class="step-dot mr-4" :class="getDotClass(step1Id)">1</div>
                        <div class="flex-grow-1">
                            <div class="font-weight-bold">ลำดับอนุมัติที่ 1 (หัวหน้างาน)</div>
                            <div class="caption grey--text text--darken-1">
                                {{ headApprover.name }}
                            </div>
                            <div class="caption grey--text text--darken-1">
                                {{ headApprover.actionDate }}
                            </div>
                            <div v-if="headApprover.reason" class="caption red--text mt-1">
                                หมายเหตุ: {{ headApprover.reason }}
                            </div>
                        </div>

                        <Status :value="step1Id" />
                    </div>

                    <v-divider class="my-4"></v-divider>

                    <div class="d-flex align-center">
                        <div class="step-dot mr-4" :class="getDotClass(step2Id)">2</div>
                        <div class="flex-grow-1">
                            <div class="font-weight-bold">ลำดับอนุมัติที่ 2 (HR)</div>
                            <div class="caption grey--text text--darken-1">
                                {{ hrApprover.name }}
                            </div>
                            <div class="caption grey--text text--darken-1">
                                {{ hrApprover.actionDate }}
                            </div>
                            <div v-if="hrApprover.reason" class="caption red--text mt-1">
                                หมายเหตุ: {{ hrApprover.reason }}
                            </div>
                        </div>

                        <Status :value="step2Id" />
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
import api from "~/service/api";
import Status from "@/components/global/Status.vue"; // ✅ Import Component

export default {
    name: "TrackingDialog",
    components: { Status }, // ✅ Register Component
    props: {
        value: { type: Boolean, default: false },
        item: { type: Object, default: null },
    },
    data() {
        return {
            loading: false,
            approvalHistory: []
        };
    },
    computed: {
        visible: {
            get() { return this.value },
            set(v) { this.$emit("input", v) }
        },
        docStatus() {
            return Number(this.item?.status || 0)
        },
        
        // ข้อมูล Header (ดึงจาก props item)
        docNo() { return this.item?.docNo || "-" },
        totalHours() { return this.item?.hours || "-" },
        transDate() { return this.item?.transDate || "-" },

        // --- ดึงข้อมูลผู้อนุมัติจาก History ---
        headApprover() {
            const log = this.approvalHistory.find(x => x.level === 1);
            return {
                name: log ? (log.approve_name || log.approve_emp) : '-',
                actionDate: log && log.action_at ? this.formatDate(log.action_at) : '',
                status: log ? Number(log.approval_status) : 1,
                reason: log ? log.reason : ''
            };
        },
        hrApprover() {
            const log = this.approvalHistory.find(x => x.level === 2);
            return {
                name: log ? (log.approve_name || log.approve_emp) : '-',
                actionDate: log && log.action_at ? this.formatDate(log.action_at) : '',
                status: log ? Number(log.approval_status) : 1,
                reason: log ? log.reason : ''
            };
        },

        // --- ✅ Logic คำนวณ Status ID สำหรับส่งให้ Component ---
        
        // สถานะของ Step 1 (หัวหน้า)
        step1Id() {
            if (this.docStatus === 6) return 6; // ยกเลิก
            
            const s = this.headApprover.status;
            if (s === 3) return 3; // อนุมัติ (เขียว)
            if (s === 4) return 4; // หัวหน้าไม่อนุมัติ (แดง)
            
            return 1; // รอหัวหน้าอนุมัติ (ส้ม) - Default
        },

        // สถานะของ Step 2 (HR)
        step2Id() {
            if (this.docStatus === 6) return 6; // ยกเลิก
            
            // ถ้าหัวหน้า Reject -> HR = รอดำเนินการ (0) หรือจะใช้สถานะอื่นตามต้องการ
            if (this.docStatus === 4) return 0; 

            const s = this.hrApprover.status;
            if (s === 3) return 3; // อนุมัติ (เขียว)
            if (s === 5) return 5; // HR ไม่อนุมัติ (แดง)

            // ถ้าภาพรวมผ่านหัวหน้ามาแล้ว (Status >= 2) -> HR ต้องเป็น "รออนุมัติ" (2)
            if (this.docStatus >= 2) return 2; // รอ HR อนุมัติ (ส้ม)

            return 0; // ยังไม่ถึงคิว -> รอดำเนินการ (เหลืองอ่อน/เทา ตาม Config)
        }
    },
    watch: {
        value: {
            immediate: true, // ✅ โหลดทันทีที่เปิด
            handler(val) {
                if (val && this.item?.requestId) {
                    this.fetchHistory();
                }
            }
        }
    },
    methods: {
        close() {
            this.$emit("input", false)
        },
        async fetchHistory() {
            this.loading = true;
            this.approvalHistory = [];
            try {
                // เรียก API
                const res = await api.get(`/api/approval/request/${this.item.requestId}`);
                if (res.data) {
                    this.approvalHistory = Array.isArray(res.data) ? res.data : [];
                }
            } catch (err) {
                console.error("Tracking Error:", err);
            } finally {
                this.loading = false;
            }
        },
        formatDate(isoString) {
            if (!isoString) return "";
            const d = new Date(isoString);
            return d.toLocaleString("th-TH", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
        },

        // ✅ Helper เลือกสีจุดวงกลม (Dot) ตาม Status ID
        // (Mapping ให้ตรงกับ Theme ของ Status Component)
        getDotClass(statusId) {
            switch (statusId) {
                case 3: return 'dot-approved';  // 3=อนุมัติ (เขียว)
                case 4: 
                case 5: return 'dot-rejected';  // 4,5=ไม่อนุมัติ (แดง)
                case 1: 
                case 2: return 'dot-pending';   // 1,2=รออนุมัติ (ส้ม)
                case 6: return 'dot-cancelled'; // 6=ยกเลิก (เทา)
                default: return 'dot-wait';     // 0=รอดำเนินการ (เทาอ่อน)
            }
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

/* Map สี Dot */
.dot-wait { background: #F3F4F6; color: #9CA3AF; }      /* ID 0 */
.dot-pending { background: #FFE8C2; color: #B45309; }   /* ID 1, 2 */
.dot-approved { background: #DCFCE7; color: #166534; }  /* ID 3 */
.dot-rejected { background: #FEE2E2; color: #991B1B; }  /* ID 4, 5 */
.dot-cancelled { background: #E5E7EB; color: #374151; } /* ID 6 */
</style>