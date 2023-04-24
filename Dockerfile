FROM node:18

# Create Directory
WORKDIR /app

# Install App Dependencies
COPY package.json /app
RUN npm install

# Bundle App Source
COPY . /app

CMD ["npm", "start"]