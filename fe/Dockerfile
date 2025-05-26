FROM node:14

WORKDIR /app

# Copy package.json để tận dụng cache của Docker
COPY package.json ./

# Cài đặt dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables cho React
ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://backend:8000/api/v1
ENV WATCHPACK_POLLING=true
ENV CI=false

EXPOSE 3000

# Chạy frontend development server
CMD ["npm", "start"]
