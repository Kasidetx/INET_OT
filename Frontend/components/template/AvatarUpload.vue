<template>
  <div>
    <div class="avatar-upload">
      <v-hover v-slot="{ hover }">
        <div class="avatar-wrapper">
          <v-img
            :src="preview || defaultImage"
            aspect-ratio="1"
            class="avatar-image"
            contain
          ></v-img>

          <!-- Overlay เมื่อ hover -->
          <div
            v-if="hover"
            class="avatar-overlay"
            @click="triggerUpload"
          >
            <v-icon large color="white">mdi-camera</v-icon>
          </div>

          <!-- hidden input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="onFileChange"
          />
        </div>
      </v-hover>
    </div>
    <div>
      <v-row justify="center" class="mt-1">
        <v-col cols="auto">
          <v-btn class="btn-up" dark color="primary" @click="triggerUpload">อัปโหลด</v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
  
</template>

<script>
export default {
  props: {
    value: String, // ใช้ v-model สำหรับส่ง path/base64 ออกไป
  },
  data() {
    return {
      preview: this.value || null,
      defaultImage: require('~/assets/img/company_default.jpg') // รูป default
    };
  },
  watch: {
    value(val) {
      this.preview = val;
    }
  },
  methods: {
    triggerUpload() {
      this.$refs.fileInput.click();
    },
    async onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // เตรียม FormData
        const formData = new FormData();
        formData.append("file", file);

        // ส่งไฟล์ไป API
        const res = await this.$axios.$post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        // const res = {}

        // res.url = "https://cdn.vuetifyjs.com/images/cards/server-room.jpg"

        // สมมติว่า API คืน url รูปมาใน res.url
        if (res.url) {
          this.preview = res.url;
          this.$emit("input", res.url); // ส่ง url ออกไป
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("อัปโหลดไม่สำเร็จ");
      }
    }
  }
};
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  border-style: ridge ;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-up {
  width: 120px;
  height: 40px !important;
  border-radius: 10px;
}
</style>
