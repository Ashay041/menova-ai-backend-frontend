from pprint import pprint
from database.db_dao import *
from database.db import get_mongo_database
from database.schema import *


db = get_mongo_database()


TEST_USER = {
    "user_name": "testuser123",
    "user_email": "testuser@example.com",
    "password": "securepass123"
}

# Store generated user_id
user_id = generate_user_id(TEST_USER["user_name"])

# ─── Test Functions ───────────────────────────────────────────

def test_add_user():
    print("🔧 Running test_add_user...")
    inserted_id = add_user(db, TEST_USER["user_name"], TEST_USER["user_email"], TEST_USER["password"])
    print(f"✅ User inserted with ID: {inserted_id}\n")
    return inserted_id


def test_save_single_raw_interaction():
    print("💬 Running test_save_single_raw_interaction...")
    inserted_id = save_user_interaction_raw(
        db,
        TEST_USER["user_name"],
        "What is PCOS?",
        "PCOS is a hormonal disorder.",
        metadata={"source": "test"}
    )
    print(f"✅ Raw interaction ID: {inserted_id}\n")
    return inserted_id


def test_save_multiple_raw_interactions():
    print("💬 Running test_save_multiple_raw_interactions...")
    prompts = ["What causes PCOS?", "Can PCOS be cured?"]
    answers = ["Hormonal imbalance.", "No cure, but it can be managed."]
    inserted_ids = save_user_interaction_raw_many(
        db,
        TEST_USER["user_name"],
        prompts,
        answers,
        metadata={"source": "test_batch"}
    )
    print(f"✅ Multiple raw interactions saved: {inserted_ids}\n")
    return inserted_ids


def test_fetch_raw_interactions(limit=5):
    print(f"📥 Running test_fetch_raw_interactions (limit={limit})...")
    interactions = get_user_interactions_raw(db, TEST_USER["user_name"], limit)
    print()
    return interactions


def test_save_single_summary():
    print("📝 Running test_save_single_summary...")
    inserted_id = save_user_interaction_summary(
        db,
        TEST_USER["user_name"],
        "User asked about causes and treatment of PCOS.",
        metadata={"summary_source": "test"}
    )
    print(f"✅ Summary inserted with ID: {inserted_id}\n")
    return inserted_id


def test_save_multiple_summaries():
    print("📝 Running test_save_multiple_summaries...")
    summaries = [
        "PCOS is caused by hormonal imbalance.",
        "Lifestyle and medication can manage PCOS."
    ]
    inserted_ids = save_user_interaction_summary_many(
        db,
        TEST_USER["user_name"],
        summaries,
        metadata={"batch": "summary_test"}
    )
    print(f"✅ Summaries saved with IDs: {inserted_ids}\n")
    return inserted_ids


def test_fetch_summaries(limit=5):
    print(f"📥 Running test_fetch_summaries (limit={limit})...")
    summaries = get_user_interactions_summary(db, TEST_USER["user_name"], limit)
    print()
    return summaries


def test_delete_one_by_user_id():
    deleted_count = delete_user(db, TEST_USER["user_name"])
    print(f"🗑️ Deleted count (user_id): {deleted_count}")
    return deleted_count


def test_delete_all_user_interactions():
    deleted_raw = delete_all_user_interactions_raw(db)
    deleted_summary = delete_all_user_interactions_summary(db)
    print(f" Deleted Raw: {deleted_raw}, Summary: {deleted_summary}")
    return deleted_raw + deleted_summary


# ─── Optional Test Runner ────────────────────────────────────

def run_all_tests():
    test_add_user()
    test_save_single_raw_interaction()
    test_save_multiple_raw_interactions()
    test_fetch_raw_interactions()
    test_save_single_summary()
    test_save_multiple_summaries()
    test_fetch_summaries()
    test_delete_all_user_interactions()
    test_delete_one_by_user_id()


if __name__ == "__main__":
    run_all_tests()