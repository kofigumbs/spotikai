FROM node:12.18

WORKDIR /app
COPY package*.json ./
RUN npm install

RUN apt-get update && apt-get install -y build-essential libasound2-dev
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"
RUN cargo install librespot --version 0.1.1 --locked

COPY . .
