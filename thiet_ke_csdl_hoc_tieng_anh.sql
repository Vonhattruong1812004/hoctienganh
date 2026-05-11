-- CSDL: He thong hoc tieng Anh truc tuyen
-- PostgreSQL import file
-- Cach chay vi du:
-- psql -U postgres -d ten_database -f thiet_ke_csdl_hoc_tieng_anh.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. NGUOI DUNG VA PHAN QUYEN
-- =========================

CREATE TABLE IF NOT EXISTS nguoidung (
  "maNguoiDung" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hoTen" VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  "soDienThoai" VARCHAR(20) UNIQUE,
  "matKhau" TEXT NOT NULL,
  "anhDaiDien" TEXT,
  "ngaySinh" DATE,
  "gioiTinh" VARCHAR(20),
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngayCapNhat" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_nguoidung_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'BiKhoa', 'NgungHoatDong')),
  CONSTRAINT chk_nguoidung_gioitinh
    CHECK ("gioiTinh" IS NULL OR "gioiTinh" IN ('Nam', 'Nu', 'Khac'))
);

CREATE TABLE IF NOT EXISTS vaitro (
  "maVaiTro" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenVaiTro" VARCHAR(50) NOT NULL UNIQUE,
  "moTa" TEXT,
  CONSTRAINT chk_vaitro_tenvaitro
    CHECK ("tenVaiTro" IN ('HocVien', 'PhuHuynh', 'GiaoVien', 'QuanTriVien'))
);

CREATE TABLE IF NOT EXISTS nguoidung_vaitro (
  "maNguoiDung" UUID NOT NULL,
  "maVaiTro" UUID NOT NULL,
  "ngayGan" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("maNguoiDung", "maVaiTro"),
  CONSTRAINT fk_ndvt_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_ndvt_vaitro
    FOREIGN KEY ("maVaiTro") REFERENCES vaitro("maVaiTro")
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hosohocvien (
  "maHoSoHocVien" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL UNIQUE,
  "trinhDoHienTai" VARCHAR(50),
  "mucTieuHocTap" TEXT,
  "tongDiem" INT NOT NULL DEFAULT 0,
  "chuoiNgayHoc" INT NOT NULL DEFAULT 0,
  "ngayBatDauHoc" TIMESTAMP,
  CONSTRAINT fk_hshv_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_hshv_tongdiem CHECK ("tongDiem" >= 0),
  CONSTRAINT chk_hshv_chuoingayhoc CHECK ("chuoiNgayHoc" >= 0)
);

CREATE TABLE IF NOT EXISTS lienket_phuhuynh_hocvien (
  "maLienKet" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maPhuHuynh" UUID NOT NULL,
  "maHocVien" UUID NOT NULL,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'ChoDuyet',
  "ngayLienKet" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lkphhv_phuhuynh
    FOREIGN KEY ("maPhuHuynh") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_lkphhv_hocvien
    FOREIGN KEY ("maHocVien") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT uq_lkphhv UNIQUE ("maPhuHuynh", "maHocVien"),
  CONSTRAINT chk_lkphhv_khongtrungnguoi CHECK ("maPhuHuynh" <> "maHocVien"),
  CONSTRAINT chk_lkphhv_trangthai
    CHECK ("trangThai" IN ('ChoDuyet', 'DaChapNhan', 'TuChoi'))
);

-- =========================
-- 2. LO TRINH VA NOI DUNG HOC
-- =========================

CREATE TABLE IF NOT EXISTS lotrinhhoc (
  "maLoTrinh" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenLoTrinh" VARCHAR(200) NOT NULL,
  "moTa" TEXT,
  "capDo" VARCHAR(50),
  "doiTuong" VARCHAR(100),
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'Nhap',
  "maNguoiTao" UUID,
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngayCapNhat" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lotrinhhoc_nguoitao
    FOREIGN KEY ("maNguoiTao") REFERENCES nguoidung("maNguoiDung")
    ON DELETE SET NULL,
  CONSTRAINT chk_lotrinhhoc_trangthai
    CHECK ("trangThai" IN ('Nhap', 'CongBo', 'LuuTru'))
);

CREATE TABLE IF NOT EXISTS giaidoanhoc (
  "maGiaiDoan" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maLoTrinh" UUID NOT NULL,
  "tenGiaiDoan" VARCHAR(200) NOT NULL,
  "loaiGiaiDoan" VARCHAR(50) NOT NULL,
  "thuTu" INT NOT NULL,
  "moTa" TEXT,
  CONSTRAINT fk_giaidoanhoc_lotrinh
    FOREIGN KEY ("maLoTrinh") REFERENCES lotrinhhoc("maLoTrinh")
    ON DELETE CASCADE,
  CONSTRAINT chk_giaidoanhoc_loaigiaidoan
    CHECK ("loaiGiaiDoan" IN ('HocKy', 'Tuan', 'Ngay', 'Chuong')),
  CONSTRAINT chk_giaidoanhoc_thutu CHECK ("thuTu" > 0),
  CONSTRAINT uq_giaidoanhoc_thutu UNIQUE ("maLoTrinh", "thuTu")
);

CREATE TABLE IF NOT EXISTS chudehoc (
  "maChuDe" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenChuDe" VARCHAR(200) NOT NULL,
  "moTa" TEXT,
  "capDo" VARCHAR(50),
  "kyNang" VARCHAR(50),
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  CONSTRAINT chk_chudehoc_kynang
    CHECK ("kyNang" IS NULL OR "kyNang" IN ('TuVung', 'NguPhap', 'Nghe', 'Doc', 'Noi', 'Viet')),
  CONSTRAINT chk_chudehoc_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'An'))
);

CREATE TABLE IF NOT EXISTS baihoc (
  "maBaiHoc" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maGiaiDoan" UUID,
  "maChuDe" UUID,
  "tieuDe" VARCHAR(255) NOT NULL,
  "moTa" TEXT,
  "noiDung" TEXT,
  "capDo" VARCHAR(50),
  "thuTu" INT NOT NULL,
  "diemDatYeuCau" NUMERIC(5,2) NOT NULL DEFAULT 80,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'Nhap',
  "maNguoiTao" UUID,
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngayCapNhat" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_baihoc_giaidoan
    FOREIGN KEY ("maGiaiDoan") REFERENCES giaidoanhoc("maGiaiDoan")
    ON DELETE SET NULL,
  CONSTRAINT fk_baihoc_chude
    FOREIGN KEY ("maChuDe") REFERENCES chudehoc("maChuDe")
    ON DELETE SET NULL,
  CONSTRAINT fk_baihoc_nguoitao
    FOREIGN KEY ("maNguoiTao") REFERENCES nguoidung("maNguoiDung")
    ON DELETE SET NULL,
  CONSTRAINT chk_baihoc_phannhom CHECK ("maGiaiDoan" IS NOT NULL OR "maChuDe" IS NOT NULL),
  CONSTRAINT chk_baihoc_diemdat CHECK ("diemDatYeuCau" BETWEEN 0 AND 100),
  CONSTRAINT chk_baihoc_trangthai
    CHECK ("trangThai" IN ('Nhap', 'CongBo', 'An'))
);

CREATE TABLE IF NOT EXISTS nhiemvuhoctap (
  "maNhiemVu" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiHoc" UUID NOT NULL,
  "tieuDe" VARCHAR(255) NOT NULL,
  "huongDan" TEXT,
  "loaiNhiemVu" VARCHAR(50) NOT NULL,
  "batBuoc" BOOLEAN NOT NULL DEFAULT TRUE,
  "thuTu" INT NOT NULL,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  CONSTRAINT fk_nhiemvu_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE,
  CONSTRAINT chk_nhiemvu_loai
    CHECK ("loaiNhiemVu" IN ('TuVung', 'NguPhap', 'Nghe', 'Doc', 'LuyenTap')),
  CONSTRAINT chk_nhiemvu_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'An')),
  CONSTRAINT chk_nhiemvu_thutu CHECK ("thuTu" > 0),
  CONSTRAINT uq_nhiemvu_thutu UNIQUE ("maBaiHoc", "thuTu")
);

-- =========================
-- 3. TU VUNG, NGU PHAP, TAI NGUYEN
-- =========================

