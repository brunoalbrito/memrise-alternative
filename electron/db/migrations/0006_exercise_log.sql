-- Which kind of exercise produced each answer.
ALTER TABLE review_log ADD COLUMN exercise TEXT NOT NULL DEFAULT 'type';
