<template>
    <v-card outlined elevation="0" class="white">
        <v-card-title class="pb-4 blue--text d-flex justify-space-between align-center">
            <span>รายการเอกสาร {{ filteredItems.length }} รายการ</span>
            
            <div v-if="showSelect && selected.length > 0">
                <v-btn color="#1565c0" dark depressed @click="$emit('bulk-cancel')" class="rounded-lg px-6 subtitle-2"
                    height="40">
                    ยกเลิกคำร้องขอ
                </v-btn>
            </div>
        </v-card-title>

        <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

        <v-simple-table v-if="!loading && paginatedItems.length > 0">
            <template #default>
                <thead>
                    <tr class="blue lighten-5">
                        <th v-if="showSelect" class="text-center" width="50">
                            <v-checkbox :input-value="selectAll" @change="toggleSelectAll" hide-details
                                class="mt-0 pt-0" />
                        </th>
                        
                        <th v-for="(h, i) in headers" :key="i" :class="h.class || 'text-left'" :width="h.width">
                            {{ h.text }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item) in paginatedItems" :key="item.id">
                        <td v-if="showSelect" class="text-center">
                            <v-checkbox v-model="localSelected" :value="item.id" hide-details class="mt-0 pt-0" />
                        </td>
                        
                        <td class="font-weight-bold text-center">{{ item.request_no }}</td> <td class="font-weight-medium">{{ item.docs_no }}</td>
                        <td class="black--text">{{ item.title }}</td>
                        <td>
                            <div>{{ item.startDate }}</div>
                            <div class="black--text caption">{{ item.startTime }}</div>
                        </td>
                        <td>
                            <div>{{ item.endDate }}</div>
                            <div class="black--text caption">{{ item.endTime }}</div>
                        </td>
                        <td class="text-center">{{ item.hours }}</td>
                        <td class="text-center">
                            <Status :value="item.status" />
                        </td>
                        <td class="text-center">
                            <v-btn icon small @click="$emit('view', item)" class="mr-1">
                                <v-icon small color="primary">mdi-eye</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>

        <div v-if="!loading && paginatedItems.length === 0" class="text-center pa-8">
             </div>

        <v-card-actions v-if="filteredItems.length > 0" class="...">
             </v-card-actions>
    </v-card>
</template>

<script>
import Status from "@/components/global/Status.vue";

export default {
    components: { Status },
    props: {
        items: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        selected: { type: Array, default: () => [] },
        // ✅ เพิ่ม Props รับค่าว่าจะให้โชว์ Checkbox ไหม
        showSelect: { type: Boolean, default: false }
    },
    // ... (data, computed, methods เหมือนเดิม ไม่ต้องแก้)
    data() {
        return {
            page: 1,
            perPage: 10,
            headers: [
                // เอา checkbox ออกจาก headers เพราะเราเขียนแยกไว้ใน template แล้ว
                { text: "ลำดับ", width: "50", class: "text-center" }, 
                { text: "หมายเลขคำร้อง" },
                { text: "รายละเอียด" },
                { text: "วัน-เวลาที่เริ่ม" },
                { text: "วัน-เวลาที่สิ้นสุด" },
                { text: "จำนวนชั่วโมง", class: "text-center" },
                { text: "สถานะ", class: "text-center" },
                { text: "", width: "80", class: "text-center" },
            ]
        };
    },
    computed: {
        filteredItems() { return this.items; },
        pages() { return Math.max(1, Math.ceil(this.filteredItems.length / this.perPage)); },
        paginatedItems() {
            const start = (this.page - 1) * this.perPage;
            return this.filteredItems.slice(start, start + this.perPage);
        },
        rangeText() {
            const total = this.filteredItems.length;
            if (total === 0) return "0-0 of 0";
            const start = (this.page - 1) * this.perPage + 1;
            const end = Math.min(this.page * this.perPage, total);
            return `${start}-${end} of ${total}`;
        },
        localSelected: {
            get() { return this.selected; },
            set(val) { this.$emit('update:selected', val); }
        },
        selectAll() {
            return this.paginatedItems.length > 0 && this.paginatedItems.every(i => this.localSelected.includes(i.id));
        }
    },
    watch: {
        items() { this.page = 1; }
    },
    methods: {
        toggleSelectAll() {
            if (this.selectAll) {
                const newSelected = this.localSelected.filter(id => !this.paginatedItems.find(i => i.id === id));
                this.$emit('update:selected', newSelected);
            } else {
                const newSelected = [...this.localSelected];
                this.paginatedItems.forEach(item => {
                    if (!newSelected.includes(item.id)) newSelected.push(item.id);
                });
                this.$emit('update:selected', newSelected);
            }
        }
    }
};
</script>