<template>
  <div class="page">
    <div class="container">
      <div class="top-bar">
  <button class="back-btn" @click="$router.push('/dashboard')">
    ⬅ Back to Dashboard
  </button>

  <h1 class="title">Packages</h1>

  <button class="add-btn" @click="openAddModal()">Add Package</button>
</div>


      <div class="blocks">
        <div v-if="loading" class="no-packages">Loading packages…</div>
        <div v-else-if="!packages.length" class="no-packages">No packages available. Click Add Package to create one.</div>

        <div v-else class="grid">
          <div v-for="pkg in packages" :key="pkg.id" class="block">
            <div class="block-content">
              <h3 class="pkg-name">{{ pkg.name }}</h3>
              <p class="pkg-desc">{{ pkg.description }}</p>
              <div class="meta">
                <span>Duration: {{ pkg.duration }}</span>
                <span>Price: ₱{{ pkg.price }}</span>
              </div>
              <div class="meta small">Last updated: {{ pkg.updated_at || '-' }}</div>
            </div>

            <div class="block-actions">
              <button class="edit-btn" @click="openEditModal(pkg)">Edit</button>
              <button class="delete-btn" @click="confirmDelete(pkg.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- removed the button-container -->

    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3 class="modal-title">{{ modalMode === 'add' ? 'Add Package' : 'Edit Package' }}</h3>

        <form @submit.prevent="submitForm">
          <div class="field">
            <label>Package Name</label>
            <input type="text" v-model="form.name" />
          </div>

          <div class="field">
            <label>Description</label>
            <textarea rows="3" v-model="form.description"></textarea>
          </div>

          <div class="field">
            <label>Duration (e.g. 1 hour)</label>
            <input type="text" v-model="form.duration" />
          </div>

          <div class="field">
            <label>Price</label>
            <input type="number" min="0" step="0.01" v-model="form.price" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-light" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-dark">{{ modalMode === 'add' ? 'Save' : 'Update' }}</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>



