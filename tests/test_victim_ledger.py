"""Victim ledger contracts (demo-site/dbsim.py).

No overdrafts, every debit journaled, reset reseeds. Runs the dbsim
FastAPI app in-process — no network, no supervisor needed.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "demo-site"))

from fastapi.testclient import TestClient

import dbsim

client = TestClient(dbsim.app)


class LedgerTests(unittest.TestCase):
    def setUp(self):
        client.post("/ledger/reset")
        client.post("/fault", json={"type": "clear"})

    def test_debit_reduces_and_journals(self):
        r = client.post("/debit", json={"acct": "alice", "amount": 10.0})
        self.assertTrue(r.json()["ok"])
        self.assertAlmostEqual(r.json()["balance"], 9990.0)
        tx = client.get("/transactions").json()["transactions"]
        self.assertTrue(any(t["acct"] == "alice" and t["ok"] for t in tx))

    def test_overdraft_rejected_balance_unchanged(self):
        r = client.post("/debit", json={"acct": "alice", "amount": 999999.0})
        body = r.json()
        self.assertFalse(body["ok"])
        self.assertEqual(body["error"], "insufficient funds")
        bal = client.get("/balance", params={"acct": "alice"}).json()
        self.assertAlmostEqual(bal["balance"], 10000.0)

    def test_credit_increases_and_journals(self):
        r = client.post("/credit", json={"acct": "bob", "amount": 250.0})
        body = r.json()
        self.assertTrue(body["ok"])
        self.assertAlmostEqual(body["balance"], 5250.0)
        tx = client.get("/transactions").json()["transactions"]
        self.assertTrue(
            any(t["acct"] == "bob" and t["ok"] and t.get("kind") == "credit" for t in tx)
        )

    def test_credit_rejects_non_positive_amount(self):
        r = client.post("/credit", json={"acct": "bob", "amount": -50.0})
        body = r.json()
        self.assertFalse(body["ok"])
        bal = client.get("/balance", params={"acct": "bob"}).json()
        self.assertAlmostEqual(bal["balance"], 5000.0)

    def test_faucet_spend_never_journals(self):
        r = client.post("/debit", json={"acct": "faucet", "amount": 1.0})
        self.assertTrue(r.json()["ok"])
        tx = client.get("/transactions").json()["transactions"]
        self.assertFalse(any(t["acct"] == "faucet" for t in tx))
        client.post("/debit", json={"acct": "alice", "amount": 5.0})
        tx = client.get("/transactions").json()["transactions"]
        self.assertTrue(any(t["acct"] == "alice" for t in tx))

    def test_reset_reseeds_and_clears_history(self):
        client.post("/debit", json={"acct": "bob", "amount": 100.0})
        r = client.post("/ledger/reset").json()
        self.assertTrue(r["ok"])
        self.assertAlmostEqual(r["balances"]["alice"], 10000.0)
        self.assertAlmostEqual(
            client.get("/balance", params={"acct": "bob"}).json()["balance"], 5000.0
        )
        self.assertEqual(client.get("/transactions").json()["transactions"], [])


if __name__ == "__main__":
    unittest.main()
