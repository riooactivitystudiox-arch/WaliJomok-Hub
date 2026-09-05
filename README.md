# WaliJomok

WaliJomok community website menggunakan Express + JSON, dengan struktur yang dibuat sederhana seperti project Lawal.

## Jalankan lokal

```bash
npm install
npm start
```

Buka `http://localhost:3000`.

## Akun default

- Username: `andes_lawal`
- Password: `wj12`
- Role: Admin

Akun admin lain:
- `geo_jmk48` / `wj12`
- `ridho_athalla` / `wj12`

## Railway

Deploy project ini dari folder yang berisi `package.json` dan `server.js`.
Railway akan menjalankan `npm start`.

`server.js` otomatis memastikan akun default ada. Jika `comunity_page/users.json` kosong karena deployment sebelumnya, akun default akan dimasukkan kembali tanpa menghapus akun lain yang sudah ada.
