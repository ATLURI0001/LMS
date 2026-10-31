"""Create a first administrator without demo users. Run from backend/."""

from getpass import getpass
from database import Store
from security import hash_password
from service import password, text

if __name__ == "__main__":
    db = Store()
    db.initialize()
    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()
    import re

    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise SystemExit("Invalid email")
    db.insert(
        "users",
        {
            "email": email,
            "name": text({"name": name}, "name", 2, 80),
            "password_hash": hash_password(
                password({"password": getpass("Password (12+ characters): ")})
            ),
            "role": "admin",
            "active": True,
        },
    )
    db.conn.commit()
    db.conn.close()
    print("Administrator created.")
