<template>
  <v-dialog :value="value" max-width="500px" persistent>
    <v-card style="border-radius: 24px !important;">
      <validation-observer ref="observer">
        <v-form>
          <v-card-title style="background-color: #ebf2f9">
            <v-row no-gutters justify="center" style="color: #0863B6; font-size: 1rem; font-weight: 700;">
              แก้ไขตำแหน่ง
            </v-row>
            <v-btn icon @click="closeDialog">
              <v-icon color="#0863B6">
                mdi-close
              </v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pb-0 pt-4">
            <v-col class="pb-0">
              <v-col cols="12" md="12" class="py-0">
                <div class="pb-0">
                  ตำแหน่ง (ไทย) <span style="color: red;">*</span>
                </div>
                <div>
                  <validation-provider v-slot="{ errors }" name="name_th" rules="required||thaiLang">
                    <v-text-field
                      v-model="form.name_th"
                      :error-messages="errors"
                      placeholder="กรอกชื่อระดับ"
                      outlined
                      dense
                    />
                  </validation-provider>
                </div>
              </v-col>
              <v-col cols="12" md="12" class="py-0">
                <div class="pb-0">
                  ตำแหน่ง (อังกฤษ) <span style="color: red;">*</span>
                </div>
                <div>
                  <validation-provider v-slot="{ errors }" name="name_en" rules="required||englishLang">
                    <v-text-field
                      v-model="form.name_en"
                      :error-messages="errors"
                      placeholder="กรอกชื่อระดับ (อังกฤษ)"
                      outlined
                      dense
                    />
                  </validation-provider>
                </div>
              </v-col>
              <v-col cols="12" md="12" class="py-0">
                <div class="pb-0">
                  ระดับ <span style="color: red;">*</span>
                </div>
                <div>
                  <validation-provider v-slot="{ errors }" name="level" rules="required">
                    <v-select
                      v-model="form.level"
                      :error-messages="errors"
                      :items="levels"
                      item-text="name_th"
                      item-value="name_th"
                      append-icon="mdi-chevron-down"
                      placeholder="เลือกระดับ"
                      outlined
                      dense
                    />
                  </validation-provider>
                </div>
              </v-col>
              <v-col cols="12" md="12" class="py-0">
                <div class="mr-2 pb-0">
                  คำอธิบาย
                </div>
                <div class="pb-0">
                  <validation-provider v-slot="{ errors }" name="description" rules="">
                    <v-textarea
                      v-model="form.description"
                      :error-messages="errors"
                      placeholder="กรอกคำอธิบาย"
                      outlined
                      dense
                      counter
                      maxlength="250"
                    />
                  </validation-provider>
                </div>
              </v-col>
              <v-col cols="12" md="12" class="py-0">
                <div class="pb-0 pl-2">
                  <v-switch
                    v-model="form.status"
                    label="สถานะ"
                    color="success"
                    inset
                  />
                </div>
              </v-col>
            </v-col>
          </v-card-text>

          <v-card-actions style="gap: 10px;" class="pb-8 pt-0">
            <v-row no-gutters justify="end">
              <v-btn outlined color="#0863B6" rounded min-width="100px" @click="closeDialog">
                ยกเลิก
              </v-btn>
            </v-row>
            <v-row no-gutters justify="start">
              <v-btn
                min-width="100px"
                :disabled="!isFormValid"
                rounded
                :color="isFormValid ? '#0863B6' : '#C4C4C4'"
                class="white--text"
                @click="submit"
              >
                บันทึก
              </v-btn>
            </v-row>
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DialogEditPosition',
  props: {
    value: Boolean,
    item: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      form: {
        name_th: '',
        name_en: '',
        level: '',
        description: '',
        status: false
      },
      levels: []
    }
  },

  computed: {
    isFormValid () {
      return this.form.name_th && this.form.name_en
    }
  },
  watch: {
    item: {
      handler (newVal) {
        console.log('🔍 newVal ที่รับเข้ามา:', newVal)
        if (newVal) {
          this.form.name_th = newVal.name_th || ''
          this.form.name_en = newVal.name_en || ''
          this.form.description = newVal.description || ''
          this.form.status = newVal.status === 'ใช้งาน'
          this.form.level = newVal.level || ''
        }
      },
      immediate: true,
      deep: true
    }
  },
  mounted () {
    this.fetchLevels()
  },
  methods: {
    async fetchLevels () {
      try {
        const res = await this.$axios.post(process.env.API_GET_LEVEL_POSITION, {
          search: '',
          limit: 100,
          page: 1
        })

        if (res.data.status === 'success') {
          this.levels = res.data.result
        } else {
          console.error('ไม่สามารถโหลดระดับตำแหน่งได้:', res.data.message)
        }
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดระดับตำแหน่ง:', err)
      }
    },
    closeDialog () {
      this.$emit('input', false)
    },
    async submit () {
      const isValid = await this.$refs.observer.validate()
      if (!isValid) { return }
      const selectedLevel = this.levels.find(
        lvl => lvl.name_th === this.form.level
      )
      const level_id = selectedLevel ? selectedLevel.level_id : null

      const payload = {
        position: {
          position_id: this.item.position_id,
          name_th: this.form.name_th,
          name_eng: this.form.name_en,
          description: this.form.description,
          level_id,
          is_active: this.form.status ? 1 : 0
        }
      }

      try {
        const res = await this.$axios.post(process.env.API_UPDATE_POSITION, payload)

        if (res.data.status === 'success') {
          this.$emit('input', false)
          this.$emit('refresh')
          this.resetForm()

          this.$swal.fire({
            icon: 'success',
            title: 'เพิ่มตำแหน่งสำเร็จ',
            text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.$emit('refresh')
          })
        } else {
          throw new Error(res.data.message)
        }
      } catch (error) {
        console.error(error)
        this.$swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถเพิ่มตำแหน่งได้ กรุณาลองใหม่',
          timer: 2000,
          showConfirmButton: false
        })
      }
    },
    resetForm () {
      this.form = {
        name_th: '',
        name_en: '',
        level: '',
        description: '',
        status: true
      }
    },
    editItem (item) {
      this.selectedItem = item
      this.dialogEdit = true
    }

  }
}
</script>

<style scoped>
::v-deep .v-dialog {
    border-radius: 24px !important;
}
.v-input--selection-controls {
    margin-top: 0;
    padding-top: 0;
}
</style>
