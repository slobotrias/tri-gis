#### Stage 1 ####
FROM node:20.11.1 AS build

# copy the package.json to install dependencies
COPY tri-gis-frontend/package.json tri-gis-frontend/package-lock.json ./

# Install the dependencies and make the folder
RUN npm install --legacy-peer-deps && mkdir /app && mv ./node_modules ./app

# Set Default Work Directory
WORKDIR /app

# Copy all the Work Directory contents
COPY . .

# Create a App Build
RUN npm run build

#### Stage 2 ####
FROM nginx:1.24.0

#!/bin/sh
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stage 1
COPY --from=build /app/dist/tri-apex /usr/share/nginx/html

# Expose Port
EXPOSE 80
