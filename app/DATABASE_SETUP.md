# Database Setup - Finance Buddy

## Database yang Digunakan

Project Finance Buddy menggunakan database H2 untuk pengembangan.

Konfigurasi terdapat pada file:

src/main/resources/application.properties

## Konfigurasi Database

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.h2.console.enabled=true
```

## Tabel yang Dibuat

### USERS

Menyimpan data pengguna sistem.

Kolom:
- id
- username
- email
- password
- nama_lengkap
- role
- status
- created_at
- validated_at

### CATEGORIES

Menyimpan kategori pemasukan dan pengeluaran.

Kolom:
- id
- name
- type

### TRANSACTIONS

Menyimpan data transaksi keuangan.

Kolom:
- id
- amount
- date
- type
- akun
- category
- description
- user_id

## Hasil Pengujian

Aplikasi berhasil dijalankan menggunakan:

```bash
.\mvnw.cmd spring-boot:run
```

H2 Console berhasil diakses pada:

http://localhost:8080/h2-console

## Data Awal

DataInitializer berhasil membuat akun admin:

Username: admin

Email: admin@financebuddy.com

Role: ADMIN

Status: TERVALIDASI