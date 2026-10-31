FROM python:3.12-slim
WORKDIR /app
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home app && mkdir -p /data && chown app:app /data
COPY --chown=app:app . .
USER app
ENV DATABASE_PATH=/data/ascent.db
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
