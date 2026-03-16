Sekarang generate CRUD untuk semua modul dashboard:

Modules:
- Executive
- Funding
- Logistics
- Refugees
- Operations
- Map Data

Untuk setiap module buat:
- Sequelize model
- Migration
- Controller CRUD
- Routes RESTful

Format endpoint:
GET /api/{resource}
GET /api/{resource}/:id
POST /api/{resource}
PUT /api/{resource}/:id
DELETE /api/{resource}/:id

Semua write endpoint harus JWT protected.