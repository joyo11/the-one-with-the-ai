FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Mirror the local layout: agents/app.py reads ../STATUS.md and ../TIMELINE.md
COPY agents/      /app/agents/
COPY STATUS.md    /app/STATUS.md
COPY TIMELINE.md  /app/TIMELINE.md
COPY main.py      /app/main.py

EXPOSE 7860
CMD ["python", "main.py"]
