import unittest

from app.services import migration_service


class MigrationServiceTests(unittest.TestCase):
    def test_clean_import_payload_normalizes_and_deduplicates(self):
        payload = [
            {"name": "Acme Corp", "email": "  ACME@EXAMPLE.COM  ", "company": "Acme Corp", "phone": ""},
            {"name": "Acme Corp", "email": "acme@example.com", "company": "Acme Corp", "phone": "123"},
            {"name": "Beta LLC", "email": "beta@example.com", "company": "Beta LLC", "phone": "456"},
        ]

        cleaned = migration_service.clean_import_payload(payload)

        self.assertEqual(len(cleaned), 2)
        self.assertEqual(cleaned[0]["email"], "acme@example.com")
        self.assertEqual(cleaned[0]["company"], "Acme Corp")
        self.assertEqual(cleaned[0]["phone"], "")
        self.assertEqual(cleaned[1]["name"], "Beta LLC")


if __name__ == "__main__":
    unittest.main()
