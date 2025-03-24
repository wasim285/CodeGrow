# Local development settings that override settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Force SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Turn on debugging
DEBUG = True