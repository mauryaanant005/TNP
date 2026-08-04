# Customizations

Whenever I am asked to "re run docker", I must:
1. Re-run docker containers (e.g. `docker-compose down; docker-compose up -d --build`).
2. Run the faculty import script (e.g. `docker exec t_and_p_task_automation-main-backend-1 python import_faculty.py`) to add the faculty data with their respective roles.
3. Run the dummy students seed script (e.g. `docker exec t_and_p_task_automation-main-backend-1 python seed_dummy_students.py`) to add the dummy student data.
