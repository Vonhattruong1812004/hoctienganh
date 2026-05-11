# Import PostgreSQL

File import truc tiep:

```text
thiet_ke_csdl_hoc_tieng_anh.sql
```

Chay bang `psql`:

```bash
createdb english_learning
psql -U postgres -d english_learning -f thiet_ke_csdl_hoc_tieng_anh.sql
```

Neu dung Docker Compose trong repo, PostgreSQL se tu import file SQL trong lan khoi tao volume dau tien.

```bash
npm run docker:up
```

Tai khoan mau:

```text
admin@englishpro.local / 123456
giaovien@englishpro.local / 123456
phuhuynh@englishpro.local / 123456
hocvien1@englishpro.local / 123456
hocvien2@englishpro.local / 123456
```
