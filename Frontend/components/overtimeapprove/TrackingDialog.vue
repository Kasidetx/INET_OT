<template>
    <v-dialog v-model="visible" max-width="640" persistent
        :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'">
        <v-card class="rounded-xl d-flex flex-column" style="overflow:hidden; max-height: 100vh;">

            <div class="d-flex align-center justify-space-between px-6 py-4 flex-shrink-0" style="background:#E3F2FD;">
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

            <v-card-text class="px-6 pt-6 pb-2 flex-grow-1 overflow-y-auto">

                <div class="text-h6 font-weight-bold mb-4">ข้อมูลเอกสาร</div>

                <div class="info-container mb-6">
                    <div class="d-flex align-center mb-3">
                        <div class="grey--text text--darken-1 label-col">สถานะ</div>
                        <div class="mr-3">:</div>
                        <Status :value="docStatus" />
                    </div>

                    <div class="d-flex align-center mb-3">
                        <div class="grey--text text--darken-1 label-col">หมายเลขเอกสาร</div>
                        <div class="mr-3">:</div>
                        <div class="font-weight-bold text-body-1">{{ docNo }}</div>
                    </div>

                    <div class="d-flex align-center mb-3">
                        <div class="grey--text text--darken-1 label-col">จำนวนชั่วโมง</div>
                        <div class="mr-3">:</div>
                        <div class="font-weight-bold text-body-1">{{ totalHours }}</div>
                    </div>

                    <div class="d-flex align-center mb-3">
                        <div class="grey--text text--darken-1 label-col">วันที่ทำรายการ</div>
                        <div class="mr-3">:</div>
                        <div class="font-weight-bold text-body-1">{{ transDate }}</div>
                    </div>
                </div>

                <div class="text-subtitle-1 font-weight-bold mb-3">ลำดับการอนุมัติ</div>

                <div v-if="loading" class="d-flex justify-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>

                <div v-else class="rounded-lg pa-4" style="border:1px solid #ECECEC; background:#FAFAFA;">

                    <div class="d-flex align-start">
                        <div class="step-dot mr-4 mt-1" :class="getDotClass(step1Id)">1</div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-space-between align-start flex-wrap">
                                <div>
                                    <div class="font-weight-bold text-body-2">หัวหน้างาน</div>
                                    <div class="caption grey--text text--darken-2 mt-1">
                                        {{ headApprover.name }}
                                    </div>
                                    <div class="caption grey--text text--darken-1">
                                        {{ headApprover.actionDate }}
                                    </div>
                                    <div v-if="headApprover.reason" class="caption red--text mt-1 pa-2 rounded"
                                        style="background: #FFEBEE;">
                                        หมายเหตุ: {{ headApprover.reason }}
                                    </div>
                                </div>
                                <div class="mt-1 mt-sm-0">
                                    <Status :value="step1Id" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <v-divider class="my-4 ml-10"></v-divider>

                    <div class="d-flex align-start">
                        <div class="step-dot mr-4 mt-1" :class="getDotClass(step2Id)">2</div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-space-between align-start flex-wrap">
                                <div>
                                    <div class="font-weight-bold text-body-2">ฝ่ายบุคคล (HR)</div>
                                    <div class="caption grey--text text--darken-2 mt-1">
                                        {{ hrApprover.name }}
                                    </div>
                                    <div class="caption grey--text text--darken-1">
                                        {{ hrApprover.actionDate }}
                                    </div>
                                    <div v-if="hrApprover.reason" class="caption red--text mt-1 pa-2 rounded"
                                        style="background: #FFEBEE;">
                                        หมายเหตุ: {{ hrApprover.reason }}
                                    </div>
                                </div>
                                <div class="mt-1 mt-sm-0">
                                    <Status :value="step2Id" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </v-card-text>

            <v-card-actions class="justify-center pb-6 pt-2 flex-shrink-0">
                <v-btn color="#1565C0" class="white--text px-10 rounded-lg" height="44" @click="close">
                    ปิด
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import api from "~/service/api";
import Status from "@/components/global/Status.vue";

export default {
    name: "TrackingDialog",
    components: { Status },
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
        docStatus() { return Number(this.item?.status || 0) },
        docNo() { return this.item?.docNo || "-" },
        totalHours() { return this.item?.hours || "-" },
        transDate() { return this.item?.transDate || "-" },

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
        step1Id() {
            const s = this.headApprover.status;
            if (s === 3) return 3;
            if (s === 4) return 4;
            if (s === 6) return 6;
            return 1;
        },
        step2Id() {
            if (this.docStatus === 4) return 6;
            const s = this.hrApprover.status;
            if (s === 3) return 3;
            if (s === 5) return 5;
            if (s === 6) return 6;
            if (this.docStatus >= 2) return 2;
            return 0;
        }
    },
    watch: {
        value: {
            immediate: true,
            handler(val) {
                if (val && this.item?.requestId) {
                    this.fetchHistory();
                }
            }
        }
    },
    methods: {
        close() { this.$emit("input", false) },
        async fetchHistory() {
            this.loading = true;
            this.approvalHistory = [];
            try {
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
        getDotClass(statusId) {
            switch (statusId) {
                case 3: return 'dot-approved';
                case 4:
                case 5: return 'dot-rejected';
                case 1:
                case 2: return 'dot-pending';
                case 6: return 'dot-cancelled';
                default: return 'dot-wait';
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
    flex-shrink: 0;
}

.label-col {
    min-width: 140px;
}

/* Map สี Dot */
.dot-wait {
    background: #F3F4F6;
    color: #9CA3AF;
}

.dot-pending {
    background: #FFE8C2;
    color: #B45309;
}

.dot-approved {
    background: #DCFCE7;
    color: #166534;
}

.dot-rejected {
    background: #FEE2E2;
    color: #991B1B;
}

.dot-cancelled {
    background: #E5E7EB;
    color: #374151;
}

@media (max-width: 600px) {
    .label-col {
        min-width: 110px;
        /* ลดความกว้าง label บนมือถือ */
        font-size: 0.9rem;
    }
}
</style>