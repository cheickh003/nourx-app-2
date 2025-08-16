from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from rest_framework.test import APIClient

from apps.clients.models import Client, ClientMember
from apps.projects.models import Project
from apps.documents.models import Document


class TestDocumentsAPI(TestCase):
    def setUp(self):
        self.api = APIClient()
        # Users
        self.user = User.objects.create_user("clientuser", password="pass")
        self.staff = User.objects.create_user("staff", password="pass", is_staff=True)
        # Clients & projects
        self.client_a = Client.objects.create(
            name="Client A", email="a@a.test", main_contact_name="A", main_contact_email="a@a.test", status="active"
        )
        self.client_b = Client.objects.create(
            name="Client B", email="b@b.test", main_contact_name="B", main_contact_email="b@b.test", status="active"
        )
        ClientMember.objects.create(user=self.user, client=self.client_a, role="admin")
        self.pa = Project.objects.create(client=self.client_a, title="P1")
        self.pb = Project.objects.create(client=self.client_b, title="P2")
        # Docs
        self.doc_a_pub = Document.objects.create(
            project=self.pa,
            title="Doc A",
            file_name="a.txt",
            file_size=10,
            mime_type="text/plain",
            visibility="public",
        )
        self.doc_a_int = Document.objects.create(
            project=self.pa,
            title="Doc A internal",
            file_name="ai.txt",
            file_size=10,
            mime_type="text/plain",
            visibility="internal",
        )
        self.doc_b = Document.objects.create(
            project=self.pb,
            title="Doc B",
            file_name="b.txt",
            file_size=10,
            mime_type="text/plain",
            visibility="public",
        )

    def test_list_scoping_for_client(self):
        self.api.force_authenticate(self.user)
        resp = self.api.get("/api/documents/")
        self.assertEqual(resp.status_code, 200)
        titles = [d["title"] for d in resp.data.get("results", resp.data)]
        self.assertIn("Doc A", titles)
        self.assertNotIn("Doc A internal", titles)  # internal excluded for clients
        self.assertNotIn("Doc B", titles)  # other client's document

    def test_list_for_staff(self):
        self.api.force_authenticate(self.staff)
        resp = self.api.get("/api/documents/")
        self.assertEqual(resp.status_code, 200)
        titles = [d["title"] for d in resp.data.get("results", resp.data)]
        self.assertIn("Doc A", titles)
        self.assertIn("Doc A internal", titles)
        self.assertIn("Doc B", titles)

    @patch("apps.documents.views._boto3_client")
    def test_download_url_presigned(self, mock_boto):
        self.api.force_authenticate(self.user)
        # set metadata to allow presign
        self.doc_a_pub.s3_bucket = "nourx-bucket"
        self.doc_a_pub.s3_key = "key/doc"
        self.doc_a_pub.save()
        mock_boto.return_value.generate_presigned_url.return_value = "http://example.com/presigned"
        resp = self.api.get(f"/api/documents/{self.doc_a_pub.id}/download_url/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("url", resp.data)