CREATE TABLE IF NOT EXISTS tuvung (
  "maTuVung" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiHoc" UUID NOT NULL,
  tu VARCHAR(100) NOT NULL,
  nghia TEXT NOT NULL,
  "phienAm" VARCHAR(100),
  "loaiTu" VARCHAR(50),
  "viDu" TEXT,
  "nghiaViDu" TEXT,
  "audioPhatAm" TEXT,
  "hinhAnh" TEXT,
  CONSTRAINT fk_tuvung_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nguphap (
  "maNguPhap" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiHoc" UUID NOT NULL,
  "tieuDe" VARCHAR(255) NOT NULL,
  "cauTruc" TEXT,
  "giaiThich" TEXT,
  "viDu" TEXT,
  "ghiChu" TEXT,
  CONSTRAINT fk_nguphap_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tainguyenhoctap (
  "maTaiNguyen" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiHoc" UUID,
  "maNhiemVu" UUID,
  "tenTaiNguyen" VARCHAR(255) NOT NULL,
  "loaiTaiNguyen" VARCHAR(50) NOT NULL,
  "duongDan" TEXT NOT NULL,
  "moTa" TEXT,
  "dungLuong" INT,
  "maNguoiTaiLen" UUID,
  "ngayTaiLen" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tainguyen_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE,
  CONSTRAINT fk_tainguyen_nhiemvu
    FOREIGN KEY ("maNhiemVu") REFERENCES nhiemvuhoctap("maNhiemVu")
    ON DELETE CASCADE,
  CONSTRAINT fk_tainguyen_nguoitailen
    FOREIGN KEY ("maNguoiTaiLen") REFERENCES nguoidung("maNguoiDung")
    ON DELETE SET NULL,
  CONSTRAINT chk_tainguyen_cha CHECK ("maBaiHoc" IS NOT NULL OR "maNhiemVu" IS NOT NULL),
  CONSTRAINT chk_tainguyen_loai
    CHECK ("loaiTaiNguyen" IN ('HinhAnh', 'Audio', 'Video', 'PDF', 'Link')),
  CONSTRAINT chk_tainguyen_dungluong CHECK ("dungLuong" IS NULL OR "dungLuong" >= 0)
);

-- =========================
-- 4. KIEM TRA, CAU HOI, DAP AN
-- =========================

CREATE TABLE IF NOT EXISTS baikiemtra (
  "maBaiKiemTra" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiHoc" UUID NOT NULL,
  "tieuDe" VARCHAR(255) NOT NULL,
  "moTa" TEXT,
  "loaiBaiKiemTra" VARCHAR(50) NOT NULL,
  "thoiGianLamBai" INT,
  "diemDatYeuCau" NUMERIC(5,2) NOT NULL DEFAULT 80,
  "soLanLamToiDa" INT,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'Nhap',
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_baikiemtra_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE,
  CONSTRAINT chk_baikiemtra_loai
    CHECK ("loaiBaiKiemTra" IN ('LuyenTap', 'CuoiBai', 'CuoiNgay')),
  CONSTRAINT chk_baikiemtra_diemdat CHECK ("diemDatYeuCau" BETWEEN 0 AND 100),
  CONSTRAINT chk_baikiemtra_thoigian CHECK ("thoiGianLamBai" IS NULL OR "thoiGianLamBai" > 0),
  CONSTRAINT chk_baikiemtra_solan CHECK ("soLanLamToiDa" IS NULL OR "soLanLamToiDa" > 0),
  CONSTRAINT chk_baikiemtra_trangthai
    CHECK ("trangThai" IN ('Nhap', 'CongBo', 'An'))
);

CREATE TABLE IF NOT EXISTS cauhoi (
  "maCauHoi" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiKiemTra" UUID NOT NULL,
  "noiDung" TEXT NOT NULL,
  "loaiCauHoi" VARCHAR(50) NOT NULL,
  diem NUMERIC(5,2) NOT NULL,
  "doKho" VARCHAR(30),
  "giaiThichDapAn" TEXT,
  audio TEXT,
  "hinhAnh" TEXT,
  "thuTu" INT NOT NULL,
  CONSTRAINT fk_cauhoi_baikiemtra
    FOREIGN KEY ("maBaiKiemTra") REFERENCES baikiemtra("maBaiKiemTra")
    ON DELETE CASCADE,
  CONSTRAINT chk_cauhoi_loai
    CHECK ("loaiCauHoi" IN ('MotDapAn', 'NhieuDapAn', 'DienTu', 'GhepCau', 'Nghe')),
  CONSTRAINT chk_cauhoi_dokho
    CHECK ("doKho" IS NULL OR "doKho" IN ('De', 'TrungBinh', 'Kho')),
  CONSTRAINT chk_cauhoi_diem CHECK (diem > 0),
  CONSTRAINT chk_cauhoi_thutu CHECK ("thuTu" > 0),
  CONSTRAINT uq_cauhoi_thutu UNIQUE ("maBaiKiemTra", "thuTu")
);

CREATE TABLE IF NOT EXISTS dapan (
  "maDapAn" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maCauHoi" UUID NOT NULL,
  "noiDung" TEXT NOT NULL,
  "laDapAnDung" BOOLEAN NOT NULL DEFAULT FALSE,
  "thuTu" INT NOT NULL,
  CONSTRAINT fk_dapan_cauhoi
    FOREIGN KEY ("maCauHoi") REFERENCES cauhoi("maCauHoi")
    ON DELETE CASCADE,
  CONSTRAINT chk_dapan_thutu CHECK ("thuTu" > 0),
  CONSTRAINT uq_dapan_thutu UNIQUE ("maCauHoi", "thuTu")
);

-- =========================
-- 5. LAM BAI VA KET QUA
-- =========================

CREATE TABLE IF NOT EXISTS lanlambai (
  "maLanLam" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maBaiKiemTra" UUID NOT NULL,
  "maHocVien" UUID NOT NULL,
  "thoiGianBatDau" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "thoiGianNopBai" TIMESTAMP,
  "diemSo" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "soCauDung" INT NOT NULL DEFAULT 0,
  "soCauSai" INT NOT NULL DEFAULT 0,
  "phanTramDung" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'DangLam',
  "lanThu" INT NOT NULL,
  CONSTRAINT fk_lanlambai_baikiemtra
    FOREIGN KEY ("maBaiKiemTra") REFERENCES baikiemtra("maBaiKiemTra")
    ON DELETE CASCADE,
  CONSTRAINT fk_lanlambai_hocvien
    FOREIGN KEY ("maHocVien") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_lanlambai_diem CHECK ("diemSo" >= 0),
  CONSTRAINT chk_lanlambai_socau CHECK ("soCauDung" >= 0 AND "soCauSai" >= 0),
  CONSTRAINT chk_lanlambai_phantram CHECK ("phanTramDung" BETWEEN 0 AND 100),
  CONSTRAINT chk_lanlambai_lanthu CHECK ("lanThu" > 0),
  CONSTRAINT chk_lanlambai_trangthai
    CHECK ("trangThai" IN ('DangLam', 'DaNop', 'Dat', 'KhongDat')),
  CONSTRAINT uq_lanlambai_lanthu UNIQUE ("maBaiKiemTra", "maHocVien", "lanThu")
);

CREATE TABLE IF NOT EXISTS cautraloihocvien (
  "maCauTraLoi" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maLanLam" UUID NOT NULL,
  "maCauHoi" UUID NOT NULL,
  "maDapAn" UUID,
  "noiDungTraLoi" TEXT,
  "dungSai" BOOLEAN,
  "diemDatDuoc" NUMERIC(5,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_ctlhv_lanlam
    FOREIGN KEY ("maLanLam") REFERENCES lanlambai("maLanLam")
    ON DELETE CASCADE,
  CONSTRAINT fk_ctlhv_cauhoi
    FOREIGN KEY ("maCauHoi") REFERENCES cauhoi("maCauHoi")
    ON DELETE CASCADE,
  CONSTRAINT fk_ctlhv_dapan
    FOREIGN KEY ("maDapAn") REFERENCES dapan("maDapAn")
    ON DELETE SET NULL,
  CONSTRAINT chk_ctlhv_noidung CHECK ("maDapAn" IS NOT NULL OR "noiDungTraLoi" IS NOT NULL),
  CONSTRAINT chk_ctlhv_diem CHECK ("diemDatDuoc" >= 0)
);

-- =========================
-- 6. TIEN TRINH HOC TAP
-- =========================

CREATE TABLE IF NOT EXISTS tientrinhhoctap (
  "maTienTrinh" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maHocVien" UUID NOT NULL,
  "maBaiHoc" UUID NOT NULL,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'ChuaHoc',
  "phanTramHoanThanh" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "diemCaoNhat" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "ngayBatDau" TIMESTAMP,
  "ngayHoanThanh" TIMESTAMP,
  "ngayCapNhat" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tientrinh_hocvien
    FOREIGN KEY ("maHocVien") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_tientrinh_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE,
  CONSTRAINT uq_tientrinh UNIQUE ("maHocVien", "maBaiHoc"),
  CONSTRAINT chk_tientrinh_trangthai
    CHECK ("trangThai" IN ('BiKhoa', 'ChuaHoc', 'DangHoc', 'HoanThanh')),
  CONSTRAINT chk_tientrinh_phantram CHECK ("phanTramHoanThanh" BETWEEN 0 AND 100),
  CONSTRAINT chk_tientrinh_diemcao CHECK ("diemCaoNhat" BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS hoanthanh_nhiemvu (
  "maHoanThanh" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maHocVien" UUID NOT NULL,
  "maNhiemVu" UUID NOT NULL,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'ChuaLam',
  "thoiGianHoanThanh" TIMESTAMP,
  CONSTRAINT fk_htnv_hocvien
    FOREIGN KEY ("maHocVien") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_htnv_nhiemvu
    FOREIGN KEY ("maNhiemVu") REFERENCES nhiemvuhoctap("maNhiemVu")
    ON DELETE CASCADE,
  CONSTRAINT uq_htnv UNIQUE ("maHocVien", "maNhiemVu"),
  CONSTRAINT chk_htnv_trangthai
    CHECK ("trangThai" IN ('ChuaLam', 'HoanThanh'))
);

-- =========================
-- 7. GAMIFICATION VA HO TRO HOC TAP
-- =========================

CREATE TABLE IF NOT EXISTS thucunghoctap (
  "maThuCung" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL UNIQUE,
  "tenThuCung" VARCHAR(100) NOT NULL,
  "loaiThuCung" VARCHAR(50) NOT NULL DEFAULT 'ChimCanhCut',
  "capDo" INT NOT NULL DEFAULT 1,
  "diemKinhNghiem" INT NOT NULL DEFAULT 0,
  "vang" INT NOT NULL DEFAULT 0,
  "mucDoVui" INT NOT NULL DEFAULT 85,
  "mucDoGanBo" INT NOT NULL DEFAULT 50,
  "tamTrang" VARCHAR(30) NOT NULL DEFAULT 'VuiVe',
  "phuKien" VARCHAR(100),
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngayCapNhat" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_thucung_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_thucung_loai
    CHECK ("loaiThuCung" IN ('ChimCanhCut', 'RongCon', 'MieuCon', 'SaoBien')),
  CONSTRAINT chk_thucung_capdo CHECK ("capDo" > 0),
  CONSTRAINT chk_thucung_xp CHECK ("diemKinhNghiem" >= 0),
  CONSTRAINT chk_thucung_vang CHECK ("vang" >= 0),
  CONSTRAINT chk_thucung_vui CHECK ("mucDoVui" BETWEEN 0 AND 100),
  CONSTRAINT chk_thucung_ganbo CHECK ("mucDoGanBo" BETWEEN 0 AND 100),
  CONSTRAINT chk_thucung_tamtrang
    CHECK ("tamTrang" IN ('VuiVe', 'HocChung', 'NhoBan', 'PhanKich', 'BinhAn'))
);

CREATE TABLE IF NOT EXISTS huyhieuhoctap (
  "maHuyHieu" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maCode" VARCHAR(80) NOT NULL UNIQUE,
  "tenHuyHieu" VARCHAR(150) NOT NULL,
  "moTa" TEXT,
  "loaiHuyHieu" VARCHAR(50) NOT NULL,
  "icon" VARCHAR(100),
  "mauSac" VARCHAR(30),
  "diemThuong" INT NOT NULL DEFAULT 0,
  "dieuKien" TEXT,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_huyhieu_loai
    CHECK ("loaiHuyHieu" IN ('HocTap', 'Game', 'Streak', 'AI', 'CongDong')),
  CONSTRAINT chk_huyhieu_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'An'))
);

CREATE TABLE IF NOT EXISTS nguoidung_huyhieu (
  "maNguoiDung" UUID NOT NULL,
  "maHuyHieu" UUID NOT NULL,
  "ngayNhan" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'DaNhan',
  PRIMARY KEY ("maNguoiDung", "maHuyHieu"),
  CONSTRAINT fk_nd_huyhieu_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_nd_huyhieu_huyhieu
    FOREIGN KEY ("maHuyHieu") REFERENCES huyhieuhoctap("maHuyHieu")
    ON DELETE CASCADE,
  CONSTRAINT chk_nd_huyhieu_trangthai
    CHECK ("trangThai" IN ('DaNhan', 'DaDung', 'DaAn'))
);

CREATE TABLE IF NOT EXISTS nhiemvungay (
  "maNhiemVuNgay" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maCode" VARCHAR(80) NOT NULL UNIQUE,
  "tieuDe" VARCHAR(200) NOT NULL,
  "moTa" TEXT,
  "loaiNhiemVu" VARCHAR(50) NOT NULL,
  "mucTieu" INT NOT NULL DEFAULT 1,
  "xpThuong" INT NOT NULL DEFAULT 50,
  "vangThuong" INT NOT NULL DEFAULT 5,
  "icon" VARCHAR(100),
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_nhiemvungay_loai
    CHECK ("loaiNhiemVu" IN ('TuVung', 'Quiz', 'AI', 'Pet', 'Nghe', 'Noi')),
  CONSTRAINT chk_nhiemvungay_muctieu CHECK ("mucTieu" > 0),
  CONSTRAINT chk_nhiemvungay_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'An'))
);

CREATE TABLE IF NOT EXISTS nguoidung_nhiemvungay (
  "maNguoiDung" UUID NOT NULL,
  "maNhiemVuNgay" UUID NOT NULL,
  "soTienDo" INT NOT NULL DEFAULT 0,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'DangLam',
  "daNhanThuong" BOOLEAN NOT NULL DEFAULT FALSE,
  "ngayHoanThanh" TIMESTAMP,
  PRIMARY KEY ("maNguoiDung", "maNhiemVuNgay"),
  CONSTRAINT fk_nd_nvngay_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_nd_nvngay_nhiemvu
    FOREIGN KEY ("maNhiemVuNgay") REFERENCES nhiemvungay("maNhiemVuNgay")
    ON DELETE CASCADE,
  CONSTRAINT chk_nd_nvngay_tiendo CHECK ("soTienDo" >= 0),
  CONSTRAINT chk_nd_nvngay_trangthai
    CHECK ("trangThai" IN ('DangLam', 'HoanThanh')),
  CONSTRAINT uq_nd_nvngay UNIQUE ("maNguoiDung", "maNhiemVuNgay")
);

CREATE TABLE IF NOT EXISTS minigame (
  "maMiniGame" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maCode" VARCHAR(80) NOT NULL UNIQUE,
  "tenMiniGame" VARCHAR(200) NOT NULL,
  "moTa" TEXT,
  "loaiMiniGame" VARCHAR(50) NOT NULL,
  "capDo" VARCHAR(50),
  "diemThuong" INT NOT NULL DEFAULT 0,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'HoatDong',
  "hinhAnh" TEXT,
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_minigame_loai
    CHECK ("loaiMiniGame" IN ('GhepCap', 'ChonHinh', 'NgheNhanh', 'AI', 'ChayDua')),
  CONSTRAINT chk_minigame_trangthai
    CHECK ("trangThai" IN ('HoatDong', 'An'))
);

CREATE TABLE IF NOT EXISTS lanchoigame (
  "maLanChoi" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL,
  "maMiniGame" UUID NOT NULL,
  "diemSo" INT NOT NULL DEFAULT 0,
  "soSao" INT NOT NULL DEFAULT 0,
  "ketQua" VARCHAR(30) NOT NULL DEFAULT 'DangChoi',
  "thoiGianChoi" INT,
  "ngayChoi" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lanchoi_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_lanchoi_minigame
    FOREIGN KEY ("maMiniGame") REFERENCES minigame("maMiniGame")
    ON DELETE CASCADE,
  CONSTRAINT chk_lanchoi_diem CHECK ("diemSo" >= 0),
  CONSTRAINT chk_lanchoi_sao CHECK ("soSao" BETWEEN 0 AND 3),
  CONSTRAINT chk_lanchoi_ketqua
    CHECK ("ketQua" IN ('DangChoi', 'HoanThanh', 'DatKyLuc'))
);

CREATE TABLE IF NOT EXISTS phantichhinhanh (
  "maPhanTich" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL,
  "tenTapTin" TEXT,
  "duongDanAnh" TEXT NOT NULL,
  "tuKhoaNhap" TEXT,
  "tuKhoaNhanRa" VARCHAR(150) NOT NULL,
  "nghiaTiengViet" TEXT NOT NULL,
  "phienAm" VARCHAR(100),
  "cauViDu" TEXT,
  "yTuongTuVung" TEXT,
  "doTinCay" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "loaiNoiDung" VARCHAR(50) NOT NULL DEFAULT 'DoVat',
  "nguonNhanDang" VARCHAR(50) NOT NULL DEFAULT 'DemoVision',
  "ngayPhanTich" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ptanh_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_ptanh_dotincay CHECK ("doTinCay" BETWEEN 0 AND 100),
  CONSTRAINT chk_ptanh_loai
    CHECK ("loaiNoiDung" IN ('DoVat', 'ConVat', 'DoAn', 'NoiThat', 'HocLieu', 'Khac'))
);

CREATE TABLE IF NOT EXISTS noidungyeuthich (
  "maYeuThich" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL,
  "loaiNoiDung" VARCHAR(50) NOT NULL,
  "maNoiDung" UUID NOT NULL,
  "ngayLuu" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_yeuthich_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_yeuthich_loai
    CHECK ("loaiNoiDung" IN ('BaiHoc', 'TuVung', 'NguPhap', 'BaiKiemTra')),
  CONSTRAINT uq_yeuthich UNIQUE ("maNguoiDung", "loaiNoiDung", "maNoiDung")
);

CREATE TABLE IF NOT EXISTS goiyontap (
  "maGoiY" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maHocVien" UUID NOT NULL,
  "maBaiHoc" UUID,
  "maChuDe" UUID,
  "lyDo" TEXT NOT NULL,
  "mucDoUuTien" INT NOT NULL DEFAULT 1,
  "trangThai" VARCHAR(30) NOT NULL DEFAULT 'ChuaXem',
  "ngayTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_goiy_hocvien
    FOREIGN KEY ("maHocVien") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT fk_goiy_baihoc
    FOREIGN KEY ("maBaiHoc") REFERENCES baihoc("maBaiHoc")
    ON DELETE CASCADE,
  CONSTRAINT fk_goiy_chude
    FOREIGN KEY ("maChuDe") REFERENCES chudehoc("maChuDe")
    ON DELETE CASCADE,
  CONSTRAINT chk_goiy_doituong CHECK ("maBaiHoc" IS NOT NULL OR "maChuDe" IS NOT NULL),
  CONSTRAINT chk_goiy_uutien CHECK ("mucDoUuTien" > 0),
  CONSTRAINT chk_goiy_trangthai
    CHECK ("trangThai" IN ('ChuaXem', 'DaXem', 'HoanThanh'))
);

CREATE TABLE IF NOT EXISTS thongbao (
  "maThongBao" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID NOT NULL,
  "tieuDe" VARCHAR(255) NOT NULL,
  "noiDung" TEXT NOT NULL,
  "loaiThongBao" VARCHAR(50) NOT NULL,
  "daDoc" BOOLEAN NOT NULL DEFAULT FALSE,
  "ngayGui" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_thongbao_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE CASCADE,
  CONSTRAINT chk_thongbao_loai
    CHECK ("loaiThongBao" IN ('HeThong', 'TienTrinh', 'BaiKiemTra', 'CanhBao'))
);

-- =========================
-- 8. NHAT KY VA BAO CAO
-- =========================

CREATE TABLE IF NOT EXISTS nhatkyhoatdong (
  "maNhatKy" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "maNguoiDung" UUID,
  "hanhDong" VARCHAR(100) NOT NULL,
  "loaiDoiTuong" VARCHAR(50),
  "maDoiTuong" UUID,
  "moTa" TEXT,
  "thoiGian" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nhatky_nguoidung
    FOREIGN KEY ("maNguoiDung") REFERENCES nguoidung("maNguoiDung")
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS baocaothongke (
  "maBaoCao" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loaiBaoCao" VARCHAR(100) NOT NULL,
  "noiDungBaoCao" JSONB NOT NULL,
  "maNguoiTao" UUID,
  "thoiGianTao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_baocao_nguoitao
    FOREIGN KEY ("maNguoiTao") REFERENCES nguoidung("maNguoiDung")
    ON DELETE SET NULL,
  CONSTRAINT chk_baocao_loai
    CHECK ("loaiBaoCao" IN ('NguoiDung', 'HocTap', 'BaiKiemTra', 'HeThong'))
);

-- =========================
-- 9. INDEX TOI UU TRUY VAN
-- =========================

CREATE INDEX IF NOT EXISTS idx_nguoidung_email ON nguoidung(email);
CREATE INDEX IF NOT EXISTS idx_nguoidung_trangthai ON nguoidung("trangThai");

CREATE INDEX IF NOT EXISTS idx_lotrinhhoc_trangthai ON lotrinhhoc("trangThai");
CREATE INDEX IF NOT EXISTS idx_giaidoanhoc_lotrinh ON giaidoanhoc("maLoTrinh");
CREATE INDEX IF NOT EXISTS idx_baihoc_giaidoan ON baihoc("maGiaiDoan");
CREATE INDEX IF NOT EXISTS idx_baihoc_chude ON baihoc("maChuDe");
CREATE INDEX IF NOT EXISTS idx_baihoc_trangthai ON baihoc("trangThai");

CREATE INDEX IF NOT EXISTS idx_nhiemvu_baihoc ON nhiemvuhoctap("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_tuvung_baihoc ON tuvung("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_nguphap_baihoc ON nguphap("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_tainguyen_baihoc ON tainguyenhoctap("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_tainguyen_nhiemvu ON tainguyenhoctap("maNhiemVu");

CREATE INDEX IF NOT EXISTS idx_baikiemtra_baihoc ON baikiemtra("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_cauhoi_baikiemtra ON cauhoi("maBaiKiemTra");
CREATE INDEX IF NOT EXISTS idx_dapan_cauhoi ON dapan("maCauHoi");

CREATE INDEX IF NOT EXISTS idx_lanlambai_hocvien ON lanlambai("maHocVien");
CREATE INDEX IF NOT EXISTS idx_lanlambai_baikiemtra ON lanlambai("maBaiKiemTra");
CREATE INDEX IF NOT EXISTS idx_ctlhv_lanlam ON cautraloihocvien("maLanLam");

CREATE INDEX IF NOT EXISTS idx_tientrinh_hocvien ON tientrinhhoctap("maHocVien");
CREATE INDEX IF NOT EXISTS idx_tientrinh_baihoc ON tientrinhhoctap("maBaiHoc");
CREATE INDEX IF NOT EXISTS idx_htnv_hocvien ON hoanthanh_nhiemvu("maHocVien");

CREATE INDEX IF NOT EXISTS idx_thucung_nguoidung ON thucunghoctap("maNguoiDung");
CREATE INDEX IF NOT EXISTS idx_huyhieu_code ON huyhieuhoctap("maCode");
CREATE INDEX IF NOT EXISTS idx_nd_huyhieu_nguoidung ON nguoidung_huyhieu("maNguoiDung");
CREATE INDEX IF NOT EXISTS idx_nhiemvungay_code ON nhiemvungay("maCode");
CREATE INDEX IF NOT EXISTS idx_nd_nhiemvungay_nguoidung ON nguoidung_nhiemvungay("maNguoiDung");
CREATE INDEX IF NOT EXISTS idx_minigame_code ON minigame("maCode");
CREATE INDEX IF NOT EXISTS idx_lanchoigame_nguoidung ON lanchoigame("maNguoiDung");
CREATE INDEX IF NOT EXISTS idx_phantichhinhanh_nguoidung ON phantichhinhanh("maNguoiDung");

CREATE INDEX IF NOT EXISTS idx_thongbao_nguoidung ON thongbao("maNguoiDung");
CREATE INDEX IF NOT EXISTS idx_nhatky_nguoidung ON nhatkyhoatdong("maNguoiDung");

-- =========================
-- 10. DU LIEU MAC DINH
-- =========================

INSERT INTO vaitro ("tenVaiTro", "moTa")
VALUES
  ('HocVien', 'Nguoi hoc su dung he thong de hoc bai, lam bai kiem tra va theo doi tien trinh.'),
  ('PhuHuynh', 'Nguoi theo doi tien trinh va ket qua hoc tap cua hoc vien.'),
  ('GiaoVien', 'Nguoi quan ly noi dung hoc tap, cau hoi va bai kiem tra.'),
  ('QuanTriVien', 'Nguoi quan tri toan bo he thong.')
ON CONFLICT ("tenVaiTro") DO NOTHING;

-- Tai khoan mau sau khi import:
-- admin@englishpro.local / 123456
-- giaovien@englishpro.local / 123456
-- phuhuynh@englishpro.local / 123456
-- hocvien1@englishpro.local / 123456
-- hocvien2@englishpro.local / 123456

INSERT INTO nguoidung (
  "maNguoiDung", "hoTen", email, "soDienThoai", "matKhau",
  "anhDaiDien", "ngaySinh", "gioiTinh", "trangThai"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Quan tri vien he thong',
    'admin@englishpro.local',
    '0900000001',
    crypt('123456', gen_salt('bf')),
    '/uploads/avatars/admin.png',
    '1995-01-01',
    'Khac',
    'HoatDong'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Co Nguyen Minh Anh',
    'giaovien@englishpro.local',
    '0900000002',
    crypt('123456', gen_salt('bf')),
    '/uploads/avatars/giao-vien.png',
    '1996-05-12',
    'Nu',
    'HoatDong'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Phu huynh Tran Van Nam',
    'phuhuynh@englishpro.local',
    '0900000003',
    crypt('123456', gen_salt('bf')),
    '/uploads/avatars/phu-huynh.png',
    '1988-09-20',
    'Nam',
    'HoatDong'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Hoc vien Tran Minh Khang',
    'hocvien1@englishpro.local',
    '0900000004',
    crypt('123456', gen_salt('bf')),
    '/uploads/avatars/hoc-vien-1.png',
    '2014-03-15',
    'Nam',
    'HoatDong'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Hoc vien Le Phuong Linh',
    'hocvien2@englishpro.local',
    '0900000005',
    crypt('123456', gen_salt('bf')),
    '/uploads/avatars/hoc-vien-2.png',
    '2013-11-08',
    'Nu',
    'HoatDong'
  )
ON CONFLICT ("maNguoiDung") DO UPDATE SET
  "hoTen" = EXCLUDED."hoTen",
  email = EXCLUDED.email,
  "soDienThoai" = EXCLUDED."soDienThoai",
  "anhDaiDien" = EXCLUDED."anhDaiDien",
  "ngaySinh" = EXCLUDED."ngaySinh",
  "gioiTinh" = EXCLUDED."gioiTinh",
  "trangThai" = EXCLUDED."trangThai",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
SELECT '00000000-0000-0000-0000-000000000001'::UUID, "maVaiTro"
FROM vaitro WHERE "tenVaiTro" = 'QuanTriVien'
ON CONFLICT DO NOTHING;

INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
SELECT '00000000-0000-0000-0000-000000000002'::UUID, "maVaiTro"
FROM vaitro WHERE "tenVaiTro" = 'GiaoVien'
ON CONFLICT DO NOTHING;

INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
SELECT '00000000-0000-0000-0000-000000000003'::UUID, "maVaiTro"
FROM vaitro WHERE "tenVaiTro" = 'PhuHuynh'
ON CONFLICT DO NOTHING;

INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
SELECT '00000000-0000-0000-0000-000000000004'::UUID, "maVaiTro"
FROM vaitro WHERE "tenVaiTro" = 'HocVien'
ON CONFLICT DO NOTHING;

INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
SELECT '00000000-0000-0000-0000-000000000005'::UUID, "maVaiTro"
FROM vaitro WHERE "tenVaiTro" = 'HocVien'
ON CONFLICT DO NOTHING;

INSERT INTO hosohocvien (
  "maHoSoHocVien", "maNguoiDung", "trinhDoHienTai",
  "mucTieuHocTap", "tongDiem", "chuoiNgayHoc", "ngayBatDauHoc"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000004',
    'A1',
    'Nam vung tu vung va mau cau giao tiep co ban trong 4 tuan.',
    280,
    5,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000005',
    'A1',
    'Cai thien nghe hieu va ngu phap nen tang.',
    120,
    2,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
  )
ON CONFLICT ("maHoSoHocVien") DO UPDATE SET
  "trinhDoHienTai" = EXCLUDED."trinhDoHienTai",
  "mucTieuHocTap" = EXCLUDED."mucTieuHocTap",
  "tongDiem" = EXCLUDED."tongDiem",
  "chuoiNgayHoc" = EXCLUDED."chuoiNgayHoc";

INSERT INTO lienket_phuhuynh_hocvien (
  "maLienKet", "maPhuHuynh", "maHocVien", "trangThai"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'DaChapNhan'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'ChoDuyet'
  )
ON CONFLICT ("maPhuHuynh", "maHocVien") DO UPDATE SET
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO lotrinhhoc (
  "maLoTrinh", "tenLoTrinh", "moTa", "capDo", "doiTuong",
  "trangThai", "maNguoiTao"
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Lo trinh A1 - Tieng Anh nen tang 4 tuan',
    'Lo trinh danh cho nguoi moi bat dau, tap trung tu vung, ngu phap, nghe hieu va giao tiep don gian. Moi ngay hoc gom nhiem vu va bai kiem tra ngan, yeu cau dat tu 80% de mo khoa bai tiep theo.',
    'A1',
    'Hoc sinh, sinh vien, nguoi moi bat dau',
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Lo trinh A2 - Giao tiep hang ngay',
    'Lo trinh mo rong sau A1, tap trung hoi thoai, thoi quen hang ngay, nghe tinh huong va cau truc cau thong dung.',
    'A2',
    'Nguoi hoc da co nen tang A1',
    'Nhap',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT ("maLoTrinh") DO UPDATE SET
  "tenLoTrinh" = EXCLUDED."tenLoTrinh",
  "moTa" = EXCLUDED."moTa",
  "capDo" = EXCLUDED."capDo",
  "doiTuong" = EXCLUDED."doiTuong",
  "trangThai" = EXCLUDED."trangThai",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO giaidoanhoc (
  "maGiaiDoan", "maLoTrinh", "tenGiaiDoan", "loaiGiaiDoan", "thuTu", "moTa"
)
VALUES
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ngay 1 - Greetings and introductions', 'Ngay', 1, 'Lam quen voi loi chao, gioi thieu ten va hoi tham co ban.'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Ngay 2 - Classroom objects', 'Ngay', 2, 'Hoc tu vung do vat trong lop va cau truc This is/That is.'),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Ngay 3 - Family members', 'Ngay', 3, 'Gioi thieu thanh vien gia dinh va so huu cach.'),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Ngay 4 - Daily routines', 'Ngay', 4, 'Noi ve thoi quen hang ngay voi thi hien tai don.'),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Ngay 5 - Food and drinks', 'Ngay', 5, 'Hoc tu vung do an, do uong va cach goi mon don gian.'),
  ('11000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Ngay 6 - Review test', 'Ngay', 6, 'On tap tong hop va lam bai kiem tra cuoi tuan.')
ON CONFLICT ("maGiaiDoan") DO UPDATE SET
  "tenGiaiDoan" = EXCLUDED."tenGiaiDoan",
  "loaiGiaiDoan" = EXCLUDED."loaiGiaiDoan",
  "thuTu" = EXCLUDED."thuTu",
  "moTa" = EXCLUDED."moTa";

INSERT INTO chudehoc (
  "maChuDe", "tenChuDe", "moTa", "capDo", "kyNang", "trangThai"
)
VALUES
  ('12000000-0000-0000-0000-000000000001', 'Chao hoi va gioi thieu', 'Tu vung va mau cau dung khi gap go lan dau.', 'A1', 'TuVung', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000002', 'Do vat trong lop hoc', 'Ten goi do vat quen thuoc trong lop va cau gioi thieu do vat.', 'A1', 'TuVung', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000003', 'Gia dinh', 'Tu vung thanh vien gia dinh va cach noi ve moi quan he.', 'A1', 'TuVung', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000004', 'Ngu phap co ban A1', 'Dong tu to be, this/that, hien tai don va so huu cach.', 'A1', 'NguPhap', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000005', 'Luyen nghe A1', 'Bai nghe ngan voi tinh huong lop hoc, gia dinh va thoi quen.', 'A1', 'Nghe', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000006', 'An uong hang ngay', 'Tu vung va mau cau ve do an, do uong, so thich.', 'A1', 'TuVung', 'HoatDong')
ON CONFLICT ("maChuDe") DO UPDATE SET
  "tenChuDe" = EXCLUDED."tenChuDe",
  "moTa" = EXCLUDED."moTa",
  "capDo" = EXCLUDED."capDo",
  "kyNang" = EXCLUDED."kyNang",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO baihoc (
  "maBaiHoc", "maGiaiDoan", "maChuDe", "tieuDe", "moTa", "noiDung",
  "capDo", "thuTu", "diemDatYeuCau", "trangThai", "maNguoiTao"
)
VALUES
  (
    '13000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'Bai 1: Hello! What is your name?',
    'Hoc loi chao, cach hoi ten va gioi thieu ban than.',
    'Trong bai hoc nay, nguoi hoc lam quen voi cac mau cau: Hello, Hi, Good morning, What is your name?, My name is..., Nice to meet you. Muc tieu la co the chao hoi va gioi thieu ten trong tinh huong co ban.',
    'A1',
    1,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000002',
    '12000000-0000-0000-0000-000000000002',
    'Bai 2: This is my book',
    'Hoc tu vung do vat trong lop va mau cau This is/That is.',
    'Bai hoc cung cap tu vung book, pen, pencil, desk, chair, board va cach dung This is, That is de gioi thieu do vat o gan hoac xa nguoi noi.',
    'A1',
    2,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000003',
    '11000000-0000-0000-0000-000000000003',
    '12000000-0000-0000-0000-000000000003',
    'Bai 3: My family',
    'Gioi thieu thanh vien gia dinh va cau truc so huu don gian.',
    'Nguoi hoc nam cac tu father, mother, brother, sister, grandmother, grandfather va mau cau This is my..., He is my..., She is my....',
    'A1',
    3,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000004',
    '11000000-0000-0000-0000-000000000004',
    '12000000-0000-0000-0000-000000000004',
    'Bai 4: I get up at six',
    'Noi ve thoi quen hang ngay bang hien tai don.',
    'Bai hoc tap trung vao cac dong tu get up, brush, go, study, play, sleep va mau cau I + verb + time. Nguoi hoc thuc hanh noi lich trinh co ban.',
    'A1',
    4,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000005',
    '11000000-0000-0000-0000-000000000005',
    '12000000-0000-0000-0000-000000000006',
    'Bai 5: I like milk',
    'Tu vung do an, do uong va cach noi ve so thich.',
    'Nguoi hoc nam tu vung rice, bread, milk, water, juice, apple va mau cau I like..., I do not like..., Do you like...?',
    'A1',
    5,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000006',
    '11000000-0000-0000-0000-000000000006',
    '12000000-0000-0000-0000-000000000005',
    'Bai 6: Review week 1',
    'On tap tu vung, ngu phap va nghe hieu trong tuan dau.',
    'Bai on tap gom cac noi dung chao hoi, lop hoc, gia dinh, thoi quen va do an. Nguoi hoc can dat bai kiem tra tong hop de hoan thanh tuan 1.',
    'A1',
    6,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT ("maBaiHoc") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "moTa" = EXCLUDED."moTa",
  "noiDung" = EXCLUDED."noiDung",
  "capDo" = EXCLUDED."capDo",
  "thuTu" = EXCLUDED."thuTu",
  "diemDatYeuCau" = EXCLUDED."diemDatYeuCau",
  "trangThai" = EXCLUDED."trangThai",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO nhiemvuhoctap (
  "maNhiemVu", "maBaiHoc", "tieuDe", "huongDan", "loaiNhiemVu", "batBuoc", "thuTu", "trangThai"
)
VALUES
  ('14000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hoc 6 mau cau chao hoi', 'Doc to cac mau cau va ghi nho nghia tieng Viet.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'Nghe doan hoi thoai ngan', 'Nghe audio 2 lan, sau do lap lai tung cau.', 'Nghe', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000001', 'Lam bai luyen tap chao hoi', 'Chon dap an dung cho cac tinh huong chao hoi.', 'LuyenTap', TRUE, 3, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000002', 'Hoc tu vung do vat lop hoc', 'Quan sat hinh anh va doc to cac tu moi.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000002', 'Hoc cau truc This is/That is', 'Doc ly thuyet va dat 3 cau vi du voi do vat gan ban.', 'NguPhap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000003', 'Hoc tu vung gia dinh', 'Ghi nho tu vung va noi ve 3 thanh vien trong gia dinh.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000007', '13000000-0000-0000-0000-000000000003', 'Luyen noi gioi thieu gia dinh', 'Dung mau cau This is my... de gioi thieu thanh vien gia dinh.', 'LuyenTap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000008', '13000000-0000-0000-0000-000000000004', 'Hoc dong tu thoi quen hang ngay', 'Doc va dat cau voi get up, study, play, sleep.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000009', '13000000-0000-0000-0000-000000000004', 'Hoc hien tai don voi I', 'Hoan thanh 5 cau ve lich trinh ca nhan.', 'NguPhap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000010', '13000000-0000-0000-0000-000000000005', 'Hoc tu vung do an va do uong', 'Nghe phat am va chon hinh anh phu hop.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000011', '13000000-0000-0000-0000-000000000005', 'Luyen mau cau I like...', 'Viet 5 cau ve mon an/do uong yeu thich.', 'LuyenTap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000012', '13000000-0000-0000-0000-000000000006', 'On tap tong hop tuan 1', 'Xem lai cac bai da hoc va lam bai kiem tra tong hop.', 'LuyenTap', TRUE, 1, 'HoatDong')
ON CONFLICT ("maNhiemVu") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "huongDan" = EXCLUDED."huongDan",
  "loaiNhiemVu" = EXCLUDED."loaiNhiemVu",
  "batBuoc" = EXCLUDED."batBuoc",
  "thuTu" = EXCLUDED."thuTu",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO tuvung (
  "maTuVung", "maBaiHoc", tu, nghia, "phienAm", "loaiTu", "viDu", "nghiaViDu", "audioPhatAm", "hinhAnh"
)
VALUES
  ('15000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'hello', 'xin chao', '/heˈloʊ/', 'interjection', 'Hello, my name is Khang.', 'Xin chao, ten toi la Khang.', '/media/audio/hello.mp3', '/media/images/hello.png'),
  ('15000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'name', 'ten', '/neɪm/', 'noun', 'What is your name?', 'Ten ban la gi?', '/media/audio/name.mp3', '/media/images/name.png'),
  ('15000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000001', 'meet', 'gap', '/miːt/', 'verb', 'Nice to meet you.', 'Rat vui duoc gap ban.', '/media/audio/meet.mp3', '/media/images/meet.png'),
  ('15000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000002', 'book', 'quyen sach', '/bʊk/', 'noun', 'This is my book.', 'Day la quyen sach cua toi.', '/media/audio/book.mp3', '/media/images/book.png'),
  ('15000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000002', 'pen', 'cay but', '/pen/', 'noun', 'That is a blue pen.', 'Do la mot cay but mau xanh.', '/media/audio/pen.mp3', '/media/images/pen.png'),
  ('15000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000002', 'chair', 'cai ghe', '/tʃer/', 'noun', 'This is a chair.', 'Day la mot cai ghe.', '/media/audio/chair.mp3', '/media/images/chair.png'),
  ('15000000-0000-0000-0000-000000000007', '13000000-0000-0000-0000-000000000003', 'father', 'bo/cha', '/ˈfɑːðər/', 'noun', 'He is my father.', 'Ong ay la bo cua toi.', '/media/audio/father.mp3', '/media/images/father.png'),
  ('15000000-0000-0000-0000-000000000008', '13000000-0000-0000-0000-000000000003', 'mother', 'me', '/ˈmʌðər/', 'noun', 'She is my mother.', 'Ba ay la me cua toi.', '/media/audio/mother.mp3', '/media/images/mother.png'),
  ('15000000-0000-0000-0000-000000000009', '13000000-0000-0000-0000-000000000004', 'study', 'hoc', '/ˈstʌdi/', 'verb', 'I study English every day.', 'Toi hoc tieng Anh moi ngay.', '/media/audio/study.mp3', '/media/images/study.png'),
  ('15000000-0000-0000-0000-000000000010', '13000000-0000-0000-0000-000000000004', 'sleep', 'ngu', '/sliːp/', 'verb', 'I sleep at ten.', 'Toi ngu luc 10 gio.', '/media/audio/sleep.mp3', '/media/images/sleep.png'),
  ('15000000-0000-0000-0000-000000000011', '13000000-0000-0000-0000-000000000005', 'milk', 'sua', '/mɪlk/', 'noun', 'I like milk.', 'Toi thich sua.', '/media/audio/milk.mp3', '/media/images/milk.png'),
  ('15000000-0000-0000-0000-000000000012', '13000000-0000-0000-0000-000000000005', 'water', 'nuoc', '/ˈwɔːtər/', 'noun', 'I drink water.', 'Toi uong nuoc.', '/media/audio/water.mp3', '/media/images/water.png')
ON CONFLICT ("maTuVung") DO UPDATE SET
  tu = EXCLUDED.tu,
  nghia = EXCLUDED.nghia,
  "phienAm" = EXCLUDED."phienAm",
  "loaiTu" = EXCLUDED."loaiTu",
  "viDu" = EXCLUDED."viDu",
  "nghiaViDu" = EXCLUDED."nghiaViDu",
  "audioPhatAm" = EXCLUDED."audioPhatAm",
  "hinhAnh" = EXCLUDED."hinhAnh";

INSERT INTO nguphap (
  "maNguPhap", "maBaiHoc", "tieuDe", "cauTruc", "giaiThich", "viDu", "ghiChu"
)
VALUES
  ('16000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hoi va tra loi ten', 'What is your name? - My name is + ten.', 'Dung de hoi ten va gioi thieu ten cua ban than.', 'What is your name? My name is Linh.', 'Co the viet tat What is thanh What''s trong hoi thoai.'),
  ('16000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000002', 'This is va That is', 'This is + danh tu. / That is + danh tu.', 'This is dung cho vat o gan, That is dung cho vat o xa.', 'This is a book. That is a board.', 'Dung a/an truoc danh tu so it dem duoc.'),
  ('16000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000003', 'So huu voi my', 'This is my + danh tu.', 'My nghia la cua toi, dung de noi ve su so huu hoac moi quan he.', 'This is my mother.', 'My khong thay doi theo danh tu sau no.'),
  ('16000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000004', 'Hien tai don voi I', 'I + dong tu nguyen mau + thoi gian.', 'Dung de noi ve thoi quen lap lai hang ngay.', 'I study English every day.', 'Voi chu ngu I, dong tu khong them s/es.'),
  ('16000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000005', 'Noi ve so thich voi like', 'I like + danh tu. / I do not like + danh tu.', 'Dung like de noi ve mon an, do uong hoac hoat dong yeu thich.', 'I like milk. I do not like coffee.', 'Do not co the viet tat thanh don''t.')
ON CONFLICT ("maNguPhap") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "cauTruc" = EXCLUDED."cauTruc",
  "giaiThich" = EXCLUDED."giaiThich",
  "viDu" = EXCLUDED."viDu",
  "ghiChu" = EXCLUDED."ghiChu";

INSERT INTO tainguyenhoctap (
  "maTaiNguyen", "maBaiHoc", "maNhiemVu", "tenTaiNguyen", "loaiTaiNguyen",
  "duongDan", "moTa", "dungLuong", "maNguoiTaiLen"
)
VALUES
  ('17000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', 'Audio hoi thoai chao hoi', 'Audio', '/media/audio/dialogue-greetings.mp3', 'Doan hoi thoai ngan giua hai hoc sinh lan dau gap nhau.', 2048000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', NULL, 'Tranh tinh huong chao hoi', 'HinhAnh', '/media/images/greetings-scene.png', 'Anh minh hoa tinh huong chao hoi trong lop hoc.', 512000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000004', 'Flashcard classroom objects', 'PDF', '/media/docs/classroom-flashcards.pdf', 'Bo flashcard do vat trong lop hoc.', 1024000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000003', NULL, 'So do cay gia dinh', 'HinhAnh', '/media/images/family-tree.png', 'Hinh cay gia dinh dung de luyen noi.', 600000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000004', NULL, 'Audio daily routines', 'Audio', '/media/audio/daily-routines.mp3', 'Bai nghe ngan ve thoi quen cua mot hoc sinh.', 2300000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000006', '14000000-0000-0000-0000-000000000012', 'De on tap tuan 1', 'PDF', '/media/docs/week-1-review.pdf', 'Tai lieu on tap tong hop cac bai trong tuan 1.', 1500000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000007', '13000000-0000-0000-0000-000000000001', NULL, 'Video chao hoi', 'Video', '/media/video/greetings-lesson.mp4', 'Video minh hoa cach chao hoi va gioi thieu ban than.', 8400000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000008', '13000000-0000-0000-0000-000000000004', NULL, 'Video daily routine', 'Video', '/media/video/daily-routine-lesson.mp4', 'Video minh hoa lich trinh hang ngay bang anh dong.', 9600000, '00000000-0000-0000-0000-000000000002')
ON CONFLICT ("maTaiNguyen") DO UPDATE SET
  "tenTaiNguyen" = EXCLUDED."tenTaiNguyen",
  "loaiTaiNguyen" = EXCLUDED."loaiTaiNguyen",
  "duongDan" = EXCLUDED."duongDan",
  "moTa" = EXCLUDED."moTa",
  "dungLuong" = EXCLUDED."dungLuong";

INSERT INTO baikiemtra (
  "maBaiKiemTra", "maBaiHoc", "tieuDe", "moTa", "loaiBaiKiemTra",
  "thoiGianLamBai", "diemDatYeuCau", "soLanLamToiDa", "trangThai"
)
VALUES
  ('18000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Kiem tra Bai 1 - Greetings', 'Danh gia kha nang nhan biet loi chao va mau cau hoi ten.', 'CuoiBai', 10, 80, 3, 'CongBo'),
  ('18000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000002', 'Kiem tra Bai 2 - Classroom objects', 'Danh gia tu vung do vat lop hoc va cau truc This/That.', 'CuoiBai', 10, 80, 3, 'CongBo'),
  ('18000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000003', 'Kiem tra Bai 3 - My family', 'Danh gia tu vung gia dinh va mau cau so huu don gian.', 'CuoiBai', 10, 80, 3, 'CongBo'),
  ('18000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000006', 'Kiem tra tong hop tuan 1', 'Bai kiem tra tong hop sau 6 ngay hoc dau tien.', 'CuoiNgay', 20, 80, 2, 'CongBo')
ON CONFLICT ("maBaiKiemTra") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "moTa" = EXCLUDED."moTa",
  "loaiBaiKiemTra" = EXCLUDED."loaiBaiKiemTra",
  "thoiGianLamBai" = EXCLUDED."thoiGianLamBai",
  "diemDatYeuCau" = EXCLUDED."diemDatYeuCau",
  "soLanLamToiDa" = EXCLUDED."soLanLamToiDa",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO cauhoi (
  "maCauHoi", "maBaiKiemTra", "noiDung", "loaiCauHoi", diem,
  "doKho", "giaiThichDapAn", audio, "hinhAnh", "thuTu"
)
VALUES
  ('19000000-0000-0000-0000-000000000001', '18000000-0000-0000-0000-000000000001', 'Cau nao dung de hoi ten nguoi khac?', 'MotDapAn', 25, 'De', 'What is your name? dung de hoi ten.', NULL, NULL, 1),
  ('19000000-0000-0000-0000-000000000002', '18000000-0000-0000-0000-000000000001', 'Dien tu con thieu: My ____ is Khang.', 'DienTu', 25, 'De', 'Name nghia la ten.', NULL, NULL, 2),
  ('19000000-0000-0000-0000-000000000003', '18000000-0000-0000-0000-000000000001', 'Nice to meet you nghia la gi?', 'MotDapAn', 25, 'De', 'Cau nay dung khi lan dau gap ai do.', NULL, NULL, 3),
  ('19000000-0000-0000-0000-000000000004', '18000000-0000-0000-0000-000000000001', 'Nghe audio va chon loi chao ban nghe duoc.', 'Nghe', 25, 'TrungBinh', 'Trong audio nguoi noi dung tu Hello.', '/media/audio/question-hello.mp3', NULL, 4),
  ('19000000-0000-0000-0000-000000000005', '18000000-0000-0000-0000-000000000002', 'Tu nao co nghia la quyen sach?', 'MotDapAn', 25, 'De', 'Book nghia la quyen sach.', NULL, NULL, 1),
  ('19000000-0000-0000-0000-000000000006', '18000000-0000-0000-0000-000000000002', 'Chon cau dung khi gioi thieu vat o gan.', 'MotDapAn', 25, 'TrungBinh', 'This is dung cho vat o gan nguoi noi.', NULL, NULL, 2),
  ('19000000-0000-0000-0000-000000000007', '18000000-0000-0000-0000-000000000002', 'Dien tu: That is a blue ____.', 'DienTu', 25, 'De', 'Pen la cay but.', NULL, NULL, 3),
  ('19000000-0000-0000-0000-000000000008', '18000000-0000-0000-0000-000000000002', 'Chair nghia la gi?', 'MotDapAn', 25, 'De', 'Chair nghia la cai ghe.', NULL, NULL, 4),
  ('19000000-0000-0000-0000-000000000009', '18000000-0000-0000-0000-000000000003', 'Father nghia la gi?', 'MotDapAn', 25, 'De', 'Father nghia la bo/cha.', NULL, NULL, 1),
  ('19000000-0000-0000-0000-000000000010', '18000000-0000-0000-0000-000000000003', 'Dien tu: She is my ____.', 'DienTu', 25, 'De', 'Mother nghia la me.', NULL, NULL, 2),
  ('19000000-0000-0000-0000-000000000011', '18000000-0000-0000-0000-000000000003', 'Cau nao dung de gioi thieu me cua toi?', 'MotDapAn', 25, 'TrungBinh', 'This is my mother la cau dung.', NULL, NULL, 3),
  ('19000000-0000-0000-0000-000000000012', '18000000-0000-0000-0000-000000000003', 'My dung de dien ta dieu gi?', 'MotDapAn', 25, 'De', 'My la tinh tu so huu nghia la cua toi.', NULL, NULL, 4),
  ('19000000-0000-0000-0000-000000000013', '18000000-0000-0000-0000-000000000004', 'Chon loi chao dung trong tieng Anh.', 'MotDapAn', 20, 'De', 'Hello la loi chao thong dung.', NULL, NULL, 1),
  ('19000000-0000-0000-0000-000000000014', '18000000-0000-0000-0000-000000000004', 'Book, pen, chair thuoc chu de nao?', 'MotDapAn', 20, 'De', 'Day la do vat trong lop hoc.', NULL, NULL, 2),
  ('19000000-0000-0000-0000-000000000015', '18000000-0000-0000-0000-000000000004', 'I study English every day dung thi nao?', 'MotDapAn', 20, 'TrungBinh', 'Cau noi ve thoi quen nen dung hien tai don.', NULL, NULL, 3),
  ('19000000-0000-0000-0000-000000000016', '18000000-0000-0000-0000-000000000004', 'Dien tu: I like ____.', 'DienTu', 20, 'De', 'Milk la danh tu do uong phu hop sau like.', NULL, NULL, 4),
  ('19000000-0000-0000-0000-000000000017', '18000000-0000-0000-0000-000000000004', 'Nghe audio va chon chu de cua doan nghe.', 'Nghe', 20, 'TrungBinh', 'Audio noi ve daily routines.', '/media/audio/daily-routines.mp3', NULL, 5)
ON CONFLICT ("maCauHoi") DO UPDATE SET
  "noiDung" = EXCLUDED."noiDung",
  "loaiCauHoi" = EXCLUDED."loaiCauHoi",
  diem = EXCLUDED.diem,
  "doKho" = EXCLUDED."doKho",
  "giaiThichDapAn" = EXCLUDED."giaiThichDapAn",
  audio = EXCLUDED.audio,
  "hinhAnh" = EXCLUDED."hinhAnh",
  "thuTu" = EXCLUDED."thuTu";

INSERT INTO dapan (
  "maDapAn", "maCauHoi", "noiDung", "laDapAnDung", "thuTu"
)
VALUES
  ('1a000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000001', 'What is your name?', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000001', 'How old are you?', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000003', '19000000-0000-0000-0000-000000000001', 'Where are you?', FALSE, 3),
  ('1a000000-0000-0000-0000-000000000004', '19000000-0000-0000-0000-000000000002', 'name', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000005', '19000000-0000-0000-0000-000000000003', 'Rat vui duoc gap ban', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000006', '19000000-0000-0000-0000-000000000003', 'Tam biet ban', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000007', '19000000-0000-0000-0000-000000000004', 'Hello', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000008', '19000000-0000-0000-0000-000000000004', 'Goodbye', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000009', '19000000-0000-0000-0000-000000000005', 'book', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000010', '19000000-0000-0000-0000-000000000005', 'desk', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000011', '19000000-0000-0000-0000-000000000006', 'This is a pen.', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000012', '19000000-0000-0000-0000-000000000006', 'That is a pen.', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000013', '19000000-0000-0000-0000-000000000007', 'pen', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000014', '19000000-0000-0000-0000-000000000008', 'cai ghe', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000015', '19000000-0000-0000-0000-000000000008', 'cai ban', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000016', '19000000-0000-0000-0000-000000000009', 'bo/cha', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000017', '19000000-0000-0000-0000-000000000009', 'anh trai', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000018', '19000000-0000-0000-0000-000000000010', 'mother', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000019', '19000000-0000-0000-0000-000000000011', 'This is my mother.', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000020', '19000000-0000-0000-0000-000000000011', 'That is mother my.', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000021', '19000000-0000-0000-0000-000000000012', 'cua toi', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000022', '19000000-0000-0000-0000-000000000012', 'cua ban', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000023', '19000000-0000-0000-0000-000000000013', 'Hello', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000024', '19000000-0000-0000-0000-000000000013', 'Chair', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000025', '19000000-0000-0000-0000-000000000014', 'Do vat trong lop hoc', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000026', '19000000-0000-0000-0000-000000000014', 'Thanh vien gia dinh', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000027', '19000000-0000-0000-0000-000000000015', 'Hien tai don', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000028', '19000000-0000-0000-0000-000000000015', 'Qua khu don', FALSE, 2),
  ('1a000000-0000-0000-0000-000000000029', '19000000-0000-0000-0000-000000000016', 'milk', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000030', '19000000-0000-0000-0000-000000000017', 'Daily routines', TRUE, 1),
  ('1a000000-0000-0000-0000-000000000031', '19000000-0000-0000-0000-000000000017', 'Family members', FALSE, 2)
ON CONFLICT ("maDapAn") DO UPDATE SET
  "noiDung" = EXCLUDED."noiDung",
  "laDapAnDung" = EXCLUDED."laDapAnDung",
  "thuTu" = EXCLUDED."thuTu";

INSERT INTO lanlambai (
  "maLanLam", "maBaiKiemTra", "maHocVien", "thoiGianBatDau",
  "thoiGianNopBai", "diemSo", "soCauDung", "soCauSai", "phanTramDung", "trangThai", "lanThu"
)
VALUES
  ('1b000000-0000-0000-0000-000000000001', '18000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '8 minutes', 100, 4, 0, 100, 'Dat', 1),
  ('1b000000-0000-0000-0000-000000000002', '18000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '9 minutes', 75, 3, 1, 75, 'KhongDat', 1),
  ('1b000000-0000-0000-0000-000000000003', '18000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '1 hour 7 minutes', 100, 4, 0, 100, 'Dat', 2),
  ('1b000000-0000-0000-0000-000000000004', '18000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '10 minutes', 75, 3, 1, 75, 'KhongDat', 1)
ON CONFLICT ("maLanLam") DO UPDATE SET
  "diemSo" = EXCLUDED."diemSo",
  "soCauDung" = EXCLUDED."soCauDung",
  "soCauSai" = EXCLUDED."soCauSai",
  "phanTramDung" = EXCLUDED."phanTramDung",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO cautraloihocvien (
  "maCauTraLoi", "maLanLam", "maCauHoi", "maDapAn", "noiDungTraLoi", "dungSai", "diemDatDuoc"
)
VALUES
  ('1c000000-0000-0000-0000-000000000001', '1b000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', NULL, TRUE, 25),
  ('1c000000-0000-0000-0000-000000000002', '1b000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000002', '1a000000-0000-0000-0000-000000000004', 'name', TRUE, 25),
  ('1c000000-0000-0000-0000-000000000003', '1b000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000003', '1a000000-0000-0000-0000-000000000005', NULL, TRUE, 25),
  ('1c000000-0000-0000-0000-000000000004', '1b000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000004', '1a000000-0000-0000-0000-000000000007', NULL, TRUE, 25),
  ('1c000000-0000-0000-0000-000000000005', '1b000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000005', '1a000000-0000-0000-0000-000000000009', NULL, TRUE, 25),
  ('1c000000-0000-0000-0000-000000000006', '1b000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000006', '1a000000-0000-0000-0000-000000000012', NULL, FALSE, 0),
  ('1c000000-0000-0000-0000-000000000007', '1b000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000007', '1a000000-0000-0000-0000-000000000013', 'pen', TRUE, 25),
  ('1c000000-0000-0000-0000-000000000008', '1b000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000008', '1a000000-0000-0000-0000-000000000014', NULL, TRUE, 25)
ON CONFLICT ("maCauTraLoi") DO UPDATE SET
  "maDapAn" = EXCLUDED."maDapAn",
  "noiDungTraLoi" = EXCLUDED."noiDungTraLoi",
  "dungSai" = EXCLUDED."dungSai",
  "diemDatDuoc" = EXCLUDED."diemDatDuoc";

INSERT INTO tientrinhhoctap (
  "maTienTrinh", "maHocVien", "maBaiHoc", "trangThai",
  "phanTramHoanThanh", "diemCaoNhat", "ngayBatDau", "ngayHoanThanh"
)
VALUES
  ('1d000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000001', 'HoanThanh', 100, 100, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '10 minutes'),
  ('1d000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000002', 'HoanThanh', 100, 100, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '1 hour 10 minutes'),
  ('1d000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000003', 'DangHoc', 40, 0, CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),
  ('1d000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000004', 'BiKhoa', 0, 0, NULL, NULL),
  ('1d000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000001', 'DangHoc', 70, 75, CURRENT_TIMESTAMP - INTERVAL '2 days', NULL),
  ('1d000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000002', 'BiKhoa', 0, 0, NULL, NULL)
ON CONFLICT ("maTienTrinh") DO UPDATE SET
  "trangThai" = EXCLUDED."trangThai",
  "phanTramHoanThanh" = EXCLUDED."phanTramHoanThanh",
  "diemCaoNhat" = EXCLUDED."diemCaoNhat",
  "ngayBatDau" = EXCLUDED."ngayBatDau",
  "ngayHoanThanh" = EXCLUDED."ngayHoanThanh",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO hoanthanh_nhiemvu (
  "maHoanThanh", "maHocVien", "maNhiemVu", "trangThai", "thoiGianHoanThanh"
)
VALUES
  ('1e000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000001', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  ('1e000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000002', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  ('1e000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000003', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  ('1e000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000004', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('1e000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000005', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('1e000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', '14000000-0000-0000-0000-000000000001', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('1e000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', '14000000-0000-0000-0000-000000000002', 'HoanThanh', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT ("maHoanThanh") DO UPDATE SET
  "trangThai" = EXCLUDED."trangThai",
  "thoiGianHoanThanh" = EXCLUDED."thoiGianHoanThanh";

INSERT INTO noidungyeuthich (
  "maYeuThich", "maNguoiDung", "loaiNoiDung", "maNoiDung"
)
VALUES
  ('1f000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'TuVung', '15000000-0000-0000-0000-000000000002'),
  ('1f000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'BaiHoc', '13000000-0000-0000-0000-000000000003'),
  ('1f000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'NguPhap', '16000000-0000-0000-0000-000000000001')
ON CONFLICT ("maNguoiDung", "loaiNoiDung", "maNoiDung") DO NOTHING;

INSERT INTO goiyontap (
  "maGoiY", "maHocVien", "maBaiHoc", "maChuDe", "lyDo", "mucDoUuTien", "trangThai"
)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'Hoc vien chua dat bai kiem tra Bai 1, can on lai mau cau hoi ten va loi chao.', 1, 'ChuaXem'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000003', '12000000-0000-0000-0000-000000000003', 'Hoc vien dang hoc Bai 3, nen on tu vung father, mother va mau cau This is my...', 2, 'DaXem')
ON CONFLICT ("maGoiY") DO UPDATE SET
  "lyDo" = EXCLUDED."lyDo",
  "mucDoUuTien" = EXCLUDED."mucDoUuTien",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO thongbao (
  "maThongBao", "maNguoiDung", "tieuDe", "noiDung", "loaiThongBao", "daDoc"
)
VALUES
  ('21000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Chuc mung ban da hoan thanh Bai 1', 'Ban dat 100% trong bai kiem tra Greetings va da mo khoa Bai 2.', 'TienTrinh', TRUE),
  ('21000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Bai 3 dang cho ban tiep tuc', 'Hay hoan thanh nhiem vu gioi thieu gia dinh de lam bai kiem tra.', 'TienTrinh', FALSE),
  ('21000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Hoc vien can on tap', 'Tran Minh Khang da tung chua dat Bai 2 lan dau nhung da dat o lan thu hai.', 'BaiKiemTra', FALSE),
  ('21000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Ban can on lai Bai 1', 'Diem hien tai la 75%, can dat toi thieu 80% de mo khoa bai tiep theo.', 'CanhBao', FALSE)
ON CONFLICT ("maThongBao") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "noiDung" = EXCLUDED."noiDung",
  "loaiThongBao" = EXCLUDED."loaiThongBao",
  "daDoc" = EXCLUDED."daDoc";

INSERT INTO nhatkyhoatdong (
  "maNhatKy", "maNguoiDung", "hanhDong", "loaiDoiTuong", "maDoiTuong", "moTa"
)
VALUES
  ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'TAO_LO_TRINH', 'LoTrinhHoc', '10000000-0000-0000-0000-000000000001', 'Giao vien tao lo trinh A1 nen tang 4 tuan.'),
  ('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'LAM_BAI_KIEM_TRA', 'BaiKiemTra', '18000000-0000-0000-0000-000000000001', 'Hoc vien hoan thanh Bai 1 voi diem 100%.'),
  ('22000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'THEO_DOI_HOC_VIEN', 'NguoiDung', '00000000-0000-0000-0000-000000000004', 'Phu huynh xem tien trinh hoc tap cua hoc vien.')
ON CONFLICT ("maNhatKy") DO UPDATE SET
  "hanhDong" = EXCLUDED."hanhDong",
  "loaiDoiTuong" = EXCLUDED."loaiDoiTuong",
  "maDoiTuong" = EXCLUDED."maDoiTuong",
  "moTa" = EXCLUDED."moTa";

INSERT INTO baocaothongke (
  "maBaoCao", "loaiBaoCao", "noiDungBaoCao", "maNguoiTao"
)
VALUES
  (
    '23000000-0000-0000-0000-000000000001',
    'HocTap',
    '{
      "tongHocVien": 2,
      "tongLoTrinhCongBo": 1,
      "tongBaiHocCongBo": 6,
      "tongBaiKiemTraCongBo": 4,
      "tiLeDatBaiKiemTraMau": 75,
      "ghiChu": "Du lieu mau phuc vu demo dashboard hoc tap"
    }'::JSONB,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '23000000-0000-0000-0000-000000000002',
    'HeThong',
    '{
      "stack": ["Next.js", "NestJS", "PostgreSQL", "Prisma", "Redis", "Docker"],
      "mucTieu": "He thong hoc tieng Anh truc tuyen co lo trinh, quiz, tien trinh va quan tri noi dung",
      "sanSangMoRong": ["AI chatbot", "Speech to text", "Gamification", "Thong bao email"]
    }'::JSONB,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT ("maBaoCao") DO UPDATE SET
  "noiDungBaoCao" = EXCLUDED."noiDungBaoCao",
  "maNguoiTao" = EXCLUDED."maNguoiTao";

INSERT INTO thucunghoctap (
  "maThuCung", "maNguoiDung", "tenThuCung", "loaiThuCung", "capDo",
  "diemKinhNghiem", "vang", "mucDoVui", "mucDoGanBo", "tamTrang", "phuKien"
)
VALUES
  (
    '24000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Pingu',
    'ChimCanhCut',
    4,
    860,
    210,
    94,
    88,
    'VuiVe',
    'Kinh mat tim'
  ),
  (
    '24000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    'Pip',
    'ChimCanhCut',
    2,
    320,
    80,
    78,
    60,
    'HocChung',
    'Mui len trang'
  )
ON CONFLICT ("maNguoiDung") DO UPDATE SET
  "tenThuCung" = EXCLUDED."tenThuCung",
  "loaiThuCung" = EXCLUDED."loaiThuCung",
  "capDo" = EXCLUDED."capDo",
  "diemKinhNghiem" = EXCLUDED."diemKinhNghiem",
  "vang" = EXCLUDED."vang",
  "mucDoVui" = EXCLUDED."mucDoVui",
  "mucDoGanBo" = EXCLUDED."mucDoGanBo",
  "tamTrang" = EXCLUDED."tamTrang",
  "phuKien" = EXCLUDED."phuKien",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO huyhieuhoctap (
  "maHuyHieu", "maCode", "tenHuyHieu", "moTa", "loaiHuyHieu",
  "icon", "mauSac", "diemThuong", "dieuKien", "trangThai"
)
VALUES
  ('25000000-0000-0000-0000-000000000001', 'first-step', 'Buoc Dau Vui Ve', 'Hoan thanh bai hoc dau tien.', 'HocTap', 'sparkles', '#0f766e', 30, 'Hoan thanh bai hoc dau tien', 'HoatDong'),
  ('25000000-0000-0000-0000-000000000002', 'quiz-master', 'Quiz Master', 'Dat diem toi thieu 80% o 3 bai kiem tra.', 'HocTap', 'trophy', '#2563eb', 60, 'Dat 80% o 3 quiz', 'HoatDong'),
  ('25000000-0000-0000-0000-000000000003', 'pet-friend', 'Ban Than Cua Pingu', 'Cho pet an, choi va hoc cung pet trong 5 lan.', 'Game', 'heart', '#db2777', 40, 'Interact voi pet 5 lan', 'HoatDong'),
  ('25000000-0000-0000-0000-000000000004', 'ai-explorer', 'AI Explorer', 'Su dung AI nhan dien hinh anh de mo rong tu vung.', 'AI', 'scan-search', '#7c3aed', 50, 'Phan tich 3 hinh anh', 'HoatDong'),
  ('25000000-0000-0000-0000-000000000005', 'streak-5', '5 Ngay Lien Tiep', 'Duy tri chuoi hoc trong 5 ngay lien tuc.', 'Streak', 'flame', '#ea580c', 45, 'Dat chuoi hoc 5 ngay', 'HoatDong')
ON CONFLICT ("maCode") DO UPDATE SET
  "tenHuyHieu" = EXCLUDED."tenHuyHieu",
  "moTa" = EXCLUDED."moTa",
  "loaiHuyHieu" = EXCLUDED."loaiHuyHieu",
  "icon" = EXCLUDED."icon",
  "mauSac" = EXCLUDED."mauSac",
  "diemThuong" = EXCLUDED."diemThuong",
  "dieuKien" = EXCLUDED."dieuKien",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO nguoidung_huyhieu (
  "maNguoiDung", "maHuyHieu", "ngayNhan", "trangThai"
)
VALUES
  ('00000000-0000-0000-0000-000000000004', '25000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '6 days', 'DaNhan'),
  ('00000000-0000-0000-0000-000000000004', '25000000-0000-0000-0000-000000000002', CURRENT_TIMESTAMP - INTERVAL '1 day', 'DaNhan'),
  ('00000000-0000-0000-0000-000000000004', '25000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '1 day', 'DaNhan'),
  ('00000000-0000-0000-0000-000000000005', '25000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '2 days', 'DaNhan'),
  ('00000000-0000-0000-0000-000000000005', '25000000-0000-0000-0000-000000000004', CURRENT_TIMESTAMP - INTERVAL '2 days', 'DaNhan')
ON CONFLICT ("maNguoiDung", "maHuyHieu") DO UPDATE SET
  "ngayNhan" = EXCLUDED."ngayNhan",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO nhiemvungay (
  "maNhiemVuNgay", "maCode", "tieuDe", "moTa", "loaiNhiemVu",
  "mucTieu", "xpThuong", "vangThuong", "icon", "trangThai"
)
VALUES
  ('26000000-0000-0000-0000-000000000001', 'daily-words-5', 'Hoc 5 tu vung moi', 'Chon 5 tu vung va doc to de nhan diem XP.', 'TuVung', 5, 60, 8, 'book-open', 'HoatDong'),
  ('26000000-0000-0000-0000-000000000002', 'daily-quiz-1', 'Lam 1 quiz ngau nhien', 'Lam mot bai kiem tra ngan de giu nhiet hoc tap.', 'Quiz', 1, 80, 12, 'badge-check', 'HoatDong'),
  ('26000000-0000-0000-0000-000000000003', 'daily-vision-1', 'Gui 1 anh cho AI', 'Tai len 1 hinh anh va xem AI goi y tu vung.', 'AI', 1, 90, 15, 'scan-search', 'HoatDong'),
  ('26000000-0000-0000-0000-000000000004', 'daily-pet-1', 'Cham soc Pingu', 'Cho pet an hoac choi cung pet de tang gan bo.', 'Pet', 1, 40, 6, 'heart-handshake', 'HoatDong')
ON CONFLICT ("maCode") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "moTa" = EXCLUDED."moTa",
  "loaiNhiemVu" = EXCLUDED."loaiNhiemVu",
  "mucTieu" = EXCLUDED."mucTieu",
  "xpThuong" = EXCLUDED."xpThuong",
  "vangThuong" = EXCLUDED."vangThuong",
  "icon" = EXCLUDED."icon",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO nguoidung_nhiemvungay (
  "maNguoiDung", "maNhiemVuNgay", "soTienDo", "trangThai", "daNhanThuong", "ngayHoanThanh"
)
VALUES
  ('00000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000000001', 5, 'HoanThanh', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000000002', 1, 'HoanThanh', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000000003', 1, 'DangLam', FALSE, NULL),
  ('00000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000000001', 3, 'DangLam', FALSE, NULL),
  ('00000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000000004', 1, 'HoanThanh', TRUE, CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT ("maNguoiDung", "maNhiemVuNgay") DO UPDATE SET
  "soTienDo" = EXCLUDED."soTienDo",
  "trangThai" = EXCLUDED."trangThai",
  "daNhanThuong" = EXCLUDED."daNhanThuong",
  "ngayHoanThanh" = EXCLUDED."ngayHoanThanh";

INSERT INTO minigame (
  "maMiniGame", "maCode", "tenMiniGame", "moTa", "loaiMiniGame",
  "capDo", "diemThuong", "trangThai", "hinhAnh"
)
VALUES
  ('27000000-0000-0000-0000-000000000001', 'flash-match', 'Flash Match', 'Noi cua nhanh tu vung va hinh anh.', 'GhepCap', 'A1', 70, 'HoatDong', '/media/game/flash-match.png'),
  ('27000000-0000-0000-0000-000000000002', 'listen-bingo', 'Listen Bingo', 'Nghe va chon hinh dung trong thoi gian gioi han.', 'NgheNhanh', 'A1', 80, 'HoatDong', '/media/game/listen-bingo.png'),
  ('27000000-0000-0000-0000-000000000003', 'photo-lab', 'Photo Lab', 'Tai anh len va nhan dien tu vung bang AI.', 'AI', 'A1', 90, 'HoatDong', '/media/game/photo-lab.png'),
  ('27000000-0000-0000-0000-000000000004', 'word-race', 'Word Race', 'Chay dua voi tu vung va nhan diem combo.', 'ChayDua', 'A1', 100, 'HoatDong', '/media/game/word-race.png')
ON CONFLICT ("maCode") DO UPDATE SET
  "tenMiniGame" = EXCLUDED."tenMiniGame",
  "moTa" = EXCLUDED."moTa",
  "loaiMiniGame" = EXCLUDED."loaiMiniGame",
  "capDo" = EXCLUDED."capDo",
  "diemThuong" = EXCLUDED."diemThuong",
  "trangThai" = EXCLUDED."trangThai",
  "hinhAnh" = EXCLUDED."hinhAnh";

INSERT INTO lanchoigame (
  "maLanChoi", "maNguoiDung", "maMiniGame", "diemSo", "soSao", "ketQua", "thoiGianChoi"
)
VALUES
  ('28000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '27000000-0000-0000-0000-000000000001', 92, 3, 'DatKyLuc', 180),
  ('28000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '27000000-0000-0000-0000-000000000002', 76, 2, 'HoanThanh', 240),
  ('28000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '27000000-0000-0000-0000-000000000003', 88, 3, 'HoanThanh', 210)
ON CONFLICT ("maLanChoi") DO UPDATE SET
  "diemSo" = EXCLUDED."diemSo",
  "soSao" = EXCLUDED."soSao",
  "ketQua" = EXCLUDED."ketQua",
  "thoiGianChoi" = EXCLUDED."thoiGianChoi";

INSERT INTO phantichhinhanh (
  "maPhanTich", "maNguoiDung", "tenTapTin", "duongDanAnh", "tuKhoaNhap",
  "tuKhoaNhanRa", "nghiaTiengViet", "phienAm", "cauViDu", "yTuongTuVung",
  "doTinCay", "loaiNoiDung", "nguonNhanDang"
)
VALUES
  (
    '29000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'book.png',
    '/uploads/vision/book.png',
    'book',
    'book',
    'quyen sach',
    '/bʊk/',
    'This is a book.',
    'Tu vung do vat lop hoc',
    96.50,
    'DoVat',
    'DemoVision'
  ),
  (
    '29000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'milk.jpg',
    '/uploads/vision/milk.jpg',
    'milk',
    'milk',
    'sua',
    '/mɪlk/',
    'I like milk.',
    'Do an va do uong',
    95.20,
    'DoAn',
    'DemoVision'
  ),
  (
    '29000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'chair.png',
    '/uploads/vision/chair.png',
    'chair',
    'chair',
    'cai ghe',
    '/tʃer/',
    'This is a chair.',
    'Do vat trong lop hoc',
    93.10,
    'NoiThat',
    'DemoVision'
  )
ON CONFLICT ("maPhanTich") DO UPDATE SET
  "tenTapTin" = EXCLUDED."tenTapTin",
  "duongDanAnh" = EXCLUDED."duongDanAnh",
  "tuKhoaNhap" = EXCLUDED."tuKhoaNhap",
  "tuKhoaNhanRa" = EXCLUDED."tuKhoaNhanRa",
  "nghiaTiengViet" = EXCLUDED."nghiaTiengViet",
  "phienAm" = EXCLUDED."phienAm",
  "cauViDu" = EXCLUDED."cauViDu",
  "yTuongTuVung" = EXCLUDED."yTuongTuVung",
  "doTinCay" = EXCLUDED."doTinCay",
  "loaiNoiDung" = EXCLUDED."loaiNoiDung",
  "nguonNhanDang" = EXCLUDED."nguonNhanDang";

-- -------------------------------------------------------------------
-- Chuan hoa du lieu mau sang tieng Viet co dau de hien thi tren UI.
-- Cac gia tri ma he thong/enums nhu HocVien, CongBo, HoatDong... duoc giu nguyen
-- de khong pha rang buoc CHECK va logic backend.
-- -------------------------------------------------------------------

UPDATE vaitro
SET "moTa" = CASE "tenVaiTro"
  WHEN 'HocVien' THEN 'Người học sử dụng hệ thống để học bài, làm bài kiểm tra và theo dõi tiến trình.'
  WHEN 'PhuHuynh' THEN 'Người theo dõi tiến trình và kết quả học tập của học viên.'
  WHEN 'GiaoVien' THEN 'Người quản lý nội dung học tập, câu hỏi và bài kiểm tra.'
  WHEN 'QuanTriVien' THEN 'Người quản trị toàn bộ hệ thống, phân quyền và giám sát vận hành.'
  ELSE "moTa"
END;

UPDATE hosohocvien
SET "mucTieuHocTap" = CASE "maHoSoHocVien"
  WHEN '00000000-0000-0000-0000-000000000101' THEN 'Nắm vững từ vựng và mẫu câu giao tiếp cơ bản trong 4 tuần.'
  WHEN '00000000-0000-0000-0000-000000000102' THEN 'Cải thiện nghe hiểu và ngữ pháp nền tảng.'
  ELSE "mucTieuHocTap"
END;

UPDATE lotrinhhoc
SET
  "tenLoTrinh" = CASE "maLoTrinh"
    WHEN '10000000-0000-0000-0000-000000000001' THEN 'Lộ trình A1 - Tiếng Anh nền tảng 4 tuần'
    WHEN '10000000-0000-0000-0000-000000000002' THEN 'Lộ trình A2 - Giao tiếp hằng ngày'
    ELSE "tenLoTrinh"
  END,
  "moTa" = CASE "maLoTrinh"
    WHEN '10000000-0000-0000-0000-000000000001' THEN 'Lộ trình dành cho người mới bắt đầu, tập trung từ vựng, ngữ pháp, nghe hiểu và giao tiếp đơn giản. Mỗi ngày học gồm nhiệm vụ và bài kiểm tra ngắn, yêu cầu đạt từ 80% để mở khóa bài tiếp theo.'
    WHEN '10000000-0000-0000-0000-000000000002' THEN 'Lộ trình mở rộng sau A1, tập trung hội thoại, thói quen hằng ngày, nghe tình huống và cấu trúc câu thông dụng.'
    ELSE "moTa"
  END,
  "doiTuong" = CASE "maLoTrinh"
    WHEN '10000000-0000-0000-0000-000000000001' THEN 'Học sinh, sinh viên, người mới bắt đầu'
    WHEN '10000000-0000-0000-0000-000000000002' THEN 'Người học đã có nền tảng A1'
    ELSE "doiTuong"
  END;

UPDATE giaidoanhoc
SET
  "tenGiaiDoan" = CASE "maGiaiDoan"
    WHEN '11000000-0000-0000-0000-000000000001' THEN 'Ngày 1 - Greetings and introductions'
    WHEN '11000000-0000-0000-0000-000000000002' THEN 'Ngày 2 - Classroom objects'
    WHEN '11000000-0000-0000-0000-000000000003' THEN 'Ngày 3 - Family members'
    WHEN '11000000-0000-0000-0000-000000000004' THEN 'Ngày 4 - Daily routines'
    WHEN '11000000-0000-0000-0000-000000000005' THEN 'Ngày 5 - Food and drinks'
    WHEN '11000000-0000-0000-0000-000000000006' THEN 'Ngày 6 - Review test'
    ELSE "tenGiaiDoan"
  END,
  "moTa" = CASE "maGiaiDoan"
    WHEN '11000000-0000-0000-0000-000000000001' THEN 'Làm quen với lời chào, giới thiệu tên và hỏi thăm cơ bản.'
    WHEN '11000000-0000-0000-0000-000000000002' THEN 'Học từ vựng đồ vật trong lớp và cấu trúc This is/That is.'
    WHEN '11000000-0000-0000-0000-000000000003' THEN 'Giới thiệu thành viên gia đình và sở hữu cách.'
    WHEN '11000000-0000-0000-0000-000000000004' THEN 'Nói về thói quen hằng ngày với thì hiện tại đơn.'
    WHEN '11000000-0000-0000-0000-000000000005' THEN 'Học từ vựng đồ ăn, đồ uống và cách gọi món đơn giản.'
    WHEN '11000000-0000-0000-0000-000000000006' THEN 'Ôn tập tổng hợp và làm bài kiểm tra cuối tuần.'
    ELSE "moTa"
  END;

UPDATE chudehoc
SET
  "tenChuDe" = CASE "maChuDe"
    WHEN '12000000-0000-0000-0000-000000000001' THEN 'Chào hỏi và giới thiệu'
    WHEN '12000000-0000-0000-0000-000000000002' THEN 'Đồ vật trong lớp học'
    WHEN '12000000-0000-0000-0000-000000000003' THEN 'Gia đình'
    WHEN '12000000-0000-0000-0000-000000000004' THEN 'Ngữ pháp cơ bản A1'
    WHEN '12000000-0000-0000-0000-000000000005' THEN 'Luyện nghe A1'
    WHEN '12000000-0000-0000-0000-000000000006' THEN 'Ăn uống hằng ngày'
    ELSE "tenChuDe"
  END,
  "moTa" = CASE "maChuDe"
    WHEN '12000000-0000-0000-0000-000000000001' THEN 'Từ vựng và mẫu câu dùng khi gặp gỡ lần đầu.'
    WHEN '12000000-0000-0000-0000-000000000002' THEN 'Tên gọi đồ vật quen thuộc trong lớp và câu giới thiệu đồ vật.'
    WHEN '12000000-0000-0000-0000-000000000003' THEN 'Từ vựng thành viên gia đình và cách nói về mối quan hệ.'
    WHEN '12000000-0000-0000-0000-000000000004' THEN 'Động từ to be, this/that, hiện tại đơn và sở hữu cách.'
    WHEN '12000000-0000-0000-0000-000000000005' THEN 'Bài nghe ngắn với tình huống lớp học, gia đình và thói quen.'
    WHEN '12000000-0000-0000-0000-000000000006' THEN 'Từ vựng và mẫu câu về đồ ăn, đồ uống, sở thích.'
    ELSE "moTa"
  END;

UPDATE baihoc
SET
  "tieuDe" = CASE "maBaiHoc"
    WHEN '13000000-0000-0000-0000-000000000001' THEN 'Bài 1: Hello! What is your name?'
    WHEN '13000000-0000-0000-0000-000000000002' THEN 'Bài 2: This is my book'
    WHEN '13000000-0000-0000-0000-000000000003' THEN 'Bài 3: My family'
    WHEN '13000000-0000-0000-0000-000000000004' THEN 'Bài 4: I get up at six'
    WHEN '13000000-0000-0000-0000-000000000005' THEN 'Bài 5: I like milk'
    WHEN '13000000-0000-0000-0000-000000000006' THEN 'Bài 6: Review week 1'
    ELSE "tieuDe"
  END,
  "moTa" = CASE "maBaiHoc"
    WHEN '13000000-0000-0000-0000-000000000001' THEN 'Học lời chào, cách hỏi tên và giới thiệu bản thân.'
    WHEN '13000000-0000-0000-0000-000000000002' THEN 'Học từ vựng đồ vật trong lớp và mẫu câu This is/That is.'
    WHEN '13000000-0000-0000-0000-000000000003' THEN 'Giới thiệu thành viên gia đình và cấu trúc sở hữu đơn giản.'
    WHEN '13000000-0000-0000-0000-000000000004' THEN 'Nói về thói quen hằng ngày bằng hiện tại đơn.'
    WHEN '13000000-0000-0000-0000-000000000005' THEN 'Từ vựng đồ ăn, đồ uống và cách nói về sở thích.'
    WHEN '13000000-0000-0000-0000-000000000006' THEN 'Ôn tập từ vựng, ngữ pháp và nghe hiểu trong tuần đầu.'
    ELSE "moTa"
  END,
  "noiDung" = CASE "maBaiHoc"
    WHEN '13000000-0000-0000-0000-000000000001' THEN 'Trong bài học này, người học làm quen với các mẫu câu: Hello, Hi, Good morning, What is your name?, My name is..., Nice to meet you. Mục tiêu là có thể chào hỏi và giới thiệu tên trong tình huống cơ bản.'
    WHEN '13000000-0000-0000-0000-000000000002' THEN 'Bài học cung cấp từ vựng book, pen, pencil, desk, chair, board và cách dùng This is, That is để giới thiệu đồ vật ở gần hoặc xa người nói.'
    WHEN '13000000-0000-0000-0000-000000000003' THEN 'Người học nắm các từ father, mother, brother, sister, grandmother, grandfather và mẫu câu This is my..., He is my..., She is my....'
    WHEN '13000000-0000-0000-0000-000000000004' THEN 'Bài học tập trung vào các động từ get up, brush, go, study, play, sleep và mẫu câu I + verb + time. Người học thực hành nói lịch trình cơ bản.'
    WHEN '13000000-0000-0000-0000-000000000005' THEN 'Người học nắm từ vựng rice, bread, milk, water, juice, apple và mẫu câu I like..., I do not like..., Do you like...?'
    WHEN '13000000-0000-0000-0000-000000000006' THEN 'Bài ôn tập gồm các nội dung chào hỏi, lớp học, gia đình, thói quen và đồ ăn. Người học cần đạt bài kiểm tra tổng hợp để hoàn thành tuần 1.'
    ELSE "noiDung"
  END;

UPDATE nhiemvuhoctap
SET
  "tieuDe" = CASE "maNhiemVu"
    WHEN '14000000-0000-0000-0000-000000000001' THEN 'Học 6 mẫu câu chào hỏi'
    WHEN '14000000-0000-0000-0000-000000000002' THEN 'Nghe đoạn hội thoại ngắn'
    WHEN '14000000-0000-0000-0000-000000000003' THEN 'Làm bài luyện tập chào hỏi'
    WHEN '14000000-0000-0000-0000-000000000004' THEN 'Học từ vựng đồ vật lớp học'
    WHEN '14000000-0000-0000-0000-000000000005' THEN 'Học cấu trúc This is/That is'
    WHEN '14000000-0000-0000-0000-000000000006' THEN 'Học từ vựng gia đình'
    WHEN '14000000-0000-0000-0000-000000000007' THEN 'Luyện nói giới thiệu gia đình'
    WHEN '14000000-0000-0000-0000-000000000008' THEN 'Học động từ thói quen hằng ngày'
    WHEN '14000000-0000-0000-0000-000000000009' THEN 'Học hiện tại đơn với I'
    WHEN '14000000-0000-0000-0000-000000000010' THEN 'Học từ vựng đồ ăn và đồ uống'
    WHEN '14000000-0000-0000-0000-000000000011' THEN 'Luyện mẫu câu I like...'
    WHEN '14000000-0000-0000-0000-000000000012' THEN 'Ôn tập tổng hợp tuần 1'
    ELSE "tieuDe"
  END,
  "huongDan" = CASE "maNhiemVu"
    WHEN '14000000-0000-0000-0000-000000000001' THEN 'Đọc to các mẫu câu và ghi nhớ nghĩa tiếng Việt.'
    WHEN '14000000-0000-0000-0000-000000000002' THEN 'Nghe audio 2 lần, sau đó lặp lại từng câu.'
    WHEN '14000000-0000-0000-0000-000000000003' THEN 'Chọn đáp án đúng cho các tình huống chào hỏi.'
    WHEN '14000000-0000-0000-0000-000000000004' THEN 'Quan sát hình ảnh và đọc to các từ mới.'
    WHEN '14000000-0000-0000-0000-000000000005' THEN 'Đọc lý thuyết và đặt 3 câu ví dụ với đồ vật gần bạn.'
    WHEN '14000000-0000-0000-0000-000000000006' THEN 'Ghi nhớ từ vựng và nói về 3 thành viên trong gia đình.'
    WHEN '14000000-0000-0000-0000-000000000007' THEN 'Dùng mẫu câu This is my... để giới thiệu thành viên gia đình.'
    WHEN '14000000-0000-0000-0000-000000000008' THEN 'Đọc và đặt câu với get up, study, play, sleep.'
    WHEN '14000000-0000-0000-0000-000000000009' THEN 'Hoàn thành 5 câu về lịch trình cá nhân.'
    WHEN '14000000-0000-0000-0000-000000000010' THEN 'Nghe phát âm và chọn hình ảnh phù hợp.'
    WHEN '14000000-0000-0000-0000-000000000011' THEN 'Viết 5 câu về món ăn/đồ uống yêu thích.'
    WHEN '14000000-0000-0000-0000-000000000012' THEN 'Xem lại các bài đã học và làm bài kiểm tra tổng hợp.'
    ELSE "huongDan"
  END;

UPDATE tuvung
SET
  nghia = CASE tu
    WHEN 'hello' THEN 'xin chào'
    WHEN 'name' THEN 'tên'
    WHEN 'meet' THEN 'gặp'
    WHEN 'book' THEN 'quyển sách'
    WHEN 'pen' THEN 'cây bút'
    WHEN 'chair' THEN 'cái ghế'
    WHEN 'father' THEN 'bố/cha'
    WHEN 'mother' THEN 'mẹ'
    WHEN 'study' THEN 'học'
    WHEN 'sleep' THEN 'ngủ'
    WHEN 'milk' THEN 'sữa'
    WHEN 'water' THEN 'nước'
    ELSE nghia
  END,
  "nghiaViDu" = CASE tu
    WHEN 'hello' THEN 'Xin chào, tên tôi là Khang.'
    WHEN 'name' THEN 'Tên bạn là gì?'
    WHEN 'meet' THEN 'Rất vui được gặp bạn.'
    WHEN 'book' THEN 'Đây là quyển sách của tôi.'
    WHEN 'pen' THEN 'Đó là một cây bút màu xanh.'
    WHEN 'chair' THEN 'Đây là một cái ghế.'
    WHEN 'father' THEN 'Ông ấy là bố của tôi.'
    WHEN 'mother' THEN 'Bà ấy là mẹ của tôi.'
    WHEN 'study' THEN 'Tôi học tiếng Anh mỗi ngày.'
    WHEN 'sleep' THEN 'Tôi ngủ lúc 10 giờ.'
    WHEN 'milk' THEN 'Tôi thích sữa.'
    WHEN 'water' THEN 'Tôi uống nước.'
    ELSE "nghiaViDu"
  END;

UPDATE nguphap
SET
  "tieuDe" = CASE "maNguPhap"
    WHEN '16000000-0000-0000-0000-000000000001' THEN 'Hỏi và trả lời tên'
    WHEN '16000000-0000-0000-0000-000000000002' THEN 'This is và That is'
    WHEN '16000000-0000-0000-0000-000000000003' THEN 'Sở hữu với my'
    WHEN '16000000-0000-0000-0000-000000000004' THEN 'Hiện tại đơn với I'
    WHEN '16000000-0000-0000-0000-000000000005' THEN 'Nói về sở thích với like'
    ELSE "tieuDe"
  END,
  "cauTruc" = CASE "maNguPhap"
    WHEN '16000000-0000-0000-0000-000000000001' THEN 'What is your name? - My name is + tên.'
    WHEN '16000000-0000-0000-0000-000000000002' THEN 'This is + danh từ. / That is + danh từ.'
    WHEN '16000000-0000-0000-0000-000000000003' THEN 'This is my + danh từ.'
    WHEN '16000000-0000-0000-0000-000000000004' THEN 'I + động từ nguyên mẫu + thời gian.'
    WHEN '16000000-0000-0000-0000-000000000005' THEN 'I like + danh từ. / I do not like + danh từ.'
    ELSE "cauTruc"
  END,
  "giaiThich" = CASE "maNguPhap"
    WHEN '16000000-0000-0000-0000-000000000001' THEN 'Dùng để hỏi tên và giới thiệu tên của bản thân.'
    WHEN '16000000-0000-0000-0000-000000000002' THEN 'This is dùng cho vật ở gần, That is dùng cho vật ở xa.'
    WHEN '16000000-0000-0000-0000-000000000003' THEN 'My nghĩa là của tôi, dùng để nói về sự sở hữu hoặc mối quan hệ.'
    WHEN '16000000-0000-0000-0000-000000000004' THEN 'Dùng để nói về thói quen lặp lại hằng ngày.'
    WHEN '16000000-0000-0000-0000-000000000005' THEN 'Dùng like để nói về món ăn, đồ uống hoặc hoạt động yêu thích.'
    ELSE "giaiThich"
  END,
  "ghiChu" = CASE "maNguPhap"
    WHEN '16000000-0000-0000-0000-000000000001' THEN 'Có thể viết tắt What is thành What''s trong hội thoại.'
    WHEN '16000000-0000-0000-0000-000000000002' THEN 'Dùng a/an trước danh từ số ít đếm được.'
    WHEN '16000000-0000-0000-0000-000000000003' THEN 'My không thay đổi theo danh từ sau nó.'
    WHEN '16000000-0000-0000-0000-000000000004' THEN 'Với chủ ngữ I, động từ không thêm s/es.'
    WHEN '16000000-0000-0000-0000-000000000005' THEN 'Do not có thể viết tắt thành don''t.'
    ELSE "ghiChu"
  END;

UPDATE tainguyenhoctap
SET
  "tenTaiNguyen" = CASE "maTaiNguyen"
    WHEN '17000000-0000-0000-0000-000000000001' THEN 'Audio hội thoại chào hỏi'
    WHEN '17000000-0000-0000-0000-000000000002' THEN 'Tranh tình huống chào hỏi'
    WHEN '17000000-0000-0000-0000-000000000003' THEN 'Flashcard đồ vật trong lớp học'
    WHEN '17000000-0000-0000-0000-000000000004' THEN 'Sơ đồ cây gia đình'
    WHEN '17000000-0000-0000-0000-000000000005' THEN 'Audio daily routines'
    WHEN '17000000-0000-0000-0000-000000000006' THEN 'Đề ôn tập tuần 1'
    WHEN '17000000-0000-0000-0000-000000000007' THEN 'Video chào hỏi'
    WHEN '17000000-0000-0000-0000-000000000008' THEN 'Video daily routine'
    ELSE "tenTaiNguyen"
  END,
  "moTa" = CASE "maTaiNguyen"
    WHEN '17000000-0000-0000-0000-000000000001' THEN 'Đoạn hội thoại ngắn giữa hai học sinh lần đầu gặp nhau.'
    WHEN '17000000-0000-0000-0000-000000000002' THEN 'Ảnh minh họa tình huống chào hỏi trong lớp học.'
    WHEN '17000000-0000-0000-0000-000000000003' THEN 'Bộ flashcard đồ vật trong lớp học.'
    WHEN '17000000-0000-0000-0000-000000000004' THEN 'Hình cây gia đình dùng để luyện nói.'
    WHEN '17000000-0000-0000-0000-000000000005' THEN 'Bài nghe ngắn về thói quen của một học sinh.'
    WHEN '17000000-0000-0000-0000-000000000006' THEN 'Tài liệu ôn tập tổng hợp các bài trong tuần 1.'
    WHEN '17000000-0000-0000-0000-000000000007' THEN 'Video minh họa cách chào hỏi và giới thiệu bản thân.'
    WHEN '17000000-0000-0000-0000-000000000008' THEN 'Video minh họa lịch trình hằng ngày bằng ảnh động.'
    ELSE "moTa"
  END;

UPDATE baikiemtra
SET
  "tieuDe" = CASE "maBaiKiemTra"
    WHEN '18000000-0000-0000-0000-000000000001' THEN 'Kiểm tra Bài 1 - Greetings'
    WHEN '18000000-0000-0000-0000-000000000002' THEN 'Kiểm tra Bài 2 - Classroom objects'
    WHEN '18000000-0000-0000-0000-000000000003' THEN 'Kiểm tra Bài 3 - My family'
    WHEN '18000000-0000-0000-0000-000000000004' THEN 'Kiểm tra tổng hợp tuần 1'
    ELSE "tieuDe"
  END,
  "moTa" = CASE "maBaiKiemTra"
    WHEN '18000000-0000-0000-0000-000000000001' THEN 'Đánh giá khả năng nhận biết lời chào và mẫu câu hỏi tên.'
    WHEN '18000000-0000-0000-0000-000000000002' THEN 'Đánh giá từ vựng đồ vật lớp học và cấu trúc This/That.'
    WHEN '18000000-0000-0000-0000-000000000003' THEN 'Đánh giá từ vựng gia đình và mẫu câu sở hữu đơn giản.'
    WHEN '18000000-0000-0000-0000-000000000004' THEN 'Bài kiểm tra tổng hợp sau 6 ngày học đầu tiên.'
    ELSE "moTa"
  END;

UPDATE cauhoi
SET
  "noiDung" = CASE "maCauHoi"
    WHEN '19000000-0000-0000-0000-000000000004' THEN 'Nghe audio và chọn lời chào bạn nghe được.'
    WHEN '19000000-0000-0000-0000-000000000014' THEN 'Book, pen, chair thuộc chủ đề nào?'
    WHEN '19000000-0000-0000-0000-000000000017' THEN 'Nghe audio và chọn chủ đề của đoạn nghe.'
    ELSE "noiDung"
  END,
  "giaiThichDapAn" = CASE "maCauHoi"
    WHEN '19000000-0000-0000-0000-000000000004' THEN 'Trong audio người nói dùng từ Hello.'
    WHEN '19000000-0000-0000-0000-000000000017' THEN 'Audio nói về daily routines.'
    ELSE "giaiThichDapAn"
  END;

UPDATE dapan
SET "noiDung" = CASE "noiDung"
  WHEN 'Toi la Khang' THEN 'Tôi là Khang'
  WHEN 'Rat vui duoc gap ban.' THEN 'Rất vui được gặp bạn.'
  WHEN 'Day la cay but cua toi' THEN 'Đây là cây bút của tôi'
  WHEN 'Do la cai ban' THEN 'Đó là cái bàn'
  WHEN 'cua toi' THEN 'của tôi'
  WHEN 'cua ban' THEN 'của bạn'
  WHEN 'Do vat trong lop hoc' THEN 'Đồ vật trong lớp học'
  WHEN 'Thanh vien gia dinh' THEN 'Thành viên gia đình'
  WHEN 'Hien tai don' THEN 'Hiện tại đơn'
  WHEN 'Qua khu don' THEN 'Quá khứ đơn'
  ELSE "noiDung"
END;

UPDATE goiyontap
SET "lyDo" = CASE "maGoiY"
  WHEN '20000000-0000-0000-0000-000000000001' THEN 'Học viên chưa đạt bài kiểm tra Bài 1, cần ôn lại mẫu câu hỏi tên và lời chào.'
  WHEN '20000000-0000-0000-0000-000000000002' THEN 'Học viên đang học Bài 3, nên ôn từ vựng father, mother và mẫu câu This is my...'
  ELSE "lyDo"
END;

UPDATE thongbao
SET
  "tieuDe" = CASE "maThongBao"
    WHEN '21000000-0000-0000-0000-000000000001' THEN 'Chúc mừng bạn đã hoàn thành Bài 1'
    WHEN '21000000-0000-0000-0000-000000000002' THEN 'Bài 3 đang chờ bạn tiếp tục'
    WHEN '21000000-0000-0000-0000-000000000003' THEN 'Học viên cần ôn tập'
    WHEN '21000000-0000-0000-0000-000000000004' THEN 'Bạn cần ôn lại Bài 1'
    ELSE "tieuDe"
  END,
  "noiDung" = CASE "maThongBao"
    WHEN '21000000-0000-0000-0000-000000000001' THEN 'Bạn đạt 100% trong bài kiểm tra Greetings và đã mở khóa Bài 2.'
    WHEN '21000000-0000-0000-0000-000000000002' THEN 'Hãy hoàn thành nhiệm vụ giới thiệu gia đình để làm bài kiểm tra.'
    WHEN '21000000-0000-0000-0000-000000000003' THEN 'Trần Minh Khang đã từng chưa đạt Bài 2 lần đầu nhưng đã đạt ở lần thứ hai.'
    WHEN '21000000-0000-0000-0000-000000000004' THEN 'Điểm hiện tại là 75%, cần đạt tối thiểu 80% để mở khóa bài tiếp theo.'
    ELSE "noiDung"
  END;

UPDATE huyhieuhoctap
SET
  "tenHuyHieu" = CASE "maCode"
    WHEN 'first-step' THEN 'Bước Đầu Vui Vẻ'
    WHEN 'pet-friend' THEN 'Bạn Thân Của Pingu'
    WHEN 'streak-5' THEN '5 Ngày Liên Tiếp'
    ELSE "tenHuyHieu"
  END,
  "moTa" = CASE "maCode"
    WHEN 'first-step' THEN 'Hoàn thành bài học đầu tiên.'
    WHEN 'quiz-master' THEN 'Đạt điểm tối thiểu 80% ở 3 bài kiểm tra.'
    WHEN 'pet-friend' THEN 'Cho pet ăn, chơi và học cùng pet trong 5 lần.'
    WHEN 'ai-explorer' THEN 'Sử dụng AI nhận diện hình ảnh để mở rộng từ vựng.'
    WHEN 'streak-5' THEN 'Duy trì chuỗi học trong 5 ngày liên tục.'
    ELSE "moTa"
  END,
  "dieuKien" = CASE "maCode"
    WHEN 'first-step' THEN 'Hoàn thành bài học đầu tiên'
    WHEN 'quiz-master' THEN 'Đạt 80% ở 3 quiz'
    WHEN 'pet-friend' THEN 'Tương tác với pet 5 lần'
    WHEN 'ai-explorer' THEN 'Phân tích 3 hình ảnh'
    WHEN 'streak-5' THEN 'Đạt chuỗi học 5 ngày'
    ELSE "dieuKien"
  END;

UPDATE nhiemvungay
SET
  "tieuDe" = CASE "maCode"
    WHEN 'daily-words-5' THEN 'Học 5 từ vựng mới'
    WHEN 'daily-quiz-1' THEN 'Làm 1 quiz ngẫu nhiên'
    WHEN 'daily-vision-1' THEN 'Gửi 1 ảnh cho AI'
    WHEN 'daily-pet-1' THEN 'Chăm sóc Pingu'
    ELSE "tieuDe"
  END,
  "moTa" = CASE "maCode"
    WHEN 'daily-words-5' THEN 'Chọn 5 từ vựng và đọc to để nhận điểm XP.'
    WHEN 'daily-quiz-1' THEN 'Làm một bài kiểm tra ngắn để giữ nhiệt học tập.'
    WHEN 'daily-vision-1' THEN 'Tải lên 1 hình ảnh và xem AI gợi ý từ vựng.'
    WHEN 'daily-pet-1' THEN 'Cho pet ăn hoặc chơi cùng pet để tăng gắn bó.'
    ELSE "moTa"
  END;

UPDATE minigame
SET "moTa" = CASE "maCode"
  WHEN 'flash-match' THEN 'Nối cực nhanh từ vựng và hình ảnh.'
  WHEN 'listen-bingo' THEN 'Nghe và chọn hình đúng trong thời gian giới hạn.'
  WHEN 'photo-lab' THEN 'Tải ảnh lên và nhận diện từ vựng bằng AI.'
  WHEN 'word-race' THEN 'Chạy đua với từ vựng và nhận điểm combo.'
  ELSE "moTa"
END;

UPDATE phantichhinhanh
SET
  "nghiaTiengViet" = CASE "tuKhoaNhanRa"
    WHEN 'book' THEN 'quyển sách'
    WHEN 'milk' THEN 'sữa'
    WHEN 'chair' THEN 'cái ghế'
    ELSE "nghiaTiengViet"
  END,
  "yTuongTuVung" = CASE "tuKhoaNhanRa"
    WHEN 'book' THEN 'Từ vựng đồ vật lớp học'
    WHEN 'milk' THEN 'Đồ ăn và đồ uống'
    WHEN 'chair' THEN 'Đồ vật trong lớp học'
    ELSE "yTuongTuVung"
  END;
