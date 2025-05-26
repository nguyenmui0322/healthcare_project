FROM python:3.9

WORKDIR /app

# Cài đặt các dependencies cần thiết
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Đặt biến môi trường để không sử dụng GPU cho tensorflow
ENV CUDA_VISIBLE_DEVICES=-1
ENV TF_CPP_MIN_LOG_LEVEL=2

# Tạo thư mục cần thiết
RUN mkdir -p static
RUN mkdir -p media

COPY . .

EXPOSE 8000

# Trong chế độ phát triển, sử dụng runserver thay vì gunicorn
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]