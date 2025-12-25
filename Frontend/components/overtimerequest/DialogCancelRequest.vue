<template>
    <v-dialog :value="value" max-width="600px" persistent>
        <v-card class="rounded-lg">
            <v-card-title class="blue lighten-5 py-3 relative">
                <div style="width: 100%; text-align: center;" class="font-weight-bold blue--text text--darken-2 title">
                    ยกเลิกคำร้องขอ
                </div>
                <v-btn icon absolute right top @click="close" class="mt-1 mr-1">
                    <v-icon color="blue darken-2">mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="text-center pt-6 px-6">
                <div class="subtitle-1 font-weight-bold blue--text text--darken-2 mb-1">
                    ต้องการยกเลิกคำร้องขอใช่หรือไม่
                </div>
                <div class="black--text mb-6">วันนี้คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำร้องขอ</div>

                <div style="max-height: 300px; overflow-y: auto;" class="mb-4 pr-2 custom-scrollbar">
                    <v-card v-for="(item, index) in items" :key="index" outlined
                        class="pa-4 text-left grey lighten-5 mb-3 rounded-lg elevation-0"
                        style="border: 1px solid #eee;">
                        <div class="font-weight-bold mb-3">รายการที่ {{ index + 1 }}</div>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <span class="black--text mr-2">หมายเลขเอกสาร :</span>
                                <span class="font-weight-bold black--text">{{ item.docs_no }}</span>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <span class="black--text mr-2">วันที่ทำงาน :</span>
                                <span class="font-weight-bold black--text">{{ item.startDate }}</span>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-2">
                                <span class="black--text mr-2">เวลาที่เริ่ม :</span>
                                <span class="font-weight-bold black--text">{{ (item.startTime || '').replace(' น.', '')
                                    }}</span>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-2">
                                <span class="black--text mr-2">เวลาที่สิ้นสุด :</span>
                                <span class="font-weight-bold black--text">{{ (item.endTime || '').replace(' น.', '')
                                    }}</span>
                            </v-col>
                        </v-row>
                    </v-card>
                </div>

                <div class="text-left font-weight-bold mb-2">เหตุผลที่ยกเลิกคำร้องขอ</div>
                <v-textarea v-model="reason" outlined placeholder="กรุณาระบุเหตุผลที่ยกเลิกคำร้องขอ" rows="4"
                    class="rounded-lg" />

                <div class="d-flex justify-center gap-4 mt-6 mb-6">
                    <v-btn outlined color="primary" width="140" height="44"
                        class="rounded-lg headline font-weight-medium"
                        style="font-size: 1rem !important; border-color: #1976d2;" @click="close">
                        ยกเลิก
                    </v-btn>
                    <v-btn depressed width="140" height="44" class="rounded-lg headline font-weight-medium" :style="{
                        'font-size': '1rem !important',
                        'background-color': reason.trim().length > 0 ? '#1565c0 !important' : '#BDBDBD !important',
                        'color': 'white !important'
                    }" :disabled="reason.trim().length === 0" @click="confirm">
                        ยืนยัน
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        value: Boolean,
        items: { type: Array, default: () => [] }
    },
    data() {
        return {
            reason: ''
        };
    },
    watch: {
        value(val) {
            if (val) this.reason = ''; // Reset reason when opened
        }
    },
    methods: {
        close() {
            this.$emit('input', false);
        },
        confirm() {
            this.$emit('confirm', this.reason);
        }
    }
}
</script>