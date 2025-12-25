<template>
    <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
        <v-main class="pa-6">
            <v-breadcrumbs class="px-0 mb-4" :items="breadcrumbs" />

            <v-row class="mb-6">
                <StatsGrid :stats="stats" :current-filter="filterStatus" @update:filter="onStatClick" />
            </v-row>

            <FilterToolbar v-model="q" placeholder="ค้นหารายการ, เลขเอกสาร, รายละเอียด...">
                <template #filters>
                    <v-col cols="auto" class="px-2">
                        <v-select v-model="filterYear" :items="years" label="ปี :" dense outlined hide-details clearable
                            background-color="#F7F9FC" class="rounded-lg" style="width: 120px;" />
                    </v-col>
                </template>
            </FilterToolbar>

            <RequestTable :items="filteredItems" :loading="loading" :selected.sync="selectedItems" @view="onView"
                @bulk-cancel="onBulkCancel" />

            <DialogCancelRequest v-model="cancelDialog" :items="itemsToCancel" @confirm="confirmCancelRequest" />

            <v-dialog v-model="viewDialog" max-width="900px">
                <v-card v-if="selectedItem" class="rounded-lg">
                </v-card>
            </v-dialog>

            <v-dialog v-model="successDialog" max-width="500px">
                <v-card class="rounded-lg text-center pb-6">
                    <v-card-title class="blue lighten-5 py-3 relative justify-center mb-6">
                        <div class="font-weight-bold blue--text text--darken-2 title">
                            ยกเลิกคำร้องขอ
                        </div>
                        <v-btn icon absolute right top @click="successDialog = false" class="mt-1 mr-1">
                            <v-icon color="blue darken-2">mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <div class="mb-4 d-flex justify-center">
                            <div
                                style="background-color: #66bb6a; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                                <v-icon size="50" color="white">mdi-check</v-icon>
                            </div>
                        </div>
                        <div class="headline font-weight-bold blue--text text--darken-3 px-4">
                            คุณได้ทำการยกเลิกส่งคำขอเบิกค่าล่วงเวลาเรียบร้อยแล้ว
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

        </v-main>
    </v-app>
</template>

<script>
import Status from "@/components/global/Status.vue";
import StatsGrid from "@/components/global/StatsGrid.vue";
import FilterToolbar from "@/components/global/FilterToolbar.vue";
import RequestTable from "@/components/overtimerequest/RequestTable.vue";       // <--- New
import DialogCancelRequest from "@/components/overtimerequest/DialogCancelRequest.vue"; // <--- New

export default {
    components: {
        Status,
        StatsGrid,
        FilterToolbar,
        RequestTable,
        DialogCancelRequest
    },
    // ... (Code ใน script ส่วนใหญ่จะเหมือนเดิม แต่ตัด logic ของ table/pagination ออกไปเพราะย้ายไปอยู่ใน RequestTable แล้ว) ...

    methods: {
        // ... (fetchRecords, format..., onSearch, etc. เหมือนเดิม) ...

        // ปรับปรุง confirmCancelRequest ให้รับ reason จาก event
        async confirmCancelRequest(reason) {
            if (!reason.trim()) return;
            this.cancellationReason = reason;

            // ... logic เดิม ...
        }
    }
};
</script>