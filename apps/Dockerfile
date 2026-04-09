FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  ca-certificates curl gnupg \
  xvfb xauth \
  fonts-noto-cjk fonts-noto-color-emoji \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libgtk-3-0 libx11-xcb1 \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub \
  | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-key.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-key.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
  > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

COPY apps/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY apps/api.py /app/api.py
COPY apps/lemonsqueezy.py /app/lemonsqueezy.py
COPY apps/paypal.py /app/paypal.py
COPY apps/supabase_store.py /app/supabase_store.py
COPY apps/telegram_bot.py /app/telegram_bot.py
COPY apps/worker.py /app/worker.py
COPY apps/tasks.py /app/tasks.py
COPY apps/index.html /app/index.html
COPY run.py /app/run.py
COPY actions.py /app/actions.py
COPY fingerprint.py /app/fingerprint.py
COPY solve_captcha.py /app/solve_captcha.py
COPY capsolver_client.py /app/capsolver_client.py
COPY script /app/script

ENV REDIS_URL=redis://redis:6379/0
ENV RQ_QUEUE=jobs
ENV CHROME_PATH=/usr/bin/google-chrome

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
