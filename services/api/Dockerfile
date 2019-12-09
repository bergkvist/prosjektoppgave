FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7-2019-10-15
WORKDIR /app
RUN pip install pandapower fastapi uvicorn numpy tqdm pandas scipy matplotlib seaborn requests xlrd email-validator numba
RUN pip install aiofiles
EXPOSE 80
COPY ./ ./
ENTRYPOINT /start-reload.sh