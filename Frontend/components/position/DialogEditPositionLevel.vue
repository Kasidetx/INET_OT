<template>
  <v-dialog :value="value" max-width="500px" persistent>
    <v-card style="border-radius: 24px !important;">
      <validation-observer ref="formObserver">
        <v-form>
          <v-card-title style="background-color: #ebf2f9">
            <v-row no-gutters justify="center" style="color: #0863B6; font-size: 1rem; font-weight: 700;">
              แก้ไขระดับตำแหน่ง
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
                  ชื่อระดับ (ไทย) <span style="color: red;">*</span>
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
                  ชื่อระดับ (อังกฤษ) <span style="color: red;">*</span>
                </div>
                <div>
                  <validation-provider v-slot="{ errors }" name="name_en" rules="required|englishLang">
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
                      counter
                      maxlength="250"
                      dense
                    />
                  </validation-provider>
                </div>
              </v-col>
              <v-col cols="12" md="12" class="py-0">
                <div class="pb-0">
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
                @click="validateAndSubmit"
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
  name: 'DialogEditPositionLevel',
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
        level_id: null,
        name_th: '',
        name_en: '',
        description: '',
        status: true
      }
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
          this.form.level_id = newVal.level_id || null
          this.form.name_th = newVal.name_th || ''
          this.form.name_en = newVal.name_en || ''
          this.form.description = newVal.description || ''
          this.form.status = newVal.status === 'ใช้งาน'
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    async validateAndSubmit () {
      const valid = await this.$refs.formObserver.validate()
      if (valid) {
        this.submit()
      } else {
        this.$swal.fire({
          icon: 'warning',
          title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          text: 'กรุณาตรวจสอบฟอร์มอีกครั้ง',
          timer: 2000,
          showConfirmButton: false
        })
      }
    },
    closeDialog () {
      this.$emit('input', false)
    },
    async submit () {
      const payload = {
        level: {
          level_id: this.form.level_id,
          name_th: this.form.name_th,
          name_eng: this.form.name_en,
          description: this.form.description,
          is_active: this.form.status ? 1 : 0
        }
      }

      try {
        const res = await this.$axios.post(process.env.API_UPDATE_LEVEL_POSITION, payload)

        if (res.data.status === 'success') {
          this.$emit('input', false)
          this.$emit('refresh')
          this.$swal.fire({
            icon: 'success',
            title: 'แก้ไขระดับสำเร็จ',
            text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.$emit('refresh')
          })

          // Reset form
          this.form = {
            level_id: null,
            name_th: '',
            name_en: '',
            description: '',
            status: true
          }
        } else {
          throw new Error(res.data.message)
        }
      } catch (error) {
        console.error('❌ Error creating level:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถเพิ่มระดับได้ กรุณาลองใหม่อีกครั้ง',
          timer: 2000,
          showConfirmButton: false
        })
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
