FROM node:10
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY .browserslistrc.packages .
RUN yarn
EXPOSE 80
EXPOSE 9999
CMD yarn start