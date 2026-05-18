-- Doi anh minh hoa Bai 4 sang bo anh curated dung ngu canh.
-- Them query version de trinh duyet khong dung lai cache anh cu tu API ngoai.

BEGIN;

UPDATE tuvung
SET "hinhAnh" = CASE tu
  WHEN 'brush' THEN '/media/images/brush.png?v=curated2'
  WHEN 'get up' THEN '/media/images/get-up.png?v=curated2'
  WHEN 'go to school' THEN '/media/images/go-to-school.png?v=curated2'
  WHEN 'sleep' THEN '/media/images/sleep.png?v=curated2'
  WHEN 'study' THEN '/media/images/study.png?v=curated2'
  ELSE "hinhAnh"
END
WHERE "maBaiHoc" = '13000000-0000-0000-0000-000000000004'
  AND tu IN ('brush', 'get up', 'go to school', 'sleep', 'study');

COMMIT;
