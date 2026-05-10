# Evalix Backend

Django + DRF backend for the Evalix online judging platform.

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations
python manage.py makemigrations api
python manage.py migrate

# 4. Create a superadmin
python manage.py createsuperuser

# 5. Run dev server
python manage.py runserver
```

## API Reference

All routes are prefixed with `/api/`.

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register/` | Public | Register (student or judge) |
| POST | `/api/auth/login/` | Public | Returns JWT access + refresh tokens |
| POST | `/api/auth/logout/` | Auth | Blacklists refresh token |
| POST | `/api/auth/refresh/` | Public | Get new access token |
| GET/PATCH | `/api/auth/me/` | Auth | View/update own profile |

### Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users/` | Admin | List all users |
| GET/PATCH/DELETE | `/api/admin/users/<id>/` | Admin | Manage user |
| POST | `/api/admin/users/<id>/promote/` | Admin | Change user role |

### Contests

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/contests/` | Auth | List all contests |
| POST | `/api/contests/` | Admin | Create contest |
| GET | `/api/contests/<id>/` | Auth | Contest detail |
| PATCH/DELETE | `/api/contests/<id>/` | Admin | Edit/delete contest |
| POST | `/api/contests/<id>/enroll/` | Student | Enroll in contest |
| GET | `/api/contests/<id>/leaderboard/` | Auth | Contest leaderboard |
| GET | `/api/contests/<id>/my_results/` | Auth | Own scores in contest |

### Questions

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/questions/?contest=<id>` | Auth | Questions (students: active only) |
| POST | `/api/questions/` | Admin | Create question |
| PATCH/DELETE | `/api/questions/<id>/` | Admin | Edit/delete question |

### Submissions

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/submissions/` | Student | Submit answer |
| GET | `/api/submissions/` | Auth | Students: own only; Judge/Admin: all |
| GET | `/api/submissions/?contest=<id>&status=pending` | Judge/Admin | Filter submissions |
| PATCH | `/api/submissions/<id>/update_status/` | Judge/Admin | Mark under_review |

### Scores (Judge)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/scores/` | Judge/Admin | Score a submission |
| PATCH | `/api/scores/<id>/` | Judge/Admin | Update score |
| GET | `/api/scores/` | Judge/Admin | View all scores |
| DELETE | `/api/scores/<id>/` | Admin | Remove score |
| GET | `/api/judge/dashboard/` | Judge/Admin | Pending submissions queue |

## Authentication

Send the JWT token in every protected request:

```
Authorization: Bearer <access_token>
```

## Role Summary

| Feature | Student | Judge | Admin |
|---------|---------|-------|-------|
| Register/Login | ✅ | ✅ | ✅ |
| View contests/questions | ✅ | ✅ | ✅ |
| Enroll in contest | ✅ | ❌ | ❌ |
| Submit answers | ✅ | ❌ | ❌ |
| View own submissions | ✅ | ❌ | ❌ |
| View all submissions | ❌ | ✅ | ✅ |
| Score submissions | ❌ | ✅ | ✅ |
| Judge dashboard | ❌ | ✅ | ✅ |
| Create contests/questions | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Promote user roles | ❌ | ❌ | ✅ |

## Project Structure

```
evalix/
├── manage.py
├── requirements.txt
├── db.sqlite3              (auto-created on first migrate)
├── evalix/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── api/
    ├── models.py           # User, Contest, Question, Submission, Score, Leaderboard
    ├── serializers.py      # Request/response schemas + validation
    ├── views.py            # All API views and viewsets
    ├── urls.py             # URL routing
    ├── permissions.py      # Role-based permission classes
    └── admin.py            # Django admin registration
```
