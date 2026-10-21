-- =============================================
-- Test Data Seed Script with CUID-style IDs
-- =============================================

-- Optional: Clear existing data before seeding
TRUNCATE TABLE "GenresOnBooks", "Review", "Book", "Genre" RESTART IDENTITY CASCADE;

-- =============================================
-- Insert Genres
-- =============================================
INSERT INTO "Genre" ("id", "createdAt", "name") VALUES
  ('clgenfntsy001', NOW(), 'Fantasy'),
  ('clgenscifi002', NOW(), 'Science Fiction'),
  ('clgenmstry003', NOW(), 'Mystery'),
  ('clgennonfic004', NOW(), 'Non-fiction');

-- =============================================
-- Insert Books
-- =============================================
INSERT INTO "Book" ("id", "createdAt", "updatedAt", "title", "isbn", "publishedAt", "price", "inStock") VALUES
  ('clbook001', NOW(), NOW(), 'The Winds of Magic', '9780000000011', '2015-06-15', 19.99, TRUE),
  ('clbook002', NOW(), NOW(), 'Galactic Horizons', '9780000000012', '2018-09-20', 24.50, TRUE),
  ('clbook003', NOW(), NOW(), 'The Hidden Key', '9780000000013', '2020-01-05', 15.75, FALSE),
  ('clbook004', NOW(), NOW(), 'Mindful Living', '9780000000014', '2022-07-10', 22.00, TRUE);

-- =============================================
-- Insert Reviews
-- =============================================
INSERT INTO "Review" ("id", "createdAt", "updatedAt", "bookId", "rating", "text") VALUES
  ('clrev0001', NOW(), NOW(), 'clbook001', 5, 'Absolutely loved the world-building and characters.'),
  ('clrev0002', NOW(), NOW(), 'clbook001', 4, 'Great fantasy novel with a few pacing issues.'),
  ('clrev0003', NOW(), NOW(), 'clbook002', 5, 'A stunning sci-fi adventure with deep themes.'),
  ('clrev0004', NOW(), NOW(), 'clbook003', 3, 'Decent mystery, though the ending was predictable.');

-- =============================================
-- Link Books to Genres (GenresOnBooks)
-- =============================================
INSERT INTO "GenresOnBooks" ("bookId", "genreId") VALUES
  ('clbook001', 'clgenfntsy001'),
  ('clbook002', 'clgenscifi002'),
  ('clbook003', 'clgenmstry003'),
  ('clbook002', 'clgenfntsy001'); -- Book 2 has multiple genres