<script>
export default {
  name: "PackagesPage",
  data() {
    return {
      packages: [],
      apiBase: "http://localhost:3000/api/packages",
      loading: false,
      showModal: false,
      modalMode: "add",
      form: { id: null, name: "", description: "", duration: "", price: "" } // duration maps to duration_hour
    };
  },
  async mounted() {
    await this.fetchPackages();
  },
  methods: {
    // Fetch and map DB columns to UI model
    async fetchPackages() {
      this.loading = true;
      try {
        const res = await fetch(this.apiBase);
        if (!res.ok) {
          const txt = await res.text();
          console.error('fetchPackages failed:', res.status, txt);
          alert('Failed to load packages (see console).');
          this.packages = [];
          return;
        }
        const data = await res.json();
        this.packages = Array.isArray(data) ? data.map(p => ({
          id: p.package_id,                      // DB -> UI id
          name: p.name,
          description: p.description,
          duration: p.duration_hour,             // DB duration_hour -> UI duration
          price: (p.price !== null && p.price !== undefined) ? parseFloat(p.price).toFixed(2) : "0.00",
          created_at: p.created_at,
          updated_at: p.updated_at
        })) : [];
      } catch (err) {
        console.error('fetchPackages exception:', err);
        alert('Failed to load packages. Is backend running? See console.');
        this.packages = [];
      } finally {
        this.loading = false;
      }
    },

    // Modal controls
    openAddModal() {
      this.modalMode = 'add';
      this.form = { id: null, name: '', description: '', duration: '', price: '' };
      this.showModal = true;
    },
    openEditModal(pkg) {
      this.modalMode = 'edit';
      this.form = {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        duration: pkg.duration,
        price: pkg.price
      };
      this.showModal = true;
    },
    closeModal() { this.showModal = false; },

    // Submit: create or update
    async submitForm() {
      if (!this.form.name || !this.form.description || !this.form.duration || this.form.price === '') {
        alert('All fields are required.');
        return;
      }

      if (this.modalMode === 'add') await this.createPackage();
      else await this.updatePackage();
    },

    // Create (POST): send duration as duration_hour (backend accepts duration or duration_hour)
    async createPackage() {
      try {
        const payload = {
          name: this.form.name,
          description: this.form.description,
          duration: this.form.duration, // backend will accept this and map to duration_hour
          price: parseFloat(this.form.price)
        };
        const res = await fetch(this.apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (!res.ok) {
          console.error('createPackage failed:', res.status, text);
          alert('Create failed (see console).');
          return;
        }
        await this.fetchPackages();
        this.closeModal();
      } catch (err) {
        console.error('createPackage exception:', err);
        alert('Create failed (see console).');
      }
    },

    // Update (PUT)
    async updatePackage() {
      try {
        const id = this.form.id;
        const payload = {
          name: this.form.name,
          description: this.form.description,
          duration: this.form.duration, // backend will accept duration -> duration_hour
          price: parseFloat(this.form.price)
        };
        const res = await fetch(`${this.apiBase}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (!res.ok) {
          console.error('updatePackage failed:', res.status, text);
          alert('Update failed (see console).');
          return;
        }
        await this.fetchPackages();
        this.closeModal();
      } catch (err) {
        console.error('updatePackage exception:', err);
        alert('Update failed (see console).');
      }
    },

    // Delete
    confirmDelete(id) {
      if (!confirm('Are you sure you want to delete this package?')) return;
      this.deletePackage(id);
    },
    async deletePackage(id) {
      try {
        const res = await fetch(`${this.apiBase}/${id}`, { method: 'DELETE' });
        const text = await res.text();
        if (!res.ok) {
          console.error('deletePackage failed:', res.status, text);
          alert('Delete failed (see console).');
          return;
        }
        await this.fetchPackages();
      } catch (err) {
        console.error('deletePackage exception:', err);
        alert('Delete failed (see console).');
      }
    }
  }
};
</script>

<style scoped>
/* layout & styles (kept simple and consistent with your theme) */
.page{width:100vw;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;background:url("/src/assets/bg1.png") no-repeat center center fixed;background-size:cover;padding-top:40px;}
.container{width:90%;max-width:1300px;background:rgba(255,255,255,0.95);border-radius:20px;padding:25px 30px;box-shadow:0 10px 30px rgba(0,0,0,0.25);box-sizing:border-box;}
.top-bar{display:flex;justify-content:space-between;align-items:center;}
.title{font-size:36px;color:black;flex-grow:1;margin-left:80px;}
.add-btn{padding:8px 20px;border:2px solid black;background:white;border-radius:25px;cursor:pointer;font-size:16px;}
.blocks{margin-top:30px;}
.no-packages{padding:30px;color:#666;text-align:center;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;margin-top:10px;}
.block{background:white;border:1px solid #ddd;border-radius:10px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;min-height:160px;}
.block-content{margin-bottom:10px;}
.pkg-name{margin:0 0 6px 0;font-size:18px;}
.pkg-desc{margin:0 0 10px 0;color:#444;font-size:14px;}
.meta{display:flex;justify-content:space-between;font-size:13px;color:#555;}
.meta.small{font-size:12px;color:#777;margin-top:8px;}
.block-actions{display:flex;justify-content:flex-end;gap:8px;}
.edit-btn,.delete-btn{padding:8px 14px;border-radius:20px;border:1px solid #444;background:#fafafa;cursor:pointer;}
.delete-btn{border-color:red;color:red;background:#fff7f7;}
.button-container{display:flex;justify-content:flex-end;margin-top:10px;}
.view-btn{background:black;color:white;border:none;padding:12px 20px;border-radius:25px;cursor:pointer;font-size:16px;}
/* modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;justify-content:center;align-items:center;z-index:50;}
.modal-card{width:400px;max-width:95%;background:white;border-radius:18px;padding:20px 22px;box-shadow:0 10px 25px rgba(0,0,0,0.3);}
.field{margin-bottom:10px;}
.field label{font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;display:block;}
.field input,.field textarea{width:100%;padding:8px 12px;border-radius:8px;border:1px solid #444;font-size:15px;background:#fafafa;color:black;box-sizing:border-box;}
.modal-actions{margin-top:12px;display:flex;justify-content:flex-end;gap:10px;}
.btn-light,.btn-dark{padding:6px 14px;border-radius:20px;cursor:pointer;}
.btn-light{border:1px solid #777;background:#fafafa;}
.btn-dark{border:1px solid black;background:black;color:white;}
</style>
