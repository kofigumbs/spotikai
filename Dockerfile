FROM node:12.18	

RUN apt-get update && apt-get install -y build-essential libasound2-dev	
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y	
ENV PATH="/root/.cargo/bin:$PATH"	

WORKDIR /app

COPY librespot ./librespot
COPY src/librespot.patch ./src/
RUN cd librespot && \
      rm -rf .git && \
      git init && \
      git apply ../src/librespot.patch && \
      cargo build --release

COPY package*.json ./	
RUN npm install	

COPY src ./src
COPY www ./www
CMD node src/index.js
