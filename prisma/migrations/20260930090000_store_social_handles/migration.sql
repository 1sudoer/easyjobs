-- Store LinkedIn and GitHub profiles as bare handles ("jordantaylor") instead
-- of URLs. The app builds the profile addresses from the handle; see
-- src/lib/social-profiles.ts, whose extraction rules this mirrors.

-- A profile URL is cut down to its handle and a leading "@" is dropped; any
-- other text is kept as it is.
CREATE FUNCTION pg_temp.social_handle(value text, url_prefix text) RETURNS text AS $$
  SELECT NULLIF(
    regexp_replace(
      CASE
        WHEN btrim(value) ~* url_prefix
          THEN regexp_replace(regexp_replace(btrim(value), url_prefix, '', 'i'), '[/?#].*$', '')
        ELSE btrim(value)
      END,
      '^@', ''),
    '')
$$ LANGUAGE sql IMMUTABLE;

UPDATE "JobProfile" SET
  "linkedin" = pg_temp.social_handle("linkedin", '^(https?://)?([a-z]{2,3}\.|www\.)?linkedin\.com/(in|pub)/'),
  "github"   = pg_temp.social_handle("github",   '^(https?://)?(www\.)?github\.com/')
WHERE "linkedin" IS NOT NULL OR "github" IS NOT NULL;

UPDATE "Resume" SET "contactInfo" = "contactInfo"
  || jsonb_build_object(
       'linkedin', pg_temp.social_handle("contactInfo"->>'linkedin', '^(https?://)?([a-z]{2,3}\.|www\.)?linkedin\.com/(in|pub)/'),
       'github',   pg_temp.social_handle("contactInfo"->>'github',   '^(https?://)?(www\.)?github\.com/'))
WHERE jsonb_typeof("contactInfo") = 'object'
  AND ("contactInfo" ? 'linkedin' OR "contactInfo" ? 'github');
