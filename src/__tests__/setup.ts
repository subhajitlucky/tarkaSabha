process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ?? 'test_encryption_key_with_at_least_32_chars'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/test'
