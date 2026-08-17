-- Corgi Cafe — accept the photo formats phones actually produce.
--
-- The recognition-media bucket was created allowing only image/jpeg, image/png, image/webp.
-- iPhones capture HEIC/HEIF by default, and some file pickers send an empty or octet-stream
-- content type, so a real "Take Photo" upload was rejected by storage with 415
-- (invalid_mime_type) and the photo silently failed to save. Broaden the allow-list; the API
-- route additionally normalises the content type so a supported image type is always sent.
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
  where id = 'recognition-media';